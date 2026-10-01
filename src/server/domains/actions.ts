"use server";

import { revalidatePath } from "next/cache";

import { toActionState, type ActionState } from "@/server/errors";
import { requireStoreAccess } from "@/server/tenant/context";

import { addDomain, checkDomain, removeDomain } from "./service";

function refresh() {
  revalidatePath("/dashboard/[storeSlug]", "layout");
}

export async function addDomainAction(
  storeId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const hostname = String(formData.get("hostname") ?? "").slice(0, 300);
  try {
    const ctx = await requireStoreAccess(storeId, "domains:manage");
    const domain = await addDomain(ctx, hostname);
    refresh();
    return {
      ok: true,
      message:
        domain.status === "ACTIVE"
          ? `${domain.hostname} is connected.`
          : `${domain.hostname} added. Now add the DNS records below.`,
    };
  } catch (error) {
    return toActionState(error);
  }
}

export async function checkDomainAction(storeId: string): Promise<ActionState> {
  try {
    const ctx = await requireStoreAccess(storeId, "domains:manage");
    const domain = await checkDomain(ctx);
    refresh();
    return domain.status === "ACTIVE"
      ? { ok: true, message: `${domain.hostname} is connected.` }
      : { ok: false, message: domain.lastError ?? "Not connected yet." };
  } catch (error) {
    return toActionState(error);
  }
}

export async function removeDomainAction(storeId: string): Promise<ActionState> {
  try {
    const ctx = await requireStoreAccess(storeId, "domains:manage");
    await removeDomain(ctx);
  } catch (error) {
    return toActionState(error);
  }
  refresh();
  return { ok: true, message: "Domain removed." };
}
