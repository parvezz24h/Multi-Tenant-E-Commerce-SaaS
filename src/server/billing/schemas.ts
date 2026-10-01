import { z } from "zod";

import { optionalText, requiredText, takaAmount } from "@/lib/validation";

export const BILLING_METHOD_LABELS = {
  BKASH: "bKash",
  NAGAD: "Nagad",
  BANK: "Bank transfer",
  CASH: "Cash",
  OTHER: "Other",
} as const;

/** What a merchant reports after sending money. */
export const paymentSubmissionSchema = z.object({
  method: z.enum(["BKASH", "NAGAD", "BANK"], { error: "Choose how you paid." }),
  payerAccount: requiredText(3, 40),
  reference: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{6,40}$/, "Enter the transaction ID exactly as shown in your payment app."),
});

export const reviewNoteSchema = optionalText(300);

/** Admin edit of a plan. Empty limits mean unlimited. */
export const planUpdateSchema = z.object({
  name: requiredText(2, 40),
  description: optionalText(200),
  priceMonthly: takaAmount.refine((v) => v <= 10_000_000, "Must be at most ৳1,00,000."),
  maxProducts: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d{1,7}$/.test(v), "Enter a whole number, or leave empty for unlimited.")
    .transform((v) => (v === "" ? null : Number(v))),
  maxStaff: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d{1,4}$/.test(v), "Enter a whole number, or leave empty for unlimited.")
    .transform((v) => (v === "" ? null : Number(v))),
  customDomain: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  isActive: z
    .string()
    .optional()
    .transform((v) => v === "on"),
});

export type PaymentSubmission = z.infer<typeof paymentSubmissionSchema>;
export type PlanUpdate = z.infer<typeof planUpdateSchema>;
