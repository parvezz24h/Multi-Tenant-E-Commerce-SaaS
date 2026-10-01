import { z } from "zod";

import {
  checkbox,
  entitySlug,
  optionalTakaAmount,
  optionalText,
  requiredText,
  takaAmount,
  wholeNumber,
} from "@/lib/validation";

export const MAX_STOCK = 1_000_000;
export const LOW_STOCK_THRESHOLD = 5;
export const MAX_IMAGES_PER_PRODUCT = 8;

const productFields = {
  name: requiredText(2, 120),
  slug: entitySlug,
  description: optionalText(5000),
  price: takaAmount.refine((v) => v > 0, "Price must be more than ৳0."),
  compareAtPrice: optionalTakaAmount,
  sku: optionalText(64),
  categoryId: z
    .string()
    .trim()
    .max(64)
    .transform((v) => v || null),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"], { error: "Choose a status." }),
  featured: checkbox,
};

function compareAtAbovePrice(
  data: { price: number; compareAtPrice: number | null },
  ctx: z.RefinementCtx,
) {
  if (data.compareAtPrice !== null && data.compareAtPrice <= data.price) {
    ctx.addIssue({
      code: "custom",
      path: ["compareAtPrice"],
      message: "Must be higher than the price, or leave it empty.",
    });
  }
}

/** Stock is set once on create; afterwards it changes only through adjustments. */
export const createProductSchema = z
  .object({ ...productFields, stock: wholeNumber(MAX_STOCK) })
  .superRefine(compareAtAbovePrice);

export const updateProductSchema = z.object(productFields).superRefine(compareAtAbovePrice);

export const categorySchema = z.object({
  name: requiredText(1, 60),
  slug: entitySlug,
  description: optionalText(300),
  sortOrder: z
    .string()
    .trim()
    .regex(/^-?\d{1,4}$/, "Enter a number.")
    .transform(Number),
});

export const stockAdjustmentSchema = z.object({
  mode: z.enum(["add", "remove", "set"]),
  quantity: wholeNumber(MAX_STOCK),
  reason: z.enum(["RESTOCK", "CORRECTION", "DAMAGED"], { error: "Choose a reason." }),
  note: optionalText(200),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
