"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireSuperAdmin } from "@/server/auth/session";
import { toActionState, type ActionState } from "@/server/errors";
import { requireStoreAccess } from "@/server/tenant/context";

import { markInvoicePaid, updatePlan, voidInvoice } from "./admin";
import { paymentSubmissionSchema, planUpdateSchema, reviewNoteSchema } from "./schemas";
import {
  cancelInvoice,
  createInvoice,
  setCancelAtPeriodEnd,
  submitPayment,
  switchTrialPlan,
} from "./service";

const id = z.string().min(1).max(64);
const planKey = z.string().min(1).max(40);

function refreshStore() {
  revalidatePath("/dashboard/[storeSlug]", "layout");
  revalidatePath("/s/[storeSlug]", "layout");
}

function refreshAdmin() {
  revalidatePath("/admin", "layout");
  refreshStore();
}

async function asOwner(storeId: string) {
  return requireStoreAccess(id.parse(storeId), "billing:manage");
}

// ── Merchant ────────────────────────────────────────────────

export async function switchTrialPlanAction(storeId: string, plan: string): Promise<ActionState> {
  try {
    await switchTrialPlan(await asOwner(storeId), planKey.parse(plan));
  } catch (error) {
    return toActionState(error);
  }
  refreshStore();
  return { ok: true, message: "Trial plan changed." };
}

export async function createInvoiceAction(storeId: string, plan: string, months: number): Promise<ActionState> {
  try {
    await createInvoice(await asOwner(storeId), planKey.parse(plan), z.number().int().parse(months));
  } catch (error) {
    return toActionState(error);
  }
  refreshStore();
  return { ok: true, message: "Invoice created. Follow the payment steps below." };
}

export async function submitPaymentAction(
  storeId: string,
  invoiceId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = paymentSubmissionSchema.safeParse({
    method: String(formData.get("method") ?? ""),
    payerAccount: String(formData.get("payerAccount") ?? ""),
    reference: String(formData.get("reference") ?? ""),
  });
  if (!parsed.success) return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };

  try {
    await submitPayment(await asOwner(storeId), id.parse(invoiceId), parsed.data);
  } catch (error) {
    return toActionState(error);
  }
  refreshStore();
  return { ok: true, message: "Thanks! We'll verify your payment shortly." };
}

export async function cancelInvoiceAction(storeId: string, invoiceId: string): Promise<ActionState> {
  try {
    await cancelInvoice(await asOwner(storeId), id.parse(invoiceId));
  } catch (error) {
    return toActionState(error);
  }
  refreshStore();
  return { ok: true, message: "Invoice cancelled." };
}

export async function setCancelAtPeriodEndAction(storeId: string, cancel: boolean): Promise<ActionState> {
  try {
    await setCancelAtPeriodEnd(await asOwner(storeId), z.boolean().parse(cancel));
  } catch (error) {
    return toActionState(error);
  }
  refreshStore();
  return { ok: true, message: cancel ? "Your subscription won't renew." : "Your subscription will continue." };
}

// ── Platform admin ──────────────────────────────────────────

export async function reviewInvoiceAction(
  invoiceId: string,
  decision: "paid" | "void",
  note: string,
): Promise<ActionState> {
  const admin = await requireSuperAdmin();
  const parsedNote = reviewNoteSchema.safeParse(note);
  if (!parsedNote.success || (decision !== "paid" && decision !== "void")) {
    return { ok: false, message: "Invalid request." };
  }
  try {
    const fn = decision === "paid" ? markInvoicePaid : voidInvoice;
    await fn(admin.id, id.parse(invoiceId), parsedNote.data);
  } catch (error) {
    return toActionState(error);
  }
  refreshAdmin();
  return { ok: true, message: decision === "paid" ? "Marked as paid. The plan is active." : "Invoice rejected." };
}

export async function updatePlanAction(
  planId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireSuperAdmin();
  const parsed = planUpdateSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    priceMonthly: String(formData.get("priceMonthly") ?? ""),
    maxProducts: String(formData.get("maxProducts") ?? ""),
    maxStaff: String(formData.get("maxStaff") ?? ""),
    customDomain: formData.get("customDomain") ? "on" : undefined,
    isActive: formData.get("isActive") ? "on" : undefined,
  });
  if (!parsed.success) return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };

  try {
    await updatePlan(admin.id, id.parse(planId), parsed.data);
  } catch (error) {
    return toActionState(error);
  }
  refreshAdmin();
  return { ok: true, message: "Plan saved." };
}
