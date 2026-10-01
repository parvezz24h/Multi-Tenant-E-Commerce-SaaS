import { z } from "zod";

import { normalizeBdPhone } from "@/lib/phone";
import { requiredText } from "@/lib/validation";

export const CONTACT_TOPICS = [
  { value: "general", label: "General question" },
  { value: "setup", label: "Setting up my store" },
  { value: "billing", label: "Billing & payments" },
  { value: "domain", label: "Custom domain" },
  { value: "other", label: "Something else" },
] as const;

export type ContactTopic = (typeof CONTACT_TOPICS)[number]["value"];

export const topicLabel = (value: string) =>
  CONTACT_TOPICS.find((t) => t.value === value)?.label ?? value;

export const contactMessageSchema = z.object({
  name: requiredText(2, 80),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.")),
  phone: z
    .string()
    .trim()
    .transform((v, ctx) => {
      if (!v) return null;
      const phone = normalizeBdPhone(v);
      if (!phone) ctx.addIssue({ code: "custom", message: "Enter a valid Bangladeshi mobile number." });
      return phone;
    }),
  topic: z.enum(CONTACT_TOPICS.map((t) => t.value) as [ContactTopic, ...ContactTopic[]], {
    error: "Choose a topic.",
  }),
  message: requiredText(10, 2000),
});

export type ContactMessageInput = z.infer<typeof contactMessageSchema>;
