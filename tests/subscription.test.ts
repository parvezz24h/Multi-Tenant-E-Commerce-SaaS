import { describe, expect, it } from "vitest";

import {
  addMonths,
  daysUntil,
  effectiveStatus,
  isInGoodStanding,
  nextPaidPeriod,
  suspendsAt,
  type SubscriptionDates,
} from "@/lib/subscription";

const d = (iso: string) => new Date(iso);
const NOW = d("2026-10-10T12:00:00Z");

const trial = (endsAt: string, extra: Partial<SubscriptionDates> = {}): SubscriptionDates => ({
  status: "TRIAL",
  trialEndsAt: d(endsAt),
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  ...extra,
});

const active = (endsAt: string, extra: Partial<SubscriptionDates> = {}): SubscriptionDates => ({
  status: "ACTIVE",
  trialEndsAt: d("2026-09-01T00:00:00Z"),
  currentPeriodEnd: d(endsAt),
  cancelAtPeriodEnd: false,
  ...extra,
});

describe("effectiveStatus", () => {
  it("keeps a running trial or paid period", () => {
    expect(effectiveStatus(trial("2026-10-14T00:00:00Z"), NOW)).toBe("TRIAL");
    expect(effectiveStatus(active("2026-11-01T00:00:00Z"), NOW)).toBe("ACTIVE");
  });

  it("goes past due for 7 days after the period ends, then suspends", () => {
    expect(effectiveStatus(trial("2026-10-09T00:00:00Z"), NOW)).toBe("PAST_DUE");
    expect(effectiveStatus(active("2026-10-04T00:00:00Z"), NOW)).toBe("PAST_DUE");
    expect(effectiveStatus(active("2026-10-03T11:59:00Z"), NOW)).toBe("SUSPENDED");
    expect(effectiveStatus(trial("2026-09-01T00:00:00Z"), NOW)).toBe("SUSPENDED");
  });

  it("re-evaluates a stored PAST_DUE status", () => {
    expect(effectiveStatus(active("2026-10-08T00:00:00Z", { status: "PAST_DUE" }), NOW)).toBe("PAST_DUE");
    expect(effectiveStatus(active("2026-09-20T00:00:00Z", { status: "PAST_DUE" }), NOW)).toBe("SUSPENDED");
  });

  it("cancels at period end instead of going past due", () => {
    expect(effectiveStatus(active("2026-11-01T00:00:00Z", { cancelAtPeriodEnd: true }), NOW)).toBe("ACTIVE");
    expect(effectiveStatus(active("2026-10-09T00:00:00Z", { cancelAtPeriodEnd: true }), NOW)).toBe("CANCELLED");
    expect(effectiveStatus(trial("2026-10-01T00:00:00Z", { cancelAtPeriodEnd: true }), NOW)).toBe("CANCELLED");
  });

  it("never revives suspended or cancelled on its own", () => {
    expect(effectiveStatus(active("2027-01-01T00:00:00Z", { status: "SUSPENDED" }), NOW)).toBe("SUSPENDED");
    expect(effectiveStatus(active("2027-01-01T00:00:00Z", { status: "CANCELLED" }), NOW)).toBe("CANCELLED");
  });
});

describe("standing and dates", () => {
  it("keeps the store open through the grace period only", () => {
    expect(isInGoodStanding("TRIAL")).toBe(true);
    expect(isInGoodStanding("PAST_DUE")).toBe(true);
    expect(isInGoodStanding("SUSPENDED")).toBe(false);
    expect(isInGoodStanding("CANCELLED")).toBe(false);
  });

  it("computes the suspension date", () => {
    expect(suspendsAt(active("2026-10-04T00:00:00Z"))?.toISOString()).toBe("2026-10-11T00:00:00.000Z");
    expect(suspendsAt(active("2026-10-04T00:00:00Z", { cancelAtPeriodEnd: true }))).toBeNull();
  });

  it("counts whole days remaining", () => {
    expect(daysUntil(d("2026-10-13T12:00:00Z"), NOW)).toBe(3);
    expect(daysUntil(d("2026-10-10T13:00:00Z"), NOW)).toBe(1);
    expect(daysUntil(d("2026-10-01T00:00:00Z"), NOW)).toBe(0);
  });
});

describe("addMonths", () => {
  it.each([
    ["2026-01-31T10:00:00Z", 1, "2026-02-28T10:00:00.000Z"],
    ["2028-01-31T10:00:00Z", 1, "2028-02-29T10:00:00.000Z"],
    ["2026-10-15T00:00:00Z", 1, "2026-11-15T00:00:00.000Z"],
    ["2026-12-31T00:00:00Z", 2, "2027-02-28T00:00:00.000Z"],
    ["2026-05-31T00:00:00Z", 12, "2027-05-31T00:00:00.000Z"],
  ])("%s + %i month(s) → %s", (from, months, to) => {
    expect(addMonths(d(from), months).toISOString()).toBe(to);
  });
});

describe("nextPaidPeriod", () => {
  const sub = { ...active("2026-10-20T00:00:00Z"), planId: "business" };

  it("extends a running period when renewing the same plan", () => {
    const p = nextPaidPeriod(sub, "business", 1, NOW);
    expect(p.start.toISOString()).toBe("2026-10-20T00:00:00.000Z");
    expect(p.end.toISOString()).toBe("2026-11-20T00:00:00.000Z");
  });

  it("starts today for plan changes, trials and lapsed subscriptions", () => {
    expect(nextPaidPeriod(sub, "premium", 1, NOW).start).toEqual(NOW);
    expect(nextPaidPeriod({ ...trial("2026-10-14T00:00:00Z"), planId: "business" }, "business", 1, NOW).start).toEqual(NOW);
    expect(nextPaidPeriod({ ...active("2026-10-01T00:00:00Z"), planId: "business" }, "business", 1, NOW).start).toEqual(NOW);
  });
});
