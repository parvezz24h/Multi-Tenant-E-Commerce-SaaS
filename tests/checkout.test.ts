import { describe, expect, it } from "vitest";

import { deliveryChargeFor } from "@/lib/delivery";
import { checkoutSchema } from "@/server/checkout/schemas";

const valid = {
  name: "Nusrat Jahan",
  phone: "+880 1711-000001",
  email: "",
  district: "Dhaka",
  upazila: "Mirpur",
  area: "",
  addressLine: "House 14, Road 3",
  postalCode: "",
  note: "",
};

describe("checkoutSchema", () => {
  it("normalizes phone and blanks", () => {
    expect(checkoutSchema.parse(valid)).toMatchObject({
      phone: "01711000001",
      email: null,
      area: null,
      postalCode: null,
      note: null,
    });
  });

  it.each([
    ["phone", "12345"],
    ["phone", ""],
    ["district", "Atlantis"],
    ["district", ""],
    ["upazila", ""],
    ["addressLine", "abc"],
    ["postalCode", "12"],
    ["email", "not-an-email"],
    ["name", "A"],
  ])("rejects invalid %s (%s)", (field, value) => {
    const result = checkoutSchema.safeParse({ ...valid, [field]: value });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual([field]);
  });

  it("accepts a 4-digit postal code", () => {
    expect(checkoutSchema.parse({ ...valid, postalCode: "1216" }).postalCode).toBe("1216");
  });
});

describe("deliveryChargeFor", () => {
  const rates = { deliveryChargeInsideDhaka: 6000, deliveryChargeOutsideDhaka: 12000 };

  it("charges the inside-Dhaka rate only for Dhaka district", () => {
    expect(deliveryChargeFor("Dhaka", rates)).toBe(6000);
    expect(deliveryChargeFor("Gazipur", rates)).toBe(12000);
    expect(deliveryChargeFor("Chattogram", rates)).toBe(12000);
  });
});
