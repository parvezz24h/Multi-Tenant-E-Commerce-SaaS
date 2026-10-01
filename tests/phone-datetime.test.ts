import { describe, expect, it } from "vitest";

import { startOfDhakaDay } from "@/lib/datetime";
import { normalizeBdPhone } from "@/lib/phone";

describe("normalizeBdPhone", () => {
  it.each([
    ["01712345678", "01712345678"],
    ["+8801712345678", "01712345678"],
    ["8801712345678", "01712345678"],
    ["017-1234 5678", "01712345678"],
  ])("%s → %s", (input, out) => {
    expect(normalizeBdPhone(input)).toBe(out);
  });

  it.each(["01212345678", "1712345678", "0171234567", "abc"])("rejects %s", (input) => {
    expect(normalizeBdPhone(input)).toBeNull();
  });
});

describe("startOfDhakaDay", () => {
  it("returns Dhaka midnight as UTC (18:00 the previous day)", () => {
    expect(startOfDhakaDay(new Date("2026-09-30T10:00:00Z")).toISOString()).toBe("2026-09-29T18:00:00.000Z");
  });

  it("rolls over at Dhaka midnight, not UTC midnight", () => {
    // 19:00 UTC is already 01:00 the next day in Dhaka.
    expect(startOfDhakaDay(new Date("2026-09-30T19:00:00Z")).toISOString()).toBe("2026-09-30T18:00:00.000Z");
  });
});
