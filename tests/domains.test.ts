import { domainToASCII } from "node:url";

import { describe, expect, it } from "vitest";

import { pairedHost } from "@/lib/custom-domain-lookup";
import { isPlatformHost, normalizeHost } from "@/lib/hosts";
import { dnsRecordsFor, parseCustomDomain, redirectDomainFor } from "@/server/domains/hostname";

const ROOT = "shopcreatorbd.vercel.app";
const targets = { cname: "cname.vercel-dns.com", aRecord: "76.76.21.21" };

function parsed(input: string) {
  const result = parseCustomDomain(input, ROOT);
  if (!result.ok) throw new Error(result.error);
  return result.domain;
}

describe("parseCustomDomain", () => {
  it.each([
    ["www.rahimfashion.com", "www.rahimfashion.com", "rahimfashion.com", "www"],
    ["  https://WWW.RahimFashion.com/shop?x=1 ", "www.rahimfashion.com", "rahimfashion.com", "www"],
    ["rahimfashion.com.bd", "rahimfashion.com.bd", "rahimfashion.com.bd", ""],
    ["shop.rahim.com.bd", "shop.rahim.com.bd", "rahim.com.bd", "shop"],
    ["rahimfashion.com:8080", "rahimfashion.com", "rahimfashion.com", ""],
    ["rahimfashion.com.", "rahimfashion.com", "rahimfashion.com", ""],
  ])("%s → %s", (input, hostname, apex, subdomain) => {
    expect(parsed(input)).toEqual({ hostname, apex, subdomain });
  });

  it("converts Unicode (Bangla) domains to punycode", () => {
    const ascii = domainToASCII("দোকান.com");
    expect(ascii.startsWith("xn--")).toBe(true);
    expect(parsed("দোকান.com")).toEqual({ hostname: ascii, apex: ascii, subdomain: "" });
  });

  it.each([
    ["", "Enter a domain"],
    ["192.168.1.10", "IP address"],
    ["localhost", "registered domain"],
    ["not a domain", "domain"],
    ["foo.invalidtld", "registered domain"],
    [ROOT, "platform address"],
    [`rahim.${ROOT}`, "platform address"],
    ["someone-else.vercel.app", "platform address"],
  ])("rejects %s", (input, message) => {
    const result = parseCustomDomain(input, ROOT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain(message);
  });
});

describe("dnsRecordsFor", () => {
  it("uses a CNAME for subdomains", () => {
    expect(dnsRecordsFor(parsed("www.rahimfashion.com"), targets)).toEqual([
      { type: "CNAME", name: "www", value: "cname.vercel-dns.com", purpose: "routing" },
    ]);
  });

  it("uses an A record for apex domains (incl. .com.bd)", () => {
    expect(dnsRecordsFor(parsed("rahimfashion.com.bd"), targets)).toEqual([
      { type: "A", name: "@", value: "76.76.21.21", purpose: "routing" },
    ]);
  });

  it("adds TXT ownership challenges relative to the apex", () => {
    const records = dnsRecordsFor(parsed("www.rahimfashion.com"), targets, [
      { type: "TXT", domain: "_vercel.rahimfashion.com", value: "vc-domain-verify=www.rahimfashion.com,abc" },
      { type: "CNAME", domain: "ignored.rahimfashion.com", value: "x" },
    ]);
    expect(records).toHaveLength(2);
    expect(records[1]).toEqual({
      type: "TXT",
      name: "_vercel",
      value: "vc-domain-verify=www.rahimfashion.com,abc",
      purpose: "verification",
    });
  });
});

describe("redirectDomainFor", () => {
  it("pairs www with the apex, both ways", () => {
    expect(redirectDomainFor(parsed("www.motkhola.com"))).toEqual({
      hostname: "motkhola.com",
      apex: "motkhola.com",
      subdomain: "",
    });
    expect(redirectDomainFor(parsed("rahim.com.bd"))).toEqual({
      hostname: "www.rahim.com.bd",
      apex: "rahim.com.bd",
      subdomain: "www",
    });
  });

  it("leaves other subdomains alone", () => {
    expect(redirectDomainFor(parsed("shop.rahim.com"))).toBeNull();
  });

  it("adds the forwarding record and de-duplicates shared TXT challenges", () => {
    const domain = parsed("www.motkhola.com");
    const challenge = { type: "TXT", domain: "_vercel.motkhola.com", value: "vc-domain-verify=abc" };
    expect(dnsRecordsFor(domain, targets, [challenge, challenge], redirectDomainFor(domain))).toEqual([
      { type: "CNAME", name: "www", value: "cname.vercel-dns.com", purpose: "routing" },
      { type: "A", name: "@", value: "76.76.21.21", purpose: "redirect" },
      { type: "TXT", name: "_vercel", value: "vc-domain-verify=abc", purpose: "verification" },
    ]);
  });
});

describe("pairedHost", () => {
  it.each([
    ["motkhola.com", "www.motkhola.com"],
    ["www.motkhola.com", "motkhola.com"],
  ])("%s ↔ %s", (host, paired) => expect(pairedHost(host)).toBe(paired));
});

describe("isPlatformHost", () => {
  const app = "https://shopcreatorbd.vercel.app";

  it.each([ROOT, `www.${ROOT}`, "localhost:3000", "127.0.0.1", "my-preview-abc123.vercel.app", "SHOPCREATORBD.VERCEL.APP."])(
    "%s is the platform",
    (host) => {
      expect(isPlatformHost(host, ROOT, app)).toBe(true);
    },
  );

  it.each(["www.rahimfashion.com", "rahimfashion.com.bd", "shopcreatorbd.vercel.app.evil.com"])(
    "%s is a custom domain",
    (host) => {
      expect(isPlatformHost(host, ROOT, app)).toBe(false);
    },
  );
});

describe("normalizeHost", () => {
  it("strips port, case and trailing dot", () => {
    expect(normalizeHost("WWW.Shop.com.:443")).toBe("www.shop.com");
    expect(normalizeHost("[::1]:3000")).toBe("[::1]");
    expect(normalizeHost(null)).toBe("");
  });
});
