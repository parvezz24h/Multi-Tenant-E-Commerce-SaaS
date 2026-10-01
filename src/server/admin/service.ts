import "server-only";

import { db } from "@/lib/db";
import { recordAudit } from "@/server/audit/log";
import { AppError } from "@/server/errors";

export async function getPlatformStats() {
  const [users, stores, activeStores, suspendedStores] = await Promise.all([
    db.user.count(),
    db.store.count(),
    db.store.count({ where: { status: "ACTIVE" } }),
    db.store.count({ where: { status: "SUSPENDED" } }),
  ]);
  return { users, stores, activeStores, suspendedStores };
}

export async function listUsers() {
  return db.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      email: true,
      platformRole: true,
      createdAt: true,
      _count: { select: { memberships: true } },
    },
  });
}

export async function listStores() {
  return db.store.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      createdAt: true,
      subscription: {
        select: {
          status: true,
          trialEndsAt: true,
          currentPeriodEnd: true,
          cancelAtPeriodEnd: true,
          plan: { select: { name: true } },
        },
      },
      members: {
        where: { role: "STORE_OWNER" },
        take: 1,
        select: { user: { select: { name: true, email: true } } },
      },
    },
  });
}

/** Suspending blocks the storefront; reinstating returns the store to DRAFT. */
export async function setStoreSuspended(actorId: string, storeId: string, suspended: boolean) {
  const store = await db.store.findUnique({ where: { id: storeId }, select: { status: true } });
  if (!store) throw new AppError("NOT_FOUND", "Store not found.");

  const status = suspended ? "SUSPENDED" : "DRAFT";
  if (suspended === (store.status === "SUSPENDED")) return;

  await db.$transaction(async (tx) => {
    await tx.store.update({ where: { id: storeId }, data: { status } });
    await recordAudit(
      {
        storeId,
        actorId,
        action: suspended ? "store.suspended" : "store.reinstated",
        entityType: "Store",
        entityId: storeId,
      },
      tx,
    );
  });
}
