import "server-only";

import type { InventoryReason, Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { recordAudit } from "@/server/audit/log";
import { AppError } from "@/server/errors";
import type { StoreContext } from "@/server/tenant/context";

import { LOW_STOCK_THRESHOLD, MAX_STOCK, type StockAdjustmentInput } from "./schemas";

type Adjustment = {
  storeId: string;
  productId: string;
  /** Positive adds stock, negative removes it. */
  delta: number;
  reason: InventoryReason;
  note?: string | null;
  orderId?: string | null;
  actorId?: string | null;
};

/**
 * The only way stock should change. Updates Product.stock atomically and
 * records an InventoryAdjustment. Removing more than is in stock fails
 * instead of going negative (the check happens in the same UPDATE, so
 * concurrent orders can't oversell).
 */
export async function adjustStock(tx: Prisma.TransactionClient, adj: Adjustment) {
  if (!Number.isInteger(adj.delta) || adj.delta === 0) {
    throw new AppError("INVALID", "Enter a quantity greater than 0.");
  }

  const updated = await tx.product.updateMany({
    where: {
      id: adj.productId,
      storeId: adj.storeId,
      ...(adj.delta < 0 ? { stock: { gte: -adj.delta } } : { stock: { lte: MAX_STOCK - adj.delta } }),
    },
    data: { stock: { increment: adj.delta } },
  });

  if (updated.count === 0) {
    const exists = await tx.product.count({ where: { id: adj.productId, storeId: adj.storeId } });
    if (!exists) throw new AppError("NOT_FOUND", "Product not found.");
    throw new AppError(
      "INVALID",
      adj.delta < 0 ? "Not enough stock." : `Stock can't exceed ${MAX_STOCK.toLocaleString("en-US")}.`,
    );
  }

  const { stock } = await tx.product.findUniqueOrThrow({
    where: { id: adj.productId },
    select: { stock: true },
  });

  await tx.inventoryAdjustment.create({
    data: {
      storeId: adj.storeId,
      productId: adj.productId,
      delta: adj.delta,
      stockAfter: stock,
      reason: adj.reason,
      note: adj.note ?? null,
      orderId: adj.orderId ?? null,
      actorId: adj.actorId ?? null,
    },
  });
  return stock;
}

/** A merchant adding, removing or setting stock by hand. */
export async function adjustStockManually(
  ctx: StoreContext,
  productId: string,
  input: StockAdjustmentInput,
) {
  return db.$transaction(async (tx) => {
    const product = await tx.product.findFirst({
      where: { id: productId, storeId: ctx.store.id },
      select: { stock: true },
    });
    if (!product) throw new AppError("NOT_FOUND", "Product not found.");

    const delta =
      input.mode === "add"
        ? input.quantity
        : input.mode === "remove"
          ? -input.quantity
          : input.quantity - product.stock;
    if (delta === 0) return product.stock;

    const stock = await adjustStock(tx, {
      storeId: ctx.store.id,
      productId,
      delta,
      reason: input.reason,
      note: input.note,
      actorId: ctx.user.id,
    });
    await recordAudit(
      {
        storeId: ctx.store.id,
        actorId: ctx.user.id,
        action: "inventory.adjusted",
        entityType: "Product",
        entityId: productId,
        metadata: { delta, reason: input.reason, stock },
      },
      tx,
    );
    return stock;
  });
}

export type InventoryFilter = "all" | "low" | "out";

export const INVENTORY_PAGE_SIZE = 25;

export async function listInventory(
  storeId: string,
  opts: { q?: string; filter?: InventoryFilter; page?: number },
) {
  const where: Prisma.ProductWhereInput = {
    storeId,
    status: { not: "ARCHIVED" },
    ...(opts.q && {
      OR: [
        { name: { contains: opts.q, mode: "insensitive" } },
        { sku: { contains: opts.q, mode: "insensitive" } },
      ],
    }),
    ...(opts.filter === "low" && { stock: { gt: 0, lte: LOW_STOCK_THRESHOLD } }),
    ...(opts.filter === "out" && { stock: { lte: 0 } }),
  };

  const total = await db.product.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / INVENTORY_PAGE_SIZE));
  const page = Math.min(Math.max(1, opts.page ?? 1), pageCount);
  const items = await db.product.findMany({
    where,
    orderBy: [{ stock: "asc" }, { name: "asc" }],
    skip: (page - 1) * INVENTORY_PAGE_SIZE,
    take: INVENTORY_PAGE_SIZE,
    select: { id: true, name: true, sku: true, stock: true, status: true },
  });
  return { items, total, page, pageCount };
}

export async function countStockAlerts(storeId: string) {
  const [low, out] = await Promise.all([
    db.product.count({
      where: { storeId, status: "ACTIVE", stock: { gt: 0, lte: LOW_STOCK_THRESHOLD } },
    }),
    db.product.count({ where: { storeId, status: "ACTIVE", stock: { lte: 0 } } }),
  ]);
  return { low, out };
}

export async function listRecentAdjustments(storeId: string, opts: { productId?: string; take?: number } = {}) {
  return db.inventoryAdjustment.findMany({
    where: { storeId, ...(opts.productId && { productId: opts.productId }) },
    orderBy: { createdAt: "desc" },
    take: opts.take ?? 20,
    select: {
      id: true,
      delta: true,
      stockAfter: true,
      reason: true,
      note: true,
      createdAt: true,
      product: { select: { id: true, name: true } },
      order: { select: { orderNumber: true } },
    },
  });
}
