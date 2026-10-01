import "server-only";

import { Prisma, type ProductStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { recordAudit } from "@/server/audit/log";
import { assertCanAddProduct } from "@/server/billing/service";
import { AppError } from "@/server/errors";
import { storage } from "@/server/storage";
import type { StoreContext } from "@/server/tenant/context";

import { adjustStock } from "./inventory";
import type { CreateProductInput, UpdateProductInput } from "./schemas";

export const ADMIN_PRODUCTS_PAGE_SIZE = 20;

const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

const slugTaken = () =>
  new AppError("CONFLICT", "Another product already uses this URL.", "slug");

/** A category id from the form must belong to the same store. */
async function assertCategoryInStore(storeId: string, categoryId: string | null) {
  if (!categoryId) return;
  const ok = await db.category.count({ where: { id: categoryId, storeId } });
  if (!ok) throw new AppError("INVALID", "Choose a category from the list.", "categoryId");
}

export async function listAdminProducts(
  storeId: string,
  opts: { q?: string; status?: ProductStatus; categoryId?: string; page?: number },
) {
  const where: Prisma.ProductWhereInput = {
    storeId,
    ...(opts.status && { status: opts.status }),
    ...(opts.categoryId && { categoryId: opts.categoryId }),
    ...(opts.q && {
      OR: [
        { name: { contains: opts.q, mode: "insensitive" } },
        { sku: { contains: opts.q, mode: "insensitive" } },
      ],
    }),
  };

  const total = await db.product.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / ADMIN_PRODUCTS_PAGE_SIZE));
  const page = Math.min(Math.max(1, opts.page ?? 1), pageCount);
  const items = await db.product.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * ADMIN_PRODUCTS_PAGE_SIZE,
    take: ADMIN_PRODUCTS_PAGE_SIZE,
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      stock: true,
      status: true,
      featured: true,
      category: { select: { name: true } },
      images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
    },
  });
  return { items, total, page, pageCount };
}

export async function getAdminProduct(storeId: string, productId: string) {
  return db.product.findFirst({
    where: { id: productId, storeId },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      category: { select: { id: true, name: true } },
    },
  });
}

export async function createProduct(ctx: StoreContext, input: CreateProductInput) {
  await assertCategoryInStore(ctx.store.id, input.categoryId);
  if (input.status !== "ARCHIVED") await assertCanAddProduct(ctx.store.id);
  const { stock, ...fields } = input;

  try {
    return await db.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: { ...fields, storeId: ctx.store.id, stock: 0 },
      });
      if (stock > 0) {
        await adjustStock(tx, {
          storeId: ctx.store.id,
          productId: product.id,
          delta: stock,
          reason: "INITIAL",
          actorId: ctx.user.id,
        });
      }
      await recordAudit(
        {
          storeId: ctx.store.id,
          actorId: ctx.user.id,
          action: "product.created",
          entityType: "Product",
          entityId: product.id,
          metadata: { name: product.name },
        },
        tx,
      );
      return product;
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw slugTaken();
    throw error;
  }
}

export async function updateProduct(
  ctx: StoreContext,
  productId: string,
  input: UpdateProductInput,
) {
  await assertCategoryInStore(ctx.store.id, input.categoryId);

  // Un-archiving counts against the plan's product limit.
  if (input.status !== "ARCHIVED") {
    const current = await db.product.findFirst({
      where: { id: productId, storeId: ctx.store.id },
      select: { status: true },
    });
    if (current?.status === "ARCHIVED") await assertCanAddProduct(ctx.store.id, productId);
  }

  try {
    return await db.$transaction(async (tx) => {
      // Scoping the update by storeId is what stops cross-tenant edits.
      const { count } = await tx.product.updateMany({
        where: { id: productId, storeId: ctx.store.id },
        data: input,
      });
      if (count === 0) throw new AppError("NOT_FOUND", "Product not found.");
      await recordAudit(
        {
          storeId: ctx.store.id,
          actorId: ctx.user.id,
          action: "product.updated",
          entityType: "Product",
          entityId: productId,
          metadata: { status: input.status },
        },
        tx,
      );
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw slugTaken();
    throw error;
  }
}

export async function deleteProduct(ctx: StoreContext, productId: string) {
  const product = await db.product.findFirst({
    where: { id: productId, storeId: ctx.store.id },
    select: { id: true, name: true, images: { select: { storageKey: true } } },
  });
  if (!product) throw new AppError("NOT_FOUND", "Product not found.");

  await db.$transaction(async (tx) => {
    // Order items keep their name/price snapshot; productId is set to null.
    await tx.product.delete({ where: { id: product.id } });
    await recordAudit(
      {
        storeId: ctx.store.id,
        actorId: ctx.user.id,
        action: "product.deleted",
        entityType: "Product",
        entityId: product.id,
        metadata: { name: product.name },
      },
      tx,
    );
  });

  // Best effort: a leftover file is harmless, a failed delete shouldn't block.
  await Promise.allSettled(
    product.images.flatMap((i) => (i.storageKey ? [storage().delete(i.storageKey)] : [])),
  );
}
