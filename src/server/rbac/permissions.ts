import type { StoreRole } from "@/generated/prisma/enums";

/**
 * Store-level permissions. Server code checks permissions, never roles,
 * so new roles can be added without touching call sites.
 */
export const PERMISSIONS = [
  "store:read",
  "store:update",
  "store:publish",
  "store:delete",
  "members:read",
  "members:manage",
  "products:read",
  "products:write",
  "orders:read",
  "orders:write",
  "customers:read",
  "customers:write",
  "theme:update",
  "billing:manage",
  "domains:manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const OWNER_ONLY: ReadonlySet<Permission> = new Set([
  "store:delete",
  "members:manage",
  "billing:manage",
  "domains:manage",
]);

const ROLE_PERMISSIONS: Record<StoreRole, ReadonlySet<Permission>> = {
  STORE_OWNER: new Set(PERMISSIONS),
  STORE_ADMIN: new Set(PERMISSIONS.filter((p) => !OWNER_ONLY.has(p))),
};

export function hasPermission(role: StoreRole, permission: Permission) {
  return ROLE_PERMISSIONS[role].has(permission);
}

export const STORE_ROLE_LABELS: Record<StoreRole, string> = {
  STORE_OWNER: "Owner",
  STORE_ADMIN: "Admin",
};
