import { describe, expect, it } from "vitest";

import { storeSlugFromHost, storeUrl } from "@/lib/hosts";

describe("storeSlugFromHost", () => {
  const root = "shopcreatorbd.vercel.app";

  it.each([
    ["rahim-fashion.shopcreatorbd.vercel.app", "rahim-fashion"],
    ["Rahim-Fashion.ShopCreatorBD.Vercel.App", "rahim-fashion"],
    ["rahim-fashion.shopcreatorbd.vercel.app.", "rahim-fashion"],
    ["rahim-fashion.localhost:3000", "rahim-fashion"],
    ["rahim-fashion.localhost", "rahim-fashion"],
  ])("resolves %s → %s", (host, slug) => {
    expect(storeSlugFromHost(host, root)).toBe(slug);
  });

  it.each([
    "shopcreatorbd.vercel.app",
    "other-app.vercel.app",
    "www.shopcreatorbd.vercel.app",
    "app.shopcreatorbd.vercel.app",
    "localhost:3000",
    "a.b.shopcreatorbd.vercel.app",
    "evilshopcreatorbd.vercel.app",
    "rahim.shopcreatorbd.vercel.app.evil.com",
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
    expect(storeUrl("rahim", "https://shopcreatorbd.vercel.app")).toMatch(/^https:\/\/rahim\./);
  });
});
