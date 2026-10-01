import "server-only";

import { Resolver } from "node:dns/promises";

import { AppError } from "@/server/errors";

import { defaultDnsTargets, type DnsTargets, type ParsedDomain } from "./hostname";

export type Challenge = { type: string; domain: string; value: string };

export type DomainCheck = {
  /** DNS points at us and (with Vercel) the certificate can be issued. */
  active: boolean;
  targets: DnsTargets;
  challenges: Challenge[];
  /** Plain-language reason when not active. */
  problem?: string;
};

/**
 * Where custom domains are attached. With Vercel, domains are added to the
 * project so Vercel routes them and issues SSL. Without it, we can only
 * check DNS ourselves (fine for development or a self-managed proxy).
 */
export interface DomainProvider {
  readonly name: "vercel" | "dns";
  add(domain: ParsedDomain): Promise<{ challenges: Challenge[] }>;
  check(domain: ParsedDomain): Promise<DomainCheck>;
  remove(domain: ParsedDomain): Promise<void>;
}

// ── Vercel ──────────────────────────────────────────────────

type VercelProjectDomain = { name: string; verified: boolean; verification?: Challenge[] };
type VercelConfig = {
  misconfigured: boolean;
  recommendedCNAME?: { rank: number; value: string }[];
  recommendedIPv4?: { rank: number; value: string[] }[];
};

class VercelProvider implements DomainProvider {
  readonly name = "vercel" as const;

  constructor(
    private token: string,
    private projectId: string,
    private teamId: string | undefined,
  ) {}

  private async call<T>(method: string, path: string, body?: unknown) {
    const url = new URL(`https://api.vercel.com${path}`);
    if (this.teamId) url.searchParams.set("teamId", this.teamId);
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    const json = (await res.json().catch(() => ({}))) as T & { error?: { code?: string; message?: string } };
    return { status: res.status, json };
  }

  private project(path = "") {
    return `/projects/${encodeURIComponent(this.projectId)}/domains${path}`;
  }

  async add(domain: ParsedDomain) {
    const { status, json } = await this.call<VercelProjectDomain>("POST", `/v10${this.project()}`, {
      name: domain.hostname,
    });
    if (status === 200) return { challenges: json.verification ?? [] };
    if (status === 409) {
      throw new AppError(
        "CONFLICT",
        "This domain is already connected to another website. Remove it there first.",
        "hostname",
      );
    }
    // Already on the project (e.g. a previous attempt): just read its state.
    if (status === 400 && /already/i.test(json.error?.message ?? "")) {
      const existing = await this.call<VercelProjectDomain>("GET", `/v9${this.project(`/${domain.hostname}`)}`);
      return { challenges: existing.json.verification ?? [] };
    }
    console.error("Vercel add domain failed", status, json.error);
    throw new AppError("INVALID", json.error?.message ?? "Couldn't add the domain. Please try again.");
  }

  async check(domain: ParsedDomain): Promise<DomainCheck> {
    const path = this.project(`/${domain.hostname}`);
    let { json: info } = await this.call<VercelProjectDomain>("GET", `/v9${path}`);
    if (info.verified === false) {
      const verify = await this.call<VercelProjectDomain>("POST", `/v9${path}/verify`);
      if (verify.status === 200) info = { ...info, ...verify.json };
    }

    const { json: config } = await this.call<VercelConfig>(
      "GET",
      `/v6/domains/${encodeURIComponent(domain.hostname)}/config?projectIdOrName=${encodeURIComponent(this.projectId)}`,
    );
    const defaults = defaultDnsTargets();
    const best = <T extends { rank: number }>(list?: T[]) => list?.slice().sort((a, b) => a.rank - b.rank)[0];
    const targets = {
      cname: best(config.recommendedCNAME)?.value?.replace(/\.$/, "") || defaults.cname,
      aRecord: best(config.recommendedIPv4)?.value?.[0] || defaults.aRecord,
    };

    const verified = info.verified !== false;
    const configured = config.misconfigured === false;
    return {
      active: verified && configured,
      targets,
      challenges: info.verification ?? [],
      problem: !verified
        ? "Add the TXT record below so we can confirm you own this domain."
        : !configured
          ? "DNS isn't pointing to us yet. Changes can take a few minutes, sometimes up to 48 hours."
          : undefined,
    };
  }

  async remove(domain: ParsedDomain) {
    const { status, json } = await this.call("DELETE", `/v9${this.project(`/${domain.hostname}`)}`);
    if (status !== 200 && status !== 404) {
      console.error("Vercel remove domain failed", status, json.error);
      throw new AppError("INVALID", "Couldn't remove the domain. Please try again.");
    }
  }
}

// ── Plain DNS check (no hosting API) ────────────────────────

const clean = (v: string) => v.toLowerCase().replace(/\.$/, "");

class DnsProvider implements DomainProvider {
  readonly name = "dns" as const;
  private resolver = new Resolver({ timeout: 5_000, tries: 2 });

  async add() {
    return { challenges: [] };
  }

  async check(domain: ParsedDomain): Promise<DomainCheck> {
    const targets = defaultDnsTargets();
    try {
      if (domain.subdomain) {
        const cnames = (await this.resolver.resolveCname(domain.hostname)).map(clean);
        const ok = cnames.includes(clean(targets.cname));
        return {
          active: ok,
          targets,
          challenges: [],
          problem: ok ? undefined : `The CNAME record points to ${cnames.join(", ")}, not ${targets.cname}.`,
        };
      }
      const ips = await this.resolver.resolve4(domain.hostname);
      const ok = ips.includes(targets.aRecord);
      return {
        active: ok,
        targets,
        challenges: [],
        problem: ok ? undefined : `The A record points to ${ips.join(", ")}, not ${targets.aRecord}.`,
      };
    } catch (error) {
      const code = (error as { code?: string }).code;
      return {
        active: false,
        targets,
        challenges: [],
        problem:
          code === "ENOTFOUND" || code === "ENODATA"
            ? "We can't find the DNS record yet. Changes can take a few minutes, sometimes up to 48 hours."
            : "We couldn't check DNS right now. Please try again in a minute.",
      };
    }
  }

  async remove() {}
}

let provider: DomainProvider | undefined;

export function domainProvider(): DomainProvider {
  if (!provider) {
    const token = process.env.VERCEL_API_TOKEN;
    const projectId = process.env.VERCEL_PROJECT_ID;
    provider =
      token && projectId
        ? new VercelProvider(token, projectId, process.env.VERCEL_TEAM_ID || undefined)
        : new DnsProvider();
  }
  return provider;
}
