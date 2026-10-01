import { z } from "zod";

import { BD_DISTRICTS } from "@/lib/bd-districts";
import { HEX_COLOR } from "@/lib/color";
import { BD_PHONE } from "@/lib/phone";
import { httpsUrl, optionalText, SLUG_PATTERN, takaAmount } from "@/lib/validation";

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
    SLUG_PATTERN,
    "Use lowercase letters, numbers and single hyphens (not at the start or end).",
  )
  .refine((slug) => !RESERVED_SLUGS.has(slug), "This address is reserved.");

/** Suggest a slug from a store name, e.g. "Rahim Fashion!" → "rahim-fashion". */
export function slugify(input: string, max = SLUG_MAX) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/g, "");
}

const deliveryCharge = takaAmount.refine((v) => v <= 1_000_000, "Must be at most ৳10,000.");

const storeName = z
  .string()
  .trim()
  .min(2, "Must be at least 2 characters.")
  .max(80, "Must be at most 80 characters.");

export const createStoreSchema = z.object({
  name: storeName,
  slug: slugSchema,
});

export const updateStoreSchema = z.object({
  name: storeName,
  slug: slugSchema,
  description: optionalText(500),
  logoUrl: httpsUrl,
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
  deliveryChargeInsideDhaka: deliveryCharge,
  deliveryChargeOutsideDhaka: deliveryCharge,
});

export const updateStoreThemeSchema = z.object({
  themeKey: z.string().trim().min(1).max(40),
  primaryColor: z
    .string()
    .trim()
    .regex(HEX_COLOR, "Use a hex color like #0f766e.")
    .transform((v) => v.toLowerCase()),
  heroTitle: optionalText(80),
  heroSubtitle: optionalText(200),
  heroImageUrl: httpsUrl,
  announcement: optionalText(120),
  footerText: optionalText(200),
});

export type CreateStoreInput = z.infer<typeof createStoreSchema>;
export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;
export type UpdateStoreThemeInput = z.infer<typeof updateStoreThemeSchema>;
