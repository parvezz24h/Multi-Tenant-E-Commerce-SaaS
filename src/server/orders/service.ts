import "server-only";

import type { OrderStatus, PaymentStatus, Prisma } from "@/generated/prisma/client";
import { startOfDhakaDay } from "@/lib/datetime";
import { db } from "@/lib/db";
import { canTransition, ORDER_STATUS_LABELS, RESTOCKING_STATUSES } from "@/lib/order-status";
import { recordAudit } from "@/server/audit/log";
import { adjustStock } from "@/server/catalog/inventory";
import { AppError } from "@/server/errors";
import type { StoreContext } from "@/server/tenant/context";

export const ORDERS_PAGE_SIZE = 20;

/** Orders that count toward revenue. */
const COUNTED: Prisma.OrderWhereInput = { status: { notIn: ["CANCELLED", "RETURNED"] } };

function searchWhere(q: string): Prisma.OrderWhereInput {
  const number = Number.parseInt(q.replace(/^#/, ""), 10);
  return {
    OR: [
      ...(Number.isFinite(number) && /^#?\d+$/.test(q) ? [{ orderNumber: number }] : []),
      { phone: { contains: q.replace(/[\s-]/g, "") } },
      { customerName: { contains: q, mode: "insensitive" } },
    ],
  };
}

export async function listOrders(
  storeId: string,
  opts: { status?: OrderStatus; q?: string; page?: number },
) {
  const where: Prisma.OrderWhereInput = {
    storeId,
    ...(opts.status && { status: opts.status }),
    ...(opts.q && searchWhere(opts.q)),
  };
  const total = await db.order.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / ORDERS_PAGE_SIZE));
  const page = Math.min(Math.max(1, opts.page ?? 1), pageCount);
  const items = await db.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * ORDERS_PAGE_SIZE,
    take: ORDERS_PAGE_SIZE,
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      total: true,
      customerName: true,
      phone: true,
      district: true,
      createdAt: true,
      _count: { select: { items: true } },
    },
  });
  return { items, total, page, pageCount };
}

export async function countOrdersByStatus(storeId: string) {
  const rows = await db.order.groupBy({ by: ["status"], where: { storeId }, _count: true });
  return Object.fromEntries(rows.map((r) => [r.status, r._count])) as Partial<Record<OrderStatus, number>>;
}

export async function getOrder(storeId: string, orderNumber: number) {
  const order = await db.order.findUnique({
    where: { storeId_orderNumber: { storeId, orderNumber } },
    include: {
      items: { orderBy: { id: "asc" } },
      events: { orderBy: { createdAt: "asc" } },
      customer: { select: { id: true, name: true, _count: { select: { orders: true } } } },
    },
  });
  if (!order) return null;

  const actorIds = [...new Set(order.events.map((e) => e.actorId).filter((v): v is string => !!v))];
  const actors = actorIds.length
    ? await db.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true } })
    : [];
  const actorNames = new Map(actors.map((a) => [a.id, a.name]));
  return {
    ...order,
    events: order.events.map((e) => ({ ...e, actorName: e.actorId ? actorNames.get(e.actorId) : null })),
  };
}

function nextPaymentStatus(current: PaymentStatus, to: OrderStatus): PaymentStatus {
  // Cash is collected on delivery; a return after that is refunded.
  if (to === "DELIVERED") return "PAID";
  if (to === "RETURNED" && current === "PAID") return "REFUNDED";
  return current;
}

export async function updateOrderStatus(
  ctx: StoreContext,
  orderId: string,
  to: OrderStatus,
  note: string | null,
) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: orderId, storeId: ctx.store.id },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        items: { select: { productId: true, quantity: true } },
      },
    });
    if (!order) throw new AppError("NOT_FOUND", "Order not found.");
    if (!canTransition(order.status, to)) {
      throw new AppError(
        "INVALID",
        `A ${ORDER_STATUS_LABELS[order.status].toLowerCase()} order can't be marked ${ORDER_STATUS_LABELS[to].toLowerCase()}.`,
      );
    }

    // Guard against two people changing the same order at once.
    const { count } = await tx.order.updateMany({
      where: { id: order.id, status: order.status },
      data: { status: to, paymentStatus: nextPaymentStatus(order.paymentStatus, to) },
    });
    if (count === 0) throw new AppError("CONFLICT", "This order was just updated. Refresh and try again.");

    if (RESTOCKING_STATUSES.has(to)) {
      for (const item of order.items) {
        if (!item.productId) continue; // product was deleted
        await adjustStock(tx, {
          storeId: ctx.store.id,
          productId: item.productId,
          delta: item.quantity,
          reason: to === "CANCELLED" ? "ORDER_CANCELLED" : "ORDER_RETURNED",
          orderId: order.id,
          actorId: ctx.user.id,
        });
      }
    }

    await tx.orderEvent.create({
      data: { orderId: order.id, fromStatus: order.status, toStatus: to, note, actorId: ctx.user.id },
    });
    await recordAudit(
      {
        storeId: ctx.store.id,
        actorId: ctx.user.id,
        action: "order.status_changed",
        entityType: "Order",
        entityId: order.id,
        metadata: { orderNumber: order.orderNumber, from: order.status, to },
      },
      tx,
    );
  });
}

export async function updateMerchantNote(ctx: StoreContext, orderId: string, note: string | null) {
  const { count } = await db.order.updateMany({
    where: { id: orderId, storeId: ctx.store.id },
    data: { merchantNote: note },
  });
  if (count === 0) throw new AppError("NOT_FOUND", "Order not found.");
}

/** Numbers for the dashboard overview. */
export async function getOrderStats(storeId: string) {
  const today = startOfDhakaDay();
  const [todayAgg, openCount, recent] = await Promise.all([
    db.order.aggregate({
      where: { storeId, createdAt: { gte: today }, ...COUNTED },
      _count: true,
      _sum: { total: true },
    }),
    db.order.count({ where: { storeId, status: { in: ["PENDING", "CONFIRMED", "PROCESSING"] } } }),
    db.order.findMany({
      where: { storeId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        customerName: true,
        createdAt: true,
      },
    }),
  ]);
  return {
    todayOrders: todayAgg._count,
    todayRevenue: todayAgg._sum.total ?? 0,
    openOrders: openCount,
    recent,
  };
}
