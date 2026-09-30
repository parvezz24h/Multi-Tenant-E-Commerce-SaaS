import { describe, expect, it } from "vitest";

import { readableForeground } from "@/lib/color";

describe("readableForeground", () => {
  it.each([
    ["#0f766e", "#ffffff"],
    ["#171717", "#ffffff"],
    ["#1d4ed8", "#ffffff"],
    ["#facc15", "#0a0a0a"],
    ["#ffffff", "#0a0a0a"],
  ])("%s → %s", (bg, fg) => {
    expect(readableForeground(bg)).toBe(fg);
  });
});
