"use server";

import { revalidatePath } from "next/cache";

import { requireSuperAdmin } from "@/server/auth/session";
import { toActionState, type ActionState } from "@/server/errors";

import { setStoreSuspended } from "./service";

export async function setStoreSuspendedAction(
  storeId: string,
  suspended: boolean,
): Promise<ActionState> {
  const admin = await requireSuperAdmin();
  if (typeof storeId !== "string" || typeof suspended !== "boolean") {
    return { ok: false, message: "Invalid request." };
  }
  try {
    await setStoreSuspended(admin.id, storeId, suspended);
  } catch (error) {
    return toActionState(error);
  }
  revalidatePath("/admin", "layout");
  return { ok: true, message: suspended ? "Store suspended." : "Store reinstated." };
}
