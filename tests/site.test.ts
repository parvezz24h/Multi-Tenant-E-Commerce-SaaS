import { describe, expect, it } from "vitest";

import { safeRedirectPath } from "@/lib/site";

describe("safeRedirectPath", () => {
  it("keeps same-origin paths", () => {
    expect(safeRedirectPath("/dashboard/rahim/settings")).toBe("/dashboard/rahim/settings");
  });

  it.each([null, "", "https://evil.com", "//evil.com", "/\\evil.com", "evil.com"])(
    "falls back for %s",
    (next) => {
      expect(safeRedirectPath(next)).toBe("/dashboard");
    },
  );
});
