"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { toActionState, type ActionState } from "@/server/errors";
import { requireStoreAccess } from "@/server/tenant/context";

import { slideSchema } from "./schemas";
import { createSlide, deleteSlide, moveSlide, setSlideActive, updateSlide } from "./service";

const id = z.string().min(1).max(64);

function refreshSlides() {
  revalidatePath("/dashboard/[storeSlug]/design", "page");
  revalidatePath("/s/[storeSlug]", "layout");
}

/** Text fields of the slide form; an unchecked "isActive" box is simply missing. */
function parseSlide(formData: FormData) {
  const text = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value : "";
  };
  return slideSchema.safeParse({
    title: text("title"),
    subtitle: text("subtitle"),
    buttonLabel: text("buttonLabel"),
    linkUrl: text("linkUrl"),
    isActive: formData.get("isActive") ?? undefined,
  });
}

/** The uploaded image, if one was chosen (browsers send an empty file otherwise). */
function imageFile(formData: FormData) {
  const file = formData.get("image");
  return file instanceof File && file.size > 0 ? file : null;
}

export async function saveSlideAction(
  storeId: string,
  slideId: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseSlide(formData);
  if (!parsed.success) return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const file = imageFile(formData);
  if (!slideId && !file) return { ok: false, fieldErrors: { image: ["Choose an image for the slide."] } };

  try {
    const ctx = await requireStoreAccess(storeId, "theme:update");
    if (slideId) await updateSlide(ctx, id.parse(slideId), parsed.data, file ?? undefined);
    else await createSlide(ctx, file!, parsed.data);
  } catch (error) {
    return toActionState(error);
  }
  refreshSlides();
  return { ok: true, message: slideId ? "Slide saved." : "Slide added." };
}

export async function setSlideActiveAction(
  storeId: string,
  slideId: string,
  isActive: boolean,
): Promise<ActionState> {
  try {
    const ctx = await requireStoreAccess(storeId, "theme:update");
    await setSlideActive(ctx, id.parse(slideId), z.boolean().parse(isActive));
  } catch (error) {
    return toActionState(error);
  }
  refreshSlides();
  return { ok: true, message: isActive ? "Slide shown." : "Slide hidden." };
}

export async function moveSlideAction(
  storeId: string,
  slideId: string,
  direction: "up" | "down",
): Promise<ActionState> {
  try {
    const ctx = await requireStoreAccess(storeId, "theme:update");
    await moveSlide(ctx, id.parse(slideId), z.enum(["up", "down"]).parse(direction));
  } catch (error) {
    return toActionState(error);
  }
  refreshSlides();
  return { ok: true };
}

export async function deleteSlideAction(storeId: string, slideId: string): Promise<ActionState> {
  try {
    const ctx = await requireStoreAccess(storeId, "theme:update");
    await deleteSlide(ctx, id.parse(slideId));
  } catch (error) {
    return toActionState(error);
  }
  refreshSlides();
  return { ok: true, message: "Slide removed." };
}
