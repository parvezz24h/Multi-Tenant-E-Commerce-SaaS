import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { recordAudit } from "@/server/audit/log";
import { AppError } from "@/server/errors";
import type { StoreContext } from "@/server/tenant/context";

import type { CreateStoreInput, UpdateStoreInput } from "./schemas";

/** MVP: each user owns one store. Will move to plan limits in Phase 5. */
export const MAX_OWNED_STORES_PER_USER = 1;

function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

const slugTaken = () => new AppError("CONFLICT", "This store address is already taken.", "slug");

export async function listStoresForUser(userId: string) {
  return db.storeMember.findMany({
    where: { userId },
    select: {
      role: true,
      store: { select: { id: true, name: true, slug: true, status: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function countOwnedStores(userId: string) {
  return db.storeMember.count({ where: { userId, role: "STORE_OWNER" } });
}

export async function createStore(userId: string, input: CreateStoreInput) {
  if ((await countOwnedStores(userId)) >= MAX_OWNED_STORES_PER_USER) {
    throw new AppError("LIMIT_REACHED", "You already own a store.");
  }

  try {
    return await db.$transaction(async (tx) => {
      const store = await tx.store.create({
        data: {
          name: input.name,
          slug: input.slug,
          members: { create: { userId, role: "STORE_OWNER" } },
        },
      });
      await recordAudit(
        {
          storeId: store.id,
          actorId: userId,
          action: "store.created",
          entityType: "Store",
          entityId: store.id,
          metadata: { name: store.name, slug: store.slug },
        },
        tx,
      );
      return store;
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw slugTaken();
    throw error;
  }
}

export async function updateStore(ctx: StoreContext, input: UpdateStoreInput) {
  // Only record fields that actually changed.
  const changed = Object.fromEntries(
    Object.entries(input).filter(
      ([key, value]) => ctx.store[key as keyof UpdateStoreInput] !== value,
    ),
  );
  if (Object.keys(changed).length === 0) return ctx.store;

  try {
    return await db.$transaction(async (tx) => {
      const store = await tx.store.update({
        where: { id: ctx.store.id },
        data: input,
      });
      await recordAudit(
        {
          storeId: store.id,
          actorId: ctx.user.id,
          action: "store.updated",
          entityType: "Store",
          entityId: store.id,
          metadata: { changed: Object.keys(changed) },
        },
        tx,
      );
      return store;
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw slugTaken();
    throw error;
  }
}

/** Merchants toggle DRAFT ↔ ACTIVE. SUSPENDED is controlled by platform admins. */
export async function setStorePublished(ctx: StoreContext, published: boolean) {
  if (ctx.store.status === "SUSPENDED") {
    throw new AppError("FORBIDDEN", "This store is suspended. Contact support.");
  }
  const status = published ? "ACTIVE" : "DRAFT";
  if (ctx.store.status === status) return ctx.store;

  return db.$transaction(async (tx) => {
    const store = await tx.store.update({ where: { id: ctx.store.id }, data: { status } });
    await recordAudit(
      {
        storeId: store.id,
        actorId: ctx.user.id,
        action: published ? "store.published" : "store.unpublished",
        entityType: "Store",
        entityId: store.id,
      },
      tx,
    );
    return store;
  });
}
