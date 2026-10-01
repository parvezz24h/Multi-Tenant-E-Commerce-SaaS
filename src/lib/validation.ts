import { z } from "zod";

/** Empty form fields become null so they clear the column. */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be at most ${max} characters.`)
    .transform((v) => v || null);

export const requiredText = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min, min === 1 ? "Required." : `Must be at least ${min} characters.`)
    .max(max, `Must be at most ${max} characters.`);

const TAKA = /^\d{1,7}(\.\d{1,2})?$/;

/** A taka amount typed by a merchant ("60" or "60.50") → minor units (poisha). */
export const takaAmount = z
  .string()
  .trim()
  .transform((v) => v.replace(/,/g, ""))
  .refine((v) => TAKA.test(v), "Enter an amount in taka, e.g. 60.")
  .transform((v) => Math.round(Number(v) * 100));

/** Like `takaAmount`, but an empty field means null. */
export const optionalTakaAmount = z
  .string()
  .trim()
  .transform((v) => v.replace(/,/g, ""))
  .refine((v) => v === "" || TAKA.test(v), "Enter an amount in taka, e.g. 60.")
  .transform((v) => (v === "" ? null : Math.round(Number(v) * 100)));

/** Minor units → the string shown in a taka input ("1250" / "60.5"). */
export const toTakaInput = (minor: number | null | undefined) =>
  minor === null || minor === undefined ? "" : String(minor / 100);

export const httpsUrl = z
  .union([z.literal(""), z.url({ protocol: /^https$/, error: "Must be an https:// URL." })])
  .transform((v) => v || null);

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** URL slug for products and categories (unique per store). */
export const entitySlug = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Required.")
  .max(80, "Must be at most 80 characters.")
  .regex(SLUG_PATTERN, "Use lowercase letters, numbers and single hyphens.");

/** A non-negative whole number typed into a form field. */
export const wholeNumber = (max: number) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/, "Enter a whole number.")
    .transform(Number)
    .refine((n) => n <= max, `Must be at most ${max.toLocaleString("en-US")}.`);

/** HTML checkboxes submit "on" when checked and nothing when not. */
export const checkbox = z
  .string()
  .optional()
  .transform((v) => v === "on" || v === "true");
