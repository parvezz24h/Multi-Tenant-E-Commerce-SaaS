"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { toActionState, type ActionState } from "@/server/errors";
import { requireStoreAccess } from "@/server/tenant/context";

import { createCategory, deleteCategory, updateCategory } from "./categories";
import { addProductImage, deleteProductImage, setCoverImage } from "./images";
import { adjustStockManually } from "./inventory";
import { createProduct, deleteProduct, updateProduct } from "./products";
import {
  categorySchema,
  createProductSchema,
  stockAdjustmentSchema,
  updateProductSchema,
} from "./schemas";

const id = z.string().min(1).max(64);

/** Missing inputs (unchecked boxes, untouched selects) parse as blank. */
function formValues(formData: FormData, shape: object) {
  const blank = Object.fromEntries(Object.keys(shape).map((key) => [key, ""]));
  const values: Record<string, FormDataEntryValue> = {};
  for (const [key, value] of formData) if (typeof value === "string") values[key] = value;
  return { ...blank, ...values };
}

function invalid(error: z.ZodError): ActionState {
  return { ok: false, fieldErrors: z.flattenError(error).fieldErrors };
}

function refreshCatalog() {
  revalidatePath("/dashboard/[storeSlug]", "layout");
  revalidatePath("/s/[storeSlug]", "layout");
}

// ── Products ────────────────────────────────────────────────

export async function createProductAction(
  storeId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = createProductSchema.safeParse(formValues(formData, createProductSchema.shape));
  if (!parsed.success) return invalid(parsed.error);

  let productId: string;
  let slug: string;
  try {
    const ctx = await requireStoreAccess(storeId, "products:write");
    productId = (await createProduct(ctx, parsed.data)).id;
    slug = ctx.store.slug;
  } catch (error) {
    return toActionState(error);
  }
  refreshCatalog();
  redirect(`/dashboard/${slug}/products/${productId}?created=1`);
}

export async function updateProductAction(
  storeId: string,
  productId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = updateProductSchema.safeParse(formValues(formData, updateProductSchema.shape));
  if (!parsed.success) return invalid(parsed.error);

  try {
    const ctx = await requireStoreAccess(storeId, "products:write");
    await updateProduct(ctx, id.parse(productId), parsed.data);
  } catch (error) {
    return toActionState(error);
  }
  refreshCatalog();
  return { ok: true, message: "Product saved." };
}

export async function deleteProductAction(storeId: string, productId: string): Promise<ActionState> {
  let slug: string;
  try {
    const ctx = await requireStoreAccess(storeId, "products:write");
    await deleteProduct(ctx, id.parse(productId));
    slug = ctx.store.slug;
  } catch (error) {
    return toActionState(error);
  }
  refreshCatalog();
  redirect(`/dashboard/${slug}/products`);
}

// ── Images ──────────────────────────────────────────────────

export async function uploadProductImageAction(
  storeId: string,
  productId: string,
  formData: FormData,
): Promise<ActionState> {
  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, message: "Choose an image to upload." };

  try {
    const ctx = await requireStoreAccess(storeId, "products:write");
    await addProductImage(ctx, id.parse(productId), file);
  } catch (error) {
    return toActionState(error);
  }
  refreshCatalog();
  return { ok: true };
}

export async function deleteProductImageAction(storeId: string, imageId: string): Promise<ActionState> {
  try {
    const ctx = await requireStoreAccess(storeId, "products:write");
    await deleteProductImage(ctx, id.parse(imageId));
  } catch (error) {
    return toActionState(error);
  }
  refreshCatalog();
  return { ok: true, message: "Image removed." };
}

export async function setCoverImageAction(storeId: string, imageId: string): Promise<ActionState> {
  try {
    const ctx = await requireStoreAccess(storeId, "products:write");
    await setCoverImage(ctx, id.parse(imageId));
  } catch (error) {
    return toActionState(error);
  }
  refreshCatalog();
  return { ok: true, message: "Cover image updated." };
}

// ── Categories ──────────────────────────────────────────────

export async function saveCategoryAction(
  storeId: string,
  categoryId: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = categorySchema.safeParse(formValues(formData, categorySchema.shape));
  if (!parsed.success) return invalid(parsed.error);

  try {
    const ctx = await requireStoreAccess(storeId, "products:write");
    if (categoryId) await updateCategory(ctx, id.parse(categoryId), parsed.data);
    else await createCategory(ctx, parsed.data);
  } catch (error) {
    return toActionState(error);
  }
  refreshCatalog();
  return { ok: true, message: categoryId ? "Category saved." : "Category created." };
}

export async function deleteCategoryAction(storeId: string, categoryId: string): Promise<ActionState> {
  try {
    const ctx = await requireStoreAccess(storeId, "products:write");
    await deleteCategory(ctx, id.parse(categoryId));
  } catch (error) {
    return toActionState(error);
  }
  refreshCatalog();
  return { ok: true, message: "Category deleted." };
}

// ── Inventory ───────────────────────────────────────────────

export async function adjustStockAction(
  storeId: string,
  productId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = stockAdjustmentSchema.safeParse(formValues(formData, stockAdjustmentSchema.shape));
  if (!parsed.success) return invalid(parsed.error);

  let stock: number;
  try {
    const ctx = await requireStoreAccess(storeId, "products:write");
    stock = await adjustStockManually(ctx, id.parse(productId), parsed.data);
  } catch (error) {
    return toActionState(error);
  }
  refreshCatalog();
  return { ok: true, message: `Stock updated to ${stock}.` };
}
