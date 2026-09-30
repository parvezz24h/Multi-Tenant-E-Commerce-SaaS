import { describe, expect, it } from "vitest";

import { slugify, slugSchema, updateStoreSchema } from "@/server/stores/schemas";

describe("slugSchema", () => {
  it.each(["rahim-fashion", "shop24", "abc"])("accepts %s", (slug) => {
    expect(slugSchema.safeParse(slug).success).toBe(true);
  });

  it("normalizes case and whitespace", () => {
    expect(slugSchema.parse("  Rahim-Fashion ")).toBe("rahim-fashion");
  });

  it.each([
    ["too short", "ab"],
    ["leading hyphen", "-shop"],
    ["trailing hyphen", "shop-"],
    ["double hyphen", "my--shop"],
    ["underscore", "my_shop"],
    ["bangla text", "দোকান"],
    ["reserved", "admin"],
    ["reserved www", "www"],
    ["too long", "a".repeat(41)],
  ])("rejects %s", (_label, slug) => {
    expect(slugSchema.safeParse(slug).success).toBe(false);
  });
});

describe("slugify", () => {
  it("builds a valid slug from a store name", () => {
    expect(slugify("Rahim Fashion & Co.!")).toBe("rahim-fashion-co");
    expect(slugSchema.safeParse(slugify("Rahim Fashion & Co.!")).success).toBe(true);
  });
});

describe("updateStoreSchema", () => {
  const base = {
    name: "Rahim Fashion",
    slug: "rahim-fashion",
    description: "",
    logoUrl: "",
    contactEmail: "",
    contactPhone: "",
    addressLine: "",
    district: "",
  };

  it("turns empty optional fields into null", () => {
    const parsed = updateStoreSchema.parse(base);
    expect(parsed.description).toBeNull();
    expect(parsed.district).toBeNull();
    expect(parsed.contactPhone).toBeNull();
  });

  it.each(["01712345678", "+8801712345678", "017-1234-5678"])("accepts BD phone %s", (phone) => {
    expect(updateStoreSchema.safeParse({ ...base, contactPhone: phone }).success).toBe(true);
  });

  it.each(["01212345678", "12345", "+15551234567"])("rejects phone %s", (phone) => {
    expect(updateStoreSchema.safeParse({ ...base, contactPhone: phone }).success).toBe(false);
  });

  it("only allows known districts", () => {
    expect(updateStoreSchema.safeParse({ ...base, district: "Dhaka" }).success).toBe(true);
    expect(updateStoreSchema.safeParse({ ...base, district: "Atlantis" }).success).toBe(false);
  });

  it("requires https logo URLs", () => {
    expect(updateStoreSchema.safeParse({ ...base, logoUrl: "https://x.com/a.png" }).success).toBe(true);
    expect(updateStoreSchema.safeParse({ ...base, logoUrl: "http://x.com/a.png" }).success).toBe(false);
    expect(updateStoreSchema.safeParse({ ...base, logoUrl: "javascript:alert(1)" }).success).toBe(false);
  });
});
