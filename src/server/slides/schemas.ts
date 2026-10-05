import { z } from "zod";

import { checkbox, optionalText } from "@/lib/validation";

export const MAX_SLIDES = 5;

/** A path on the store ("/products/panjabi") — not "//host", which leaves the site. */
const STORE_PATH = /^\/(?!\/)[^\s\\]*$/;

/** Where a slide's button goes: a store path or an https URL. Blank means none. */
export const slideLink = z
  .string()
  .trim()
  .max(300, "Must be at most 300 characters.")
  .refine((v) => {
    if (v === "" || STORE_PATH.test(v)) return true;
    try {
      return new URL(v).protocol === "https:";
    } catch {
      return false;
    }
  }, "Use a store path like /products, or an https:// URL.")
  .transform((v) => v || null);

export const slideSchema = z
  .object({
    title: optionalText(80),
    subtitle: optionalText(200),
    buttonLabel: optionalText(30),
    linkUrl: slideLink,
    isActive: checkbox,
  })
  .refine((v) => !v.buttonLabel || v.linkUrl, {
    message: "Add a link for the button.",
    path: ["linkUrl"],
  });

export type SlideInput = z.infer<typeof slideSchema>;
