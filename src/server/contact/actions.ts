"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { requireSuperAdmin } from "@/server/auth/session";
import { toActionState, type ActionState } from "@/server/errors";

import { contactMessageSchema } from "./schemas";
import { createContactMessage, setContactMessageRead } from "./service";

const SENT: ActionState = { ok: true, message: "Thanks! Your message has been sent. We'll get back to you soon." };

export async function sendContactMessageAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // Honeypot: hidden from people, filled in by bots. Pretend it worked.
  if (formData.get("website")) return SENT;

  const parsed = contactMessageSchema.safeParse({
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    topic: formData.get("topic") ?? "",
    message: formData.get("message") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
  try {
    await createContactMessage(parsed.data, ip);
  } catch (error) {
    return toActionState(error);
  }
  revalidatePath("/admin", "layout");
  return SENT;
}

export async function setContactMessageReadAction(id: string, read: boolean): Promise<ActionState> {
  await requireSuperAdmin();
  if (typeof id !== "string" || typeof read !== "boolean") {
    return { ok: false, message: "Invalid request." };
  }
  try {
    await setContactMessageRead(id, read);
  } catch (error) {
    return toActionState(error);
  }
  revalidatePath("/admin", "layout");
  return { ok: true, message: read ? "Marked as read." : "Marked as new." };
}
