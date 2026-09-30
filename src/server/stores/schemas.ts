import { z } from "zod";

import { BD_DISTRICTS } from "@/lib/bd-districts";

/**
 * Slugs become platform subdomains (`<slug>.shopbd.com`), so they follow
 * DNS label rules and must not collide with platform hostnames.
 */
export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "app",
  "assets",
  "auth",
  "billing",
  "blog",
  "cdn",
  "dashboard",
  "dev",
  "docs",
  "help",
  "mail",
  "media",
  "shop",
  "shopbd",
  "static",
  "staging",
  "status",
  "store",
  "stores",
  "support",
  "test",
  "www",
]);

export const SLUG_MIN = 3;
export const SLUG_MAX = 40;

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(SLUG_MIN, `Must be at least ${SLUG_MIN} characters.`)
  .max(SLUG_MAX, `Must be at most ${SLUG_MAX} characters.`)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers and single hyphens (not at the start or end).",
  )
  .refine((slug) => !RESERVED_SLUGS.has(slug), "This address is reserved.");

/** Suggest a slug from a store name, e.g. "Rahim Fashion!" → "rahim-fashion". */
export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, "");
}

/** Empty form fields become null so they clear the column. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be at most ${max} characters.`)
    .transform((v) => v || null);

const storeName = z
  .string()
  .trim()
  .min(2, "Must be at least 2 characters.")
  .max(80, "Must be at most 80 characters.");

// Bangladeshi mobile numbers: 01XXXXXXXXX, optionally prefixed by +880/880.
const BD_PHONE = /^(?:\+?880|0)1[3-9]\d{8}$/;

export const createStoreSchema = z.object({
  name: storeName,
  slug: slugSchema,
});

export const updateStoreSchema = z.object({
  name: storeName,
  slug: slugSchema,
  description: optionalText(500),
  logoUrl: z
    .union([z.literal(""), z.url({ protocol: /^https$/, error: "Must be an https:// URL." })])
    .transform((v) => v || null),
  contactEmail: z
    .union([z.literal(""), z.email("Enter a valid email address.")])
    .transform((v) => v || null),
  contactPhone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .refine((v) => v === "" || BD_PHONE.test(v), "Enter a valid Bangladeshi mobile number.")
    .transform((v) => v || null),
  addressLine: optionalText(200),
  district: z
    .string()
    .trim()
    .refine((v) => v === "" || BD_DISTRICTS.includes(v), "Choose a district from the list.")
    .transform((v) => v || null),
});

export type CreateStoreInput = z.infer<typeof createStoreSchema>;
export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;
