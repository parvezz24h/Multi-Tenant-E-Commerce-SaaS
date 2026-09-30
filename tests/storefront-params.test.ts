import { describe, expect, it } from "vitest";

import { parseProductQuery, productsHref } from "@/server/storefront/params";

describe("parseProductQuery", () => {
  it("parses valid params", () => {
    expect(
      parseProductQuery({ q: " panjabi ", category: "men", inStock: "1", sort: "price-asc", page: "2" }),
    ).toEqual({ q: "panjabi", categorySlug: "men", inStock: true, sort: "price-asc", page: 2 });
  });

  it("falls back to safe defaults for junk input", () => {
    expect(parseProductQuery({ sort: "toString", page: "-3" })).toMatchObject({
      sort: "newest",
      page: 1,
      inStock: false,
    });
    expect(parseProductQuery({ sort: "constructor", page: "abc" }).sort).toBe("newest");
  });

  it("uses the first value of repeated params", () => {
    expect(parseProductQuery({ q: ["a", "b"] }).q).toBe("a");
  });

  it("caps search length", () => {
    expect(parseProductQuery({ q: "x".repeat(500) }).q).toHaveLength(100);
  });
});

describe("productsHref", () => {
  it("omits defaults", () => {
    expect(productsHref({ sort: "newest", page: 1, inStock: false })).toBe("/products");
  });

  it("merges overrides and encodes values", () => {
    expect(productsHref({ q: "a&b", categorySlug: "men" }, { page: 3, sort: "name" })).toBe(
      "/products?q=a%26b&category=men&sort=name&page=3",
    );
  });
});
