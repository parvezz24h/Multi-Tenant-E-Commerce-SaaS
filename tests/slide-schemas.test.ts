import { describe, expect, it } from "vitest";

import { slideLink, slideSchema } from "@/server/slides/schemas";

const slide = { title: "", subtitle: "", buttonLabel: "", linkUrl: "", isActive: "on" };

describe("slide schema", () => {
  it("allows an image-only slide and blanks to null", () => {
    expect(slideSchema.parse(slide)).toEqual({
      title: null,
      subtitle: null,
      buttonLabel: null,
      linkUrl: null,
      isActive: true,
    });
  });

  it("reads a missing checkbox as hidden", () => {
    expect(slideSchema.parse({ ...slide, isActive: undefined }).isActive).toBe(false);
  });

  it("requires a link when there is a button", () => {
    const result = slideSchema.safeParse({ ...slide, buttonLabel: "Shop now" });
    expect(result.success).toBe(false);
    expect(slideSchema.parse({ ...slide, buttonLabel: "Shop now", linkUrl: "/products" }).linkUrl).toBe("/products");
  });
});

describe("slide link", () => {
  it.each(["/products", "/products/premium-panjabi?ref=eid", "https://facebook.com/rahimfashion"])(
    "accepts %s",
    (link) => expect(slideLink.parse(link)).toBe(link),
  );

  it.each(["//evil.com", "http://example.com", "javascript:alert(1)", "products", "/a b", "/\\evil.com"])(
    "rejects %s",
    (link) => expect(slideLink.safeParse(link).success).toBe(false),
  );
});
