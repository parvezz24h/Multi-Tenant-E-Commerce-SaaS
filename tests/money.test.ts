import { describe, expect, it } from "vitest";

import { discountPercent, formatMoney } from "@/lib/money";

describe("formatMoney", () => {
  it("formats poisha as taka with lakh grouping", () => {
    expect(formatMoney(125000)).toBe("৳1,250");
    expect(formatMoney(12500000)).toBe("৳1,25,000");
    expect(formatMoney(6050)).toBe("৳60.5");
    expect(formatMoney(0)).toBe("৳0");
  });
});

describe("discountPercent", () => {
  it("computes a rounded percentage", () => {
    expect(discountPercent(80000, 100000)).toBe(20);
  });

  it("returns null without a real discount", () => {
    expect(discountPercent(100000, null)).toBeNull();
    expect(discountPercent(100000, 100000)).toBeNull();
    expect(discountPercent(100000, 90000)).toBeNull();
  });
});
