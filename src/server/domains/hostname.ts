import { parse } from "tldts";

import { isPlatformHost, rootDomain } from "@/lib/hosts";

export type ParsedDomain = {
  /** Lowercase punycode hostname, e.g. "www.rahimfashion.com". */
  hostname: string;
  /** Registrable domain, e.g. "rahimfashion.com" or "rahimfashion.com.bd". */
  apex: string;
  /** Part before the apex ("www"), or "" for the apex itself. */
  subdomain: string;
};

export type ParseResult = { ok: true; domain: ParsedDomain } | { ok: false; error: string };

/**
 * Turn whatever a merchant pasted ("https://www.Shop.com/", "shop.com.bd")
 * into a hostname we can connect, or explain why we can't.
 */
export function parseCustomDomain(input: string, root = rootDomain()): ParseResult {
  let raw = input.trim().toLowerCase();
  if (!raw) return { ok: false, error: "Enter a domain, e.g. www.yourshop.com." };
  if (!/^[a-z][a-z0-9+.-]*:\/\//.test(raw)) raw = `http://${raw}`;

  let hostname: string;
  try {
    // URL handles ports/paths and converts Unicode (IDN) domains to punycode.
    hostname = new URL(raw).hostname.replace(/\.$/, "");
  } catch {
    return { ok: false, error: "That doesn't look like a domain." };
  }

  const info = parse(hostname);
  if (info.isIp) return { ok: false, error: "Use a domain name, not an IP address." };
  if (!info.domain || !info.isIcann || hostname.length > 253) {
    return { ok: false, error: "That doesn't look like a registered domain." };
  }
  if (hostname === root || hostname.endsWith(`.${root}`) || isPlatformHost(hostname, root)) {
    return { ok: false, error: "That's a platform address. Enter a domain you own." };
  }

  return {
    ok: true,
    domain: { hostname, apex: info.domain, subdomain: info.subdomain ?? "" },
  };
}

export type DnsRecord = {
  type: "A" | "CNAME" | "TXT";
  /** Host/name as most DNS panels expect it, relative to the apex ("@" = apex). */
  name: string;
  value: string;
  purpose: "routing" | "verification";
};

export type DnsTargets = { cname: string; aRecord: string };

/** Defaults are Vercel's documented values; override per deployment via env. */
export function defaultDnsTargets(): DnsTargets {
  return {
    cname: process.env.DOMAIN_CNAME_TARGET || "cname.vercel-dns.com",
    aRecord: process.env.DOMAIN_A_RECORD || "76.76.21.21",
  };
}

/**
 * Records the merchant must add: an A record for an apex domain, a CNAME for
 * a subdomain, plus any TXT challenges the hosting provider asks for.
 */
export function dnsRecordsFor(
  domain: ParsedDomain,
  targets: DnsTargets,
  challenges: { type: string; domain: string; value: string }[] = [],
): DnsRecord[] {
  const routing: DnsRecord = domain.subdomain
    ? { type: "CNAME", name: domain.subdomain, value: targets.cname, purpose: "routing" }
    : { type: "A", name: "@", value: targets.aRecord, purpose: "routing" };

  const verification = challenges
    .filter((c) => c.type.toUpperCase() === "TXT")
    .map<DnsRecord>((c) => ({
      type: "TXT",
      name: relativeName(c.domain, domain.apex),
      value: c.value,
      purpose: "verification",
    }));

  return [routing, ...verification];
}

/** "_vercel.rahimfashion.com" relative to "rahimfashion.com" → "_vercel". */
function relativeName(fqdn: string, apex: string) {
  const name = fqdn.toLowerCase().replace(/\.$/, "");
  if (name === apex) return "@";
  return name.endsWith(`.${apex}`) ? name.slice(0, -(apex.length + 1)) : name;
}
