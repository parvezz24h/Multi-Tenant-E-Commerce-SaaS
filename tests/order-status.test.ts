import { describe, expect, it } from "vitest";

import { canTransition, ORDER_STATUSES, ORDER_TRANSITIONS, RESTOCKING_STATUSES } from "@/lib/order-status";

describe("order transitions", () => {
  it("follows the happy path", () => {
    expect(canTransition("PENDING", "CONFIRMED")).toBe(true);
    expect(canTransition("CONFIRMED", "PROCESSING")).toBe(true);
    expect(canTransition("PROCESSING", "SHIPPED")).toBe(true);
    expect(canTransition("SHIPPED", "DELIVERED")).toBe(true);
  });

  it.each([
    ["PENDING", "DELIVERED"],
    ["PENDING", "SHIPPED"],
    ["SHIPPED", "CANCELLED"],
    ["DELIVERED", "CANCELLED"],
    ["CANCELLED", "PENDING"],
    ["RETURNED", "DELIVERED"],
    ["DELIVERED", "PENDING"],
  ] as const)("rejects %s → %s", (from, to) => {
    expect(canTransition(from, to)).toBe(false);
  });

  it("has terminal states and no self-transitions", () => {
    expect(ORDER_TRANSITIONS.CANCELLED).toHaveLength(0);
    expect(ORDER_TRANSITIONS.RETURNED).toHaveLength(0);
    for (const s of ORDER_STATUSES) expect(canTransition(s, s)).toBe(false);
  });

  it("only restocks on cancel and return", () => {
    expect([...RESTOCKING_STATUSES].sort()).toEqual(["CANCELLED", "RETURNED"]);
  });
});
