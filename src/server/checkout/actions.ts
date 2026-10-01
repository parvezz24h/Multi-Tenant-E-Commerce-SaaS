"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { toActionState, type ActionState } from "@/server/errors";

import { checkoutSchema } from "./schemas";
import { findOrderTokenForTracking, placeOrder } from "./service";

const storeIdSchema = z.string().min(1).max(64);

function formValues(formData: FormData, keys: string[]) {
  return Object.fromEntries(keys.map((key) => [key, String(formData.get(key) ?? "")]));
}

export async function placeOrderAction(
  storeId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = checkoutSchema.safeParse(formValues(formData, Object.keys(checkoutSchema.shape)));
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  let token: string;
  try {
    token = (await placeOrder(storeIdSchema.parse(storeId), parsed.data)).publicToken;
  } catch (error) {
    return toActionState(error);
  }

  revalidatePath("/s/[storeSlug]", "layout");
  revalidatePath("/dashboard/[storeSlug]", "layout");
  redirect(`/order/${token}`);
}

const trackSchema = z.object({
  orderNumber: z
    .string()
    .trim()
    .transform((v) => v.replace(/^#/, ""))
    .refine((v) => /^\d{1,9}$/.test(v), "Enter the order number, e.g. 1001.")
    .transform(Number),
  phone: z.string().trim().min(1, "Enter the phone number used for the order."),
});

export async function trackOrderAction(
  storeId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = trackSchema.safeParse(formValues(formData, ["orderNumber", "phone"]));
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const token = await findOrderTokenForTracking(
    storeIdSchema.parse(storeId),
    parsed.data.orderNumber,
    parsed.data.phone,
  );
  // Same message either way, so the form can't be used to probe order numbers.
  if (!token) return { ok: false, message: "We couldn't find an order with that number and phone." };
  redirect(`/order/${token}`);
}
