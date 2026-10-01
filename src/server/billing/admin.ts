import "server-only";

import type { InvoiceStatus, Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { nextPaidPeriod } from "@/lib/subscription";
import { recordAudit } from "@/server/audit/log";
import { AppError } from "@/server/errors";

import type { PlanUpdate } from "./schemas";

export type InvoiceFilter = "review" | "open" | "paid" | "void";

const FILTERS: Record<InvoiceFilter, Prisma.SubscriptionInvoiceWhereInput> = {
  review: { status: "OPEN", submittedAt: { not: null } },
  open: { status: "OPEN", submittedAt: null },
  paid: { status: "PAID" },
  void: { status: "VOID" },
};

export async function listInvoicesForAdmin(filter: InvoiceFilter) {
  return db.subscriptionInvoice.findMany({
    where: FILTERS[filter],
    orderBy: filter === "review" ? { submittedAt: "asc" } : { createdAt: "desc" },
    take: 100,
    include: {
      plan: { select: { name: true } },
      store: { select: { name: true, slug: true } },
    },
  });
}

export async function countInvoicesToReview() {
  return db.subscriptionInvoice.count({ where: FILTERS.review });
}

async function closeInvoice(
  adminId: string,
  invoiceId: string,
  to: Extract<InvoiceStatus, "PAID" | "VOID">,
  note: string | null,
) {
  return db.$transaction(async (tx) => {
    const invoice = await tx.subscriptionInvoice.findUnique({
      where: { id: invoiceId },
      include: { subscription: true, plan: { select: { key: true } } },
    });
    if (!invoice) throw new AppError("NOT_FOUND", "Invoice not found.");

    // Guard against double-processing (two admins, double click).
    const { count } = await tx.subscriptionInvoice.updateMany({
      where: { id: invoice.id, status: "OPEN" },
      data: {
        status: to,
        reviewedById: adminId,
        adminNote: note,
        ...(to === "PAID" ? { paidAt: new Date() } : { voidedAt: new Date() }),
      },
    });
    if (count === 0) throw new AppError("CONFLICT", "This invoice was already processed.");

    if (to === "PAID") {
      const { start, end } = nextPaidPeriod(invoice.subscription, invoice.planId, invoice.periodMonths);
      await tx.subscription.update({
        where: { id: invoice.subscriptionId },
        data: {
          planId: invoice.planId,
          status: "ACTIVE",
          currentPeriodStart: start,
          currentPeriodEnd: end,
          cancelAtPeriodEnd: false,
        },
      });
    }

    await recordAudit(
      {
        storeId: invoice.storeId,
        actorId: adminId,
        action: to === "PAID" ? "invoice.paid" : "invoice.voided",
        entityType: "SubscriptionInvoice",
        entityId: invoice.id,
        metadata: { number: invoice.number, plan: invoice.plan.key, amount: invoice.amount },
      },
      tx,
    );
  });
}

/** Payment confirmed: activate (or extend) the plan for the paid months. */
export function markInvoicePaid(adminId: string, invoiceId: string, note: string | null) {
  return closeInvoice(adminId, invoiceId, "PAID", note);
}

/** Payment not found or invalid: close the invoice so the merchant can try again. */
export function voidInvoice(adminId: string, invoiceId: string, note: string | null) {
  return closeInvoice(adminId, invoiceId, "VOID", note);
}

export async function updatePlan(adminId: string, planId: string, input: PlanUpdate) {
  await db.$transaction(async (tx) => {
    const { count } = await tx.plan.updateMany({ where: { id: planId }, data: input });
    if (count === 0) throw new AppError("NOT_FOUND", "Plan not found.");
    await recordAudit(
      {
        actorId: adminId,
        action: "plan.updated",
        entityType: "Plan",
        entityId: planId,
        metadata: { price: input.priceMonthly, maxProducts: input.maxProducts, active: input.isActive },
      },
      tx,
    );
  });
}
