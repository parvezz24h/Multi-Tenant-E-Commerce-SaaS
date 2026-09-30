import { describe, expect, it } from "vitest";

import { storeSlugFromHost, storeUrl } from "@/lib/hosts";

describe("storeSlugFromHost", () => {
  const root = "shopbd.com";

  it.each([
    ["rahim-fashion.shopbd.com", "rahim-fashion"],
    ["Rahim-Fashion.ShopBD.com", "rahim-fashion"],
    ["rahim-fashion.shopbd.com.", "rahim-fashion"],
    ["rahim-fashion.localhost:3000", "rahim-fashion"],
    ["rahim-fashion.localhost", "rahim-fashion"],
  ])("resolves %s → %s", (host, slug) => {
    expect(storeSlugFromHost(host, root)).toBe(slug);
  });

  it.each([
    "shopbd.com",
    "www.shopbd.com",
    "app.shopbd.com",
    "localhost:3000",
    "a.b.shopbd.com",
    "evilshopbd.com",
    "rahim.shopbd.com.evil.com",
    "rahimfashion.com",
    "",
    null,
  ])("treats %s as not a store subdomain", (host) => {
    expect(storeSlugFromHost(host, root)).toBeNull();
  });
});

describe("storeUrl", () => {
  it("uses <slug>.localhost in development", () => {
    expect(storeUrl("rahim", "http://localhost:3000")).toBe("http://rahim.localhost:3000");
  });

  it("uses the root domain in production", () => {
    expect(storeUrl("rahim", "https://shopbd.com")).toMatch(/^https:\/\/rahim\./);
  });
});
