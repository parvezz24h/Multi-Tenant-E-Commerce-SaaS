import { z } from "zod";

import { BD_DISTRICTS } from "@/lib/bd-districts";
import { normalizeBdPhone } from "@/lib/phone";
import { optionalText, requiredText } from "@/lib/validation";

export const checkoutSchema = z.object({
  name: requiredText(2, 80),
  phone: z
    .string()
    .trim()
    .transform((v, ctx) => {
      const phone = normalizeBdPhone(v);
      if (!phone) {
        ctx.addIssue({ code: "custom", message: "Enter a valid Bangladeshi mobile number, e.g. 01712345678." });
        return z.NEVER;
      }
      return phone;
    }),
  email: z
    .union([z.literal(""), z.email("Enter a valid email address.")])
    .transform((v) => v || null),
  district: z
    .string()
    .trim()
    .refine((v) => BD_DISTRICTS.includes(v), "Choose your district."),
  upazila: requiredText(2, 60),
  area: optionalText(60),
  addressLine: requiredText(5, 200),
  postalCode: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d{4}$/.test(v), "Postal codes have 4 digits.")
    .transform((v) => v || null),
  note: optionalText(300),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
