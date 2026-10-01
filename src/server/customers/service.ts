import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { recordAudit } from "@/server/audit/log";
import { AppError } from "@/server/errors";
import type { StoreContext } from "@/server/tenant/context";

export const CUSTOMERS_PAGE_SIZE = 25;

const COUNTED_ORDER: Prisma.OrderWhereInput = { status: { notIn: ["CANCELLED", "RETURNED"] } };

/** Lifetime spend per customer (excluding cancelled/returned orders). */
async function spendByCustomer(storeId: string, customerIds: string[]) {
  if (customerIds.length === 0) return new Map<string, number>();
  const rows = await db.order.groupBy({
    by: ["customerId"],
    where: { storeId, customerId: { in: customerIds }, ...COUNTED_ORDER },
    _sum: { total: true },
  });
  return new Map(rows.map((r) => [r.customerId!, r._sum.total ?? 0]));
}

export async function listCustomers(storeId: string, opts: { q?: string; page?: number }) {
  const q = opts.q?.trim();
  const where: Prisma.CustomerWhereInput = {
    storeId,
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { phone: { contains: q.replace(/[\s-]/g, "") } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    }),
  };

  const total = await db.customer.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / CUSTOMERS_PAGE_SIZE));
  const page = Math.min(Math.max(1, opts.page ?? 1), pageCount);
  const rows = await db.customer.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * CUSTOMERS_PAGE_SIZE,
    take: CUSTOMERS_PAGE_SIZE,
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      createdAt: true,
      _count: { select: { orders: true } },
      orders: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
    },
  });
  const spend = await spendByCustomer(storeId, rows.map((r) => r.id));
  const items = rows.map(({ _count, orders, ...c }) => ({
    ...c,
    orderCount: _count.orders,
    lastOrderAt: orders[0]?.createdAt ?? null,
    totalSpent: spend.get(c.id) ?? 0,
  }));
  return { items, total, page, pageCount };
}

export async function getCustomer(storeId: string, customerId: string) {
  const customer = await db.customer.findFirst({
    where: { id: customerId, storeId },
    include: {
      addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] },
      orders: {
        orderBy: { createdAt: "desc" },
        take: 50,
        select: { id: true, orderNumber: true, status: true, total: true, createdAt: true },
      },
    },
  });
  if (!customer) return null;
  const spend = await spendByCustomer(storeId, [customer.id]);
  return { ...customer, totalSpent: spend.get(customer.id) ?? 0 };
}

export async function updateCustomer(
  ctx: StoreContext,
  customerId: string,
  input: { name: string; email: string | null; note: string | null },
) {
  await db.$transaction(async (tx) => {
    const { count } = await tx.customer.updateMany({
      where: { id: customerId, storeId: ctx.store.id },
      data: input,
    });
    if (count === 0) throw new AppError("NOT_FOUND", "Customer not found.");
    await recordAudit(
      {
        storeId: ctx.store.id,
        actorId: ctx.user.id,
        action: "customer.updated",
        entityType: "Customer",
        entityId: customerId,
      },
      tx,
    );
  });
}

export async function countCustomers(storeId: string) {
  return db.customer.count({ where: { storeId } });
}
