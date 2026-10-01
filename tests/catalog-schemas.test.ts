import { describe, expect, it } from "vitest";

import { categorySchema, createProductSchema, stockAdjustmentSchema, updateProductSchema } from "@/server/catalog/schemas";

const product = {
  name: "Premium Panjabi",
  slug: "premium-panjabi",
  description: "",
  price: "1,800",
  compareAtPrice: "",
  sku: "",
  categoryId: "",
  status: "ACTIVE",
  featured: "",
  stock: "10",
};

describe("product schemas", () => {
  it("parses taka to poisha and blanks to null", () => {
    const parsed = createProductSchema.parse(product);
    expect(parsed).toMatchObject({ price: 180000, compareAtPrice: null, categoryId: null, featured: false, stock: 10 });
  });

  it("reads the featured checkbox", () => {
    expect(createProductSchema.parse({ ...product, featured: "on" }).featured).toBe(true);
  });

  it("requires compare-at above price", () => {
    const result = createProductSchema.safeParse({ ...product, compareAtPrice: "1500" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["compareAtPrice"]);
    expect(createProductSchema.safeParse({ ...product, compareAtPrice: "2100" }).success).toBe(true);
  });

  it.each(["0", "-5", "abc", ""])("rejects price %s", (price) => {
    expect(createProductSchema.safeParse({ ...product, price }).success).toBe(false);
  });

  it.each(["-1", "1.5", "abc", "2000000"])("rejects stock %s", (stock) => {
    expect(createProductSchema.safeParse({ ...product, stock }).success).toBe(false);
  });

  it("rejects unknown statuses and bad slugs", () => {
    expect(createProductSchema.safeParse({ ...product, status: "DELETED" }).success).toBe(false);
    expect(createProductSchema.safeParse({ ...product, slug: "Bad Slug" }).success).toBe(false);
  });

  it("doesn't accept stock on update", () => {
    const parsed = updateProductSchema.parse(product);
    expect(parsed).not.toHaveProperty("stock");
  });
});

describe("categorySchema", () => {
  it("parses sort order", () => {
    expect(categorySchema.parse({ name: "Men", slug: "men", description: "", sortOrder: "-2" }).sortOrder).toBe(-2);
  });
});

describe("stockAdjustmentSchema", () => {
  it("only allows manual reasons", () => {
    const base = { mode: "add", quantity: "5", note: "" };
    expect(stockAdjustmentSchema.safeParse({ ...base, reason: "RESTOCK" }).success).toBe(true);
    expect(stockAdjustmentSchema.safeParse({ ...base, reason: "ORDER_PLACED" }).success).toBe(false);
    expect(stockAdjustmentSchema.safeParse({ ...base, reason: "INITIAL" }).success).toBe(false);
  });
});
