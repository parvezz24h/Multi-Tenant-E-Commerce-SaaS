import { describe, expect, it } from "vitest";

import { formatInvoiceNumber } from "@/lib/subscription";
import { paymentSubmissionSchema, planUpdateSchema } from "@/server/billing/schemas";

describe("paymentSubmissionSchema", () => {
  const base = { method: "BKASH", payerAccount: "01711000001", reference: " 9k7a2bxq4m " };

  it("normalizes the transaction ID", () => {
    expect(paymentSubmissionSchema.parse(base).reference).toBe("9K7A2BXQ4M");
  });

  it.each([
    ["method", "CASH"],
    ["method", ""],
    ["reference", "abc"],
    ["reference", "has spaces in it"],
    ["payerAccount", ""],
  ])("rejects %s = %j", (field, value) => {
    expect(paymentSubmissionSchema.safeParse({ ...base, [field]: value }).success).toBe(false);
  });
});

describe("planUpdateSchema", () => {
  const base = {
    name: "Business",
    description: "",
    priceMonthly: "1,499",
    maxProducts: "1000",
    maxStaff: "",
    customDomain: "on",
    isActive: undefined,
  };

  it("parses prices, limits and checkboxes", () => {
    expect(planUpdateSchema.parse(base)).toEqual({
      name: "Business",
      description: null,
      priceMonthly: 149900,
      maxProducts: 1000,
      maxStaff: null,
      customDomain: true,
      isActive: false,
    });
  });

  it.each([
    ["maxProducts", "-1"],
    ["maxProducts", "1.5"],
    ["priceMonthly", "abc"],
    ["priceMonthly", "200000"],
  ])("rejects %s = %s", (field, value) => {
    expect(planUpdateSchema.safeParse({ ...base, [field]: value }).success).toBe(false);
  });
});

describe("formatInvoiceNumber", () => {
  it("pads to six digits", () => {
    expect(formatInvoiceNumber(42)).toBe("INV-000042");
    expect(formatInvoiceNumber(1234567)).toBe("INV-1234567");
  });
});
