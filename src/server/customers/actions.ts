"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { optionalText, requiredText } from "@/lib/validation";
import { toActionState, type ActionState } from "@/server/errors";
import { requireStoreAccess } from "@/server/tenant/context";

import { updateCustomer } from "./service";

const customerSchema = z.object({
  name: requiredText(2, 80),
  email: z
    .union([z.literal(""), z.email("Enter a valid email address.")])
    .transform((v) => v || null),
  note: optionalText(1000),
});

export async function updateCustomerAction(
  storeId: string,
  customerId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = customerSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? "").trim(),
    note: String(formData.get("note") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  try {
    const ctx = await requireStoreAccess(storeId, "customers:write");
    await updateCustomer(ctx, z.string().min(1).max(64).parse(customerId), parsed.data);
  } catch (error) {
    return toActionState(error);
  }
  revalidatePath("/dashboard/[storeSlug]", "layout");
  return { ok: true, message: "Customer saved." };
}
