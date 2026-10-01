"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ORDER_STATUSES } from "@/lib/order-status";
import { optionalText } from "@/lib/validation";
import { toActionState, type ActionState } from "@/server/errors";
import { requireStoreAccess } from "@/server/tenant/context";

import { updateMerchantNote, updateOrderStatus } from "./service";

const statusInput = z.object({
  orderId: z.string().min(1).max(64),
  status: z.enum(ORDER_STATUSES),
  note: optionalText(300),
});

export async function updateOrderStatusAction(
  storeId: string,
  orderId: string,
  status: string,
  note: string,
): Promise<ActionState> {
  const parsed = statusInput.safeParse({ orderId, status, note });
  if (!parsed.success) return { ok: false, message: "Invalid request." };

  try {
    const ctx = await requireStoreAccess(storeId, "orders:write");
    await updateOrderStatus(ctx, parsed.data.orderId, parsed.data.status, parsed.data.note);
  } catch (error) {
    return toActionState(error);
  }
  revalidatePath("/dashboard/[storeSlug]", "layout");
  revalidatePath("/s/[storeSlug]", "layout");
  return { ok: true, message: "Order updated." };
}

const noteInput = z.object({ orderId: z.string().min(1).max(64), note: optionalText(1000) });

export async function updateMerchantNoteAction(
  storeId: string,
  orderId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = noteInput.safeParse({ orderId, note: String(formData.get("note") ?? "") });
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  try {
    const ctx = await requireStoreAccess(storeId, "orders:write");
    await updateMerchantNote(ctx, parsed.data.orderId, parsed.data.note);
  } catch (error) {
    return toActionState(error);
  }
  revalidatePath("/dashboard/[storeSlug]", "layout");
  return { ok: true, message: "Note saved." };
}
