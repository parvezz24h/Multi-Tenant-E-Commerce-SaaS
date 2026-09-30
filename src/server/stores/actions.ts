"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser } from "@/server/auth/session";
import { toActionState, type ActionState } from "@/server/errors";
import { requireStoreAccess } from "@/server/tenant/context";

import { createStoreSchema, updateStoreSchema, updateStoreThemeSchema } from "./schemas";
import { createStore, setStorePublished, updateStore, updateStoreTheme } from "./service";

// Empty inputs (e.g. an untouched select) may be missing from FormData;
// treat them as blank so optional fields validate and clear correctly.
const blankFields = (shape: object) =>
  Object.fromEntries(Object.keys(shape).map((key) => [key, ""]));
const BLANK_UPDATE = blankFields(updateStoreSchema.shape);
const BLANK_THEME = blankFields(updateStoreThemeSchema.shape);

export async function createStoreAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = createStoreSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  let slug: string;
  try {
    slug = (await createStore(user.id, parsed.data)).slug;
  } catch (error) {
    return toActionState(error);
  }
  redirect(`/dashboard/${slug}`);
}

export async function updateStoreAction(
  storeId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = updateStoreSchema.safeParse({
    ...BLANK_UPDATE,
    ...Object.fromEntries(formData),
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  let previousSlug: string;
  let slug: string;
  try {
    const ctx = await requireStoreAccess(storeId, "store:update");
    previousSlug = ctx.store.slug;
    slug = (await updateStore(ctx, parsed.data)).slug;
  } catch (error) {
    return toActionState(error);
  }

  revalidatePath("/dashboard", "layout");
  revalidatePath("/s/[storeSlug]", "layout");
  if (slug !== previousSlug) redirect(`/dashboard/${slug}/settings`);
  return { ok: true, message: "Store settings saved." };
}

export async function setStorePublishedAction(
  storeId: string,
  published: boolean,
): Promise<ActionState> {
  if (typeof published !== "boolean") return { ok: false, message: "Invalid request." };
  try {
    const ctx = await requireStoreAccess(storeId, "store:publish");
    await setStorePublished(ctx, published);
  } catch (error) {
    return toActionState(error);
  }
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: published ? "Store published." : "Store unpublished." };
}

export async function updateStoreThemeAction(
  storeId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = updateStoreThemeSchema.safeParse({
    ...BLANK_THEME,
    ...Object.fromEntries(formData),
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  try {
    const ctx = await requireStoreAccess(storeId, "theme:update");
    await updateStoreTheme(ctx, parsed.data);
  } catch (error) {
    return toActionState(error);
  }

  revalidatePath("/dashboard", "layout");
  revalidatePath("/s/[storeSlug]", "layout");
  return { ok: true, message: "Store design saved." };
}
