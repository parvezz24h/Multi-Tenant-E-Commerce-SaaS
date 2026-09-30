import { describe, expect, it } from "vitest";

import { hasPermission, PERMISSIONS } from "@/server/rbac/permissions";

describe("store RBAC", () => {
  it("grants owners every permission", () => {
    for (const permission of PERMISSIONS) {
      expect(hasPermission("STORE_OWNER", permission)).toBe(true);
    }
  });

  it("keeps ownership-level actions away from store admins", () => {
    for (const permission of ["store:delete", "members:manage", "billing:manage", "domains:manage"] as const) {
      expect(hasPermission("STORE_ADMIN", permission)).toBe(false);
    }
  });

  it("lets store admins run day-to-day operations", () => {
    for (const permission of ["store:read", "store:update", "products:write", "orders:write"] as const) {
      expect(hasPermission("STORE_ADMIN", permission)).toBe(true);
    }
  });
});
