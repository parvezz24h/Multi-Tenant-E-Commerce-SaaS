import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { recordAudit } from "@/server/audit/log";
import { AppError } from "@/server/errors";
import type { StoreContext } from "@/server/tenant/context";

import type { CategoryInput } from "./schemas";

const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

const slugTaken = () =>
  new AppError("CONFLICT", "Another category already uses this URL.", "slug");

export async function listAdminCategories(storeId: string) {
  const rows = await db.category.findMany({
    where: { storeId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      sortOrder: true,
      _count: { select: { products: true } },
    },
  });
  return rows.map(({ _count, ...c }) => ({ ...c, productCount: _count.products }));
}

/** Minimal list for product form dropdowns. */
export async function listCategoryOptions(storeId: string) {
  return db.category.findMany({
    where: { storeId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });
}

export async function createCategory(ctx: StoreContext, input: CategoryInput) {
  try {
    return await db.$transaction(async (tx) => {
      const category = await tx.category.create({ data: { ...input, storeId: ctx.store.id } });
      await recordAudit(
        {
          storeId: ctx.store.id,
          actorId: ctx.user.id,
          action: "category.created",
          entityType: "Category",
          entityId: category.id,
          metadata: { name: category.name },
        },
        tx,
      );
      return category;
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw slugTaken();
    throw error;
  }
}

export async function updateCategory(ctx: StoreContext, categoryId: string, input: CategoryInput) {
  try {
    await db.$transaction(async (tx) => {
      const { count } = await tx.category.updateMany({
        where: { id: categoryId, storeId: ctx.store.id },
        data: input,
      });
      if (count === 0) throw new AppError("NOT_FOUND", "Category not found.");
      await recordAudit(
        {
          storeId: ctx.store.id,
          actorId: ctx.user.id,
          action: "category.updated",
          entityType: "Category",
          entityId: categoryId,
        },
        tx,
      );
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw slugTaken();
    throw error;
  }
}

/** Products in the category become uncategorized (FK is SET NULL). */
export async function deleteCategory(ctx: StoreContext, categoryId: string) {
  await db.$transaction(async (tx) => {
    const { count } = await tx.category.deleteMany({
      where: { id: categoryId, storeId: ctx.store.id },
    });
    if (count === 0) throw new AppError("NOT_FOUND", "Category not found.");
    await recordAudit(
      {
        storeId: ctx.store.id,
        actorId: ctx.user.id,
        action: "category.deleted",
        entityType: "Category",
        entityId: categoryId,
      },
      tx,
    );
  });
}
