import "server-only";

import { notFound } from "next/navigation";
import { cache } from "react";

import type { Store, StoreRole } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/server/auth/session";
import { AppError } from "@/server/errors";
import { hasPermission, type Permission } from "@/server/rbac/permissions";

export type StoreContext = {
  user: Awaited<ReturnType<typeof requireUser>>;
  store: Store;
  role: StoreRole;
  can: (permission: Permission) => boolean;
};

function buildContext(
  user: StoreContext["user"],
  membership: { role: StoreRole; store: Store },
): StoreContext {
  return {
    user,
    store: membership.store,
    role: membership.role,
    can: (permission) => hasPermission(membership.role, permission),
  };
}

/**
 * Tenant context for dashboard pages, resolved from the URL slug.
 *
 * Access is granted only through a StoreMember row for the signed-in user.
 * Stores the user cannot access 404 (rather than 403) so slugs and IDs of
 * other tenants are not revealed.
 */
export const getStoreContext = cache(
  async (storeSlug: string, permission: Permission = "store:read") => {
    const user = await requireUser();
    const membership = await db.storeMember.findFirst({
      where: { userId: user.id, store: { slug: storeSlug } },
      select: { role: true, store: true },
    });
    if (!membership) notFound();

    const ctx = buildContext(user, membership);
    if (!ctx.can(permission)) notFound();
    return ctx;
  },
);

/**
 * Tenant context for server actions. `storeId` comes from the client and is
 * untrusted, so membership and permission are always re-checked here.
 */
export async function requireStoreAccess(storeId: string, permission: Permission) {
  const user = await requireUser();
  const membership = await db.storeMember.findUnique({
    where: { storeId_userId: { storeId, userId: user.id } },
    select: { role: true, store: true },
  });
  if (!membership) throw new AppError("NOT_FOUND", "Store not found.");

  const ctx = buildContext(user, membership);
  if (!ctx.can(permission)) {
    throw new AppError("FORBIDDEN", "You don't have permission to do that.");
  }
  return ctx;
}
