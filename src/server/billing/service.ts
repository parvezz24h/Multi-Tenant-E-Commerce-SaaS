import "server-only";

import { cache } from "react";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  addDays,
  effectiveStatus,
  isInGoodStanding,
  TRIAL_DAYS,
} from "@/lib/subscription";
import { recordAudit } from "@/server/audit/log";
import { AppError } from "@/server/errors";
import type { StoreContext } from "@/server/tenant/context";

import type { PaymentSubmission } from "./schemas";


const subscriptionInclude = { plan: true } satisfies Prisma.SubscriptionInclude;

export async function listPlans({ activeOnly = true } = {}) {
  return db.plan.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: { sortOrder: "asc" },
  });
}

/**
 * Start the free trial for a new store (call inside the store-creation
 * transaction). The trial uses the first plan currently offered.
 */
export async function startTrial(tx: Prisma.TransactionClient, storeId: string) {
  const plan = await tx.plan.findFirst({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });
  if (!plan) throw new Error("No active plan to start a trial on; enable one on /admin/plans.");
  return tx.subscription.create({
    data: {
      storeId,
      planId: plan.id,
      status: "TRIAL",
      trialEndsAt: addDays(new Date(), TRIAL_DAYS),
    },
  });
}

/**
 * A store's subscription with its plan. If the dates say the stored status
 * is stale (trial ended, grace period over…), it is updated here.
 * Cached per request.
 */
export const getSubscription = cache(async (storeId: string) => {
  const sub = await db.subscription.findUnique({ where: { storeId }, include: subscriptionInclude });
  if (!sub) return null;

  const status = effectiveStatus(sub);
  if (status === sub.status) return sub;

  // Only move forward if nobody changed it in the meantime (e.g. a payment).
  const { count } = await db.subscription.updateMany({
    where: { id: sub.id, status: sub.status, updatedAt: sub.updatedAt },
    data: { status },
  });
  if (count === 1) {
    await recordAudit({
      storeId,
      action: "subscription.status_changed",
      entityType: "Subscription",
      entityId: sub.id,
      metadata: { from: sub.status, to: status },
    });
  }
  return { ...sub, status };
});

export type StoreSubscription = NonNullable<Awaited<ReturnType<typeof getSubscription>>>;

/** Whether the store's storefront and checkout are open, billing-wise. */
export async function isSubscriptionInGoodStanding(storeId: string) {
  const sub = await getSubscription(storeId);
  // Stores created before billing existed are treated as in good standing.
  return sub ? isInGoodStanding(sub.status) : true;
}

export async function countBillableProducts(storeId: string, excludeProductId?: string) {
  return db.product.count({
    where: {
      storeId,
      status: { not: "ARCHIVED" },
      ...(excludeProductId && { id: { not: excludeProductId } }),
    },
  });
}

/** Throws if the store can't have one more (non-archived) product. */
export async function assertCanAddProduct(storeId: string, excludeProductId?: string) {
  const sub = await getSubscription(storeId);
  if (!sub) return;
  if (!isInGoodStanding(sub.status)) {
    throw new AppError("FORBIDDEN", "Your subscription has ended. Renew it to add or publish products.");
  }
  const limit = sub.plan.maxProducts;
  if (limit !== null && (await countBillableProducts(storeId, excludeProductId)) >= limit) {
    const bigger = await db.plan.count({
      where: { isActive: true, OR: [{ maxProducts: null }, { maxProducts: { gt: limit } }] },
    });
    throw new AppError(
      "LIMIT_REACHED",
      `Your plan allows ${limit.toLocaleString("en-US")} products. ` +
        (bigger ? "Archive some or upgrade your plan." : "Archive some products to add new ones."),
    );
  }
}

export async function assertPlanAllowsCustomDomain(storeId: string) {
  const sub = await getSubscription(storeId);
  if (sub && !sub.plan.customDomain) {
    throw new AppError(
      "LIMIT_REACHED",
      "Custom domains aren't included in your plan.",
      "hostname",
    );
  }
}

// ── Merchant actions ────────────────────────────────────────

async function requireSubscription(storeId: string) {
  const sub = await getSubscription(storeId);
  if (!sub) throw new AppError("NOT_FOUND", "This store has no subscription. Contact support.");
  return sub;
}

async function requirePlan(planKey: string) {
  const plan = await db.plan.findUnique({ where: { key: planKey } });
  if (!plan || !plan.isActive) throw new AppError("INVALID", "Choose a plan from the list.");
  return plan;
}

/** During the trial merchants can switch plans freely. */
export async function switchTrialPlan(ctx: StoreContext, planKey: string) {
  const sub = await requireSubscription(ctx.store.id);
  if (sub.status !== "TRIAL") throw new AppError("INVALID", "Plans can only be switched for free during the trial.");
  const plan = await requirePlan(planKey);
  if (plan.id === sub.planId) return;

  await db.$transaction(async (tx) => {
    await tx.subscription.update({ where: { id: sub.id }, data: { planId: plan.id } });
    await recordAudit(
      {
        storeId: ctx.store.id,
        actorId: ctx.user.id,
        action: "subscription.trial_plan_changed",
        entityType: "Subscription",
        entityId: sub.id,
        metadata: { from: sub.plan.key, to: plan.key },
      },
      tx,
    );
  });
}

/**
 * Create an invoice to pay for `planKey`. Only one invoice can be open at a
 * time: an unsubmitted one is replaced; a submitted one must be reviewed first.
 */
export async function createInvoice(ctx: StoreContext, planKey: string, months = 1) {
  if (![1, 3, 6, 12].includes(months)) throw new AppError("INVALID", "Choose 1, 3, 6 or 12 months.");
  const sub = await requireSubscription(ctx.store.id);
  const plan = await requirePlan(planKey);

  return db.$transaction(async (tx) => {
    const open = await tx.subscriptionInvoice.findMany({
      where: { storeId: ctx.store.id, status: "OPEN" },
      select: { id: true, submittedAt: true },
    });
    if (open.some((i) => i.submittedAt)) {
      throw new AppError(
        "CONFLICT",
        "Your last payment is being verified. You can create a new invoice once it's reviewed.",
      );
    }
    if (open.length) {
      await tx.subscriptionInvoice.updateMany({
        where: { id: { in: open.map((i) => i.id) } },
        data: { status: "VOID", voidedAt: new Date(), adminNote: "Replaced by a newer invoice." },
      });
    }

    const invoice = await tx.subscriptionInvoice.create({
      data: {
        storeId: ctx.store.id,
        subscriptionId: sub.id,
        planId: plan.id,
        amount: plan.priceMonthly * months,
        periodMonths: months,
      },
    });
    await recordAudit(
      {
        storeId: ctx.store.id,
        actorId: ctx.user.id,
        action: "invoice.created",
        entityType: "SubscriptionInvoice",
        entityId: invoice.id,
        metadata: { number: invoice.number, plan: plan.key, months },
      },
      tx,
    );
    return invoice;
  });
}

export async function submitPayment(ctx: StoreContext, invoiceId: string, input: PaymentSubmission) {
  const invoice = await db.subscriptionInvoice.findFirst({
    where: { id: invoiceId, storeId: ctx.store.id },
  });
  if (!invoice) throw new AppError("NOT_FOUND", "Invoice not found.");
  if (invoice.status !== "OPEN") throw new AppError("INVALID", "This invoice is already closed.");

  // A transaction ID can only ever pay for one invoice.
  const reused = await db.subscriptionInvoice.count({
    where: {
      id: { not: invoice.id },
      method: input.method,
      reference: input.reference,
      status: { not: "VOID" },
    },
  });
  if (reused) throw new AppError("CONFLICT", "This transaction ID was already used.", "reference");

  await db.$transaction(async (tx) => {
    await tx.subscriptionInvoice.update({
      where: { id: invoice.id },
      data: { ...input, submittedAt: new Date() },
    });
    await recordAudit(
      {
        storeId: ctx.store.id,
        actorId: ctx.user.id,
        action: "invoice.payment_submitted",
        entityType: "SubscriptionInvoice",
        entityId: invoice.id,
        metadata: { number: invoice.number, method: input.method },
      },
      tx,
    );
  });
}

/** Withdraw an invoice the merchant no longer wants to pay (before review). */
export async function cancelInvoice(ctx: StoreContext, invoiceId: string) {
  const { count } = await db.subscriptionInvoice.updateMany({
    where: { id: invoiceId, storeId: ctx.store.id, status: "OPEN" },
    data: { status: "VOID", voidedAt: new Date(), adminNote: "Cancelled by the merchant." },
  });
  if (count === 0) throw new AppError("NOT_FOUND", "Invoice not found.");
}

/** Stop (or resume) renewing at the end of the current trial/period. */
export async function setCancelAtPeriodEnd(ctx: StoreContext, cancel: boolean) {
  const sub = await requireSubscription(ctx.store.id);
  if (!isInGoodStanding(sub.status) && cancel) {
    throw new AppError("INVALID", "There's nothing to cancel.");
  }
  if (sub.status === "CANCELLED" || sub.status === "SUSPENDED") {
    throw new AppError("INVALID", "Pay an invoice to reactivate your subscription.");
  }
  await db.$transaction(async (tx) => {
    await tx.subscription.update({ where: { id: sub.id }, data: { cancelAtPeriodEnd: cancel } });
    await recordAudit(
      {
        storeId: ctx.store.id,
        actorId: ctx.user.id,
        action: cancel ? "subscription.cancel_requested" : "subscription.resumed",
        entityType: "Subscription",
        entityId: sub.id,
      },
      tx,
    );
  });
}

export async function listStoreInvoices(storeId: string) {
  return db.subscriptionInvoice.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { plan: { select: { name: true } } },
  });
}

/** Where merchants send money. Configured per deployment. */
export function paymentInstructions() {
  return {
    bkash: process.env.PLATFORM_BKASH_NUMBER || null,
    nagad: process.env.PLATFORM_NAGAD_NUMBER || null,
    bank: process.env.PLATFORM_BANK_DETAILS || null,
  };
}
