import type { SubscriptionStatus } from "@/generated/prisma/enums";

/**
 * Subscription lifecycle rules. Pure functions so the same logic runs in the
 * dashboard, the storefront, the sync script and tests.
 *
 *   TRIAL ──(trial ends)──┐
 *   ACTIVE ─(period ends)─┴─▶ PAST_DUE ─(grace ends)─▶ SUSPENDED
 *   (cancelAtPeriodEnd)  ─────────────────────────────▶ CANCELLED
 *   Paying an invoice sets ACTIVE for the paid months from any state.
 */

export const TRIAL_DAYS = 14;
export const GRACE_DAYS = 7;
/** Warn merchants this many days before the trial or period ends. */
export const RENEWAL_WARNING_DAYS = 3;

const DAY_MS = 86_400_000;

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}

/** Calendar months, clamped to the last day (31 Jan + 1 month → 28/29 Feb). */
export function addMonths(date: Date, months: number) {
  const result = new Date(date);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

export type SubscriptionDates = {
  status: SubscriptionStatus;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
};

/** When the current trial or paid period ends (null if unknown). */
export function periodEndsAt(sub: SubscriptionDates) {
  return sub.status === "TRIAL" ? sub.trialEndsAt : (sub.currentPeriodEnd ?? sub.trialEndsAt);
}

/** The status the subscription is really in at `now`, given its dates. */
export function effectiveStatus(sub: SubscriptionDates, now = new Date()): SubscriptionStatus {
  if (sub.status === "SUSPENDED" || sub.status === "CANCELLED") return sub.status;
  const endsAt = periodEndsAt(sub);
  if (!endsAt || now < endsAt) return sub.status;
  if (sub.cancelAtPeriodEnd) return "CANCELLED";
  return now < addDays(endsAt, GRACE_DAYS) ? "PAST_DUE" : "SUSPENDED";
}

/** Date the store goes offline if nothing is paid (null when not applicable). */
export function suspendsAt(sub: SubscriptionDates) {
  const endsAt = periodEndsAt(sub);
  if (!endsAt || sub.cancelAtPeriodEnd) return null;
  return addDays(endsAt, GRACE_DAYS);
}

/** Storefront open and merchants can keep adding products. */
export function isInGoodStanding(status: SubscriptionStatus) {
  return status === "TRIAL" || status === "ACTIVE" || status === "PAST_DUE";
}

/** Whole days until `date` (0 if past). */
export function daysUntil(date: Date | null, now = new Date()) {
  if (!date) return 0;
  return Math.max(0, Math.ceil((date.getTime() - now.getTime()) / DAY_MS));
}

/**
 * When a payment for `months` lands: renewals of a still-running paid period
 * extend it; anything else (trial, lapsed, plan change) starts today.
 */
export function nextPaidPeriod(
  sub: SubscriptionDates & { planId: string },
  invoicePlanId: string,
  months: number,
  now = new Date(),
) {
  const extend =
    sub.status === "ACTIVE" &&
    sub.planId === invoicePlanId &&
    sub.currentPeriodEnd !== null &&
    sub.currentPeriodEnd > now;
  const start = extend ? sub.currentPeriodEnd! : now;
  return { start, end: addMonths(start, months) };
}

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  TRIAL: "Free trial",
  ACTIVE: "Active",
  PAST_DUE: "Payment overdue",
  SUSPENDED: "Suspended",
  CANCELLED: "Cancelled",
};

/** 123 → "INV-000123". */
export function formatInvoiceNumber(n: number) {
  return `INV-${String(n).padStart(6, "0")}`;
}
