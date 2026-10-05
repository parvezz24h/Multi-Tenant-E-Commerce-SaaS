import "server-only";

import { Prisma, type StoreDomain } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { recordAudit } from "@/server/audit/log";
import { assertPlanAllowsCustomDomain } from "@/server/billing/service";
import { AppError } from "@/server/errors";
import type { StoreContext } from "@/server/tenant/context";

import {
  defaultDnsTargets,
  dnsRecordsFor,
  parseCustomDomain,
  redirectDomainFor,
  type DnsRecord,
  type ParsedDomain,
} from "./hostname";
import { domainProvider, type Challenge, type DomainCheck } from "./providers";

/** Don't hit DNS / the hosting API more often than this per domain. */
const CHECK_COOLDOWN_MS = 10_000;

export type StoreDomainView = Omit<StoreDomain, "records"> & {
  records: DnsRecord[];
  /** The paired www/apex host that forwards to `hostname`, if any. */
  redirectHostname: string | null;
};

function toView(row: StoreDomain): StoreDomainView {
  return {
    ...row,
    records: (row.records as DnsRecord[] | null) ?? [],
    redirectHostname: redirectDomainFor(parsedFor(row.hostname))?.hostname ?? null,
  };
}

function parsedFor(hostname: string): ParsedDomain {
  const result = parseCustomDomain(hostname);
  if (!result.ok) throw new AppError("INVALID", result.error);
  return result.domain;
}

export async function getStoreDomain(storeId: string) {
  const row = await db.storeDomain.findUnique({ where: { storeId } });
  return row ? toView(row) : null;
}

/** Active custom domain hostname for a store (for "View store" links). */
export async function getActiveDomain(storeId: string) {
  const row = await db.storeDomain.findFirst({
    where: { storeId, status: "ACTIVE" },
    select: { hostname: true },
  });
  return row?.hostname ?? null;
}

export function domainProviderName() {
  return domainProvider().name;
}

export async function addDomain(ctx: StoreContext, input: string) {
  const parsed = parseCustomDomain(input);
  if (!parsed.ok) throw new AppError("INVALID", parsed.error, "hostname");
  const domain = parsed.domain;
  await assertPlanAllowsCustomDomain(ctx.store.id);

  if (await db.storeDomain.count({ where: { storeId: ctx.store.id } })) {
    throw new AppError("CONFLICT", "Remove your current domain before adding another.", "hostname");
  }
  // www.shop.com and shop.com belong together, so neither may go to another store.
  const redirect = redirectDomainFor(domain);
  const taken = [domain.hostname, ...(redirect ? [redirect.hostname] : [])];
  if (await db.storeDomain.count({ where: { hostname: { in: taken } } })) {
    throw new AppError("CONFLICT", "This domain is already connected to another store.", "hostname");
  }

  const { challenges } = await domainProvider().add(domain);
  const redirectSetup = redirect ? await attachRedirect(redirect, domain) : null;

  try {
    await db.$transaction(async (tx) => {
      const row = await tx.storeDomain.create({
        data: {
          storeId: ctx.store.id,
          hostname: domain.hostname,
          records: dnsRecordsFor(
            domain,
            defaultDnsTargets(),
            [...challenges, ...(redirectSetup?.challenges ?? [])],
            redirect,
          ) as Prisma.InputJsonValue,
          redirectError: redirectSetup?.error ?? null,
        },
      });
      await recordAudit(
        {
          storeId: ctx.store.id,
          actorId: ctx.user.id,
          action: "domain.added",
          entityType: "StoreDomain",
          entityId: row.id,
          metadata: { hostname: domain.hostname },
        },
        tx,
      );
    });
  } catch (error) {
    // Lost a race for the same hostname: undo the provider side.
    await domainProvider().remove(domain).catch(() => {});
    if (redirect && !redirectSetup?.error) await domainProvider().remove(redirect).catch(() => {});
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError("CONFLICT", "This domain is already connected to another store.", "hostname");
    }
    throw error;
  }

  // DNS may already be in place (e.g. re-adding a domain); check right away.
  return checkDomain(ctx, { force: true });
}

export async function checkDomain(ctx: StoreContext, { force = false } = {}) {
  const row = await db.storeDomain.findUnique({ where: { storeId: ctx.store.id } });
  if (!row) throw new AppError("NOT_FOUND", "No domain is connected.");
  if (!force && row.lastCheckedAt && Date.now() - row.lastCheckedAt.getTime() < CHECK_COOLDOWN_MS) {
    return toView(row);
  }

  const domain = parsedFor(row.hostname);
  const redirect = redirectDomainFor(domain);
  const [result, redirectResult] = await Promise.all([
    domainProvider().check(domain),
    redirect ? checkRedirect(redirect, domain) : null,
  ]);
  const becameActive = result.active && row.status !== "ACTIVE";

  // Vercel recommends the CNAME on the subdomain's config and the IP on the apex's.
  const targets = { ...result.targets };
  if (redirectResult?.check) {
    if (redirect!.subdomain) targets.cname = redirectResult.check.targets.cname;
    else targets.aRecord = redirectResult.check.targets.aRecord;
  }

  const updated = await db.storeDomain.update({
    where: { id: row.id },
    data: {
      status: result.active ? "ACTIVE" : "PENDING",
      records: dnsRecordsFor(
        domain,
        targets,
        [...result.challenges, ...(redirectResult?.check?.challenges ?? [])],
        redirect,
      ) as Prisma.InputJsonValue,
      lastCheckedAt: new Date(),
      lastError: result.active ? null : (result.problem ?? null),
      redirectActive: redirectResult?.check?.active ?? false,
      redirectError: redirectResult
        ? (redirectResult.error ?? (redirectResult.check?.active ? null : (redirectResult.check?.problem ?? null)))
        : null,
      ...(becameActive && { verifiedAt: new Date() }),
    },
  });

  if (becameActive || (row.status === "ACTIVE" && !result.active)) {
    await recordAudit({
      storeId: ctx.store.id,
      actorId: ctx.user.id,
      action: becameActive ? "domain.activated" : "domain.deactivated",
      entityType: "StoreDomain",
      entityId: row.id,
      metadata: { hostname: row.hostname },
    });
  }
  return toView(updated);
}

export async function removeDomain(ctx: StoreContext) {
  const row = await db.storeDomain.findUnique({ where: { storeId: ctx.store.id } });
  if (!row) return;

  const domain = parsedFor(row.hostname);
  const redirect = redirectDomainFor(domain);
  await domainProvider().remove(domain);
  if (redirect) await domainProvider().remove(redirect);
  await db.$transaction(async (tx) => {
    await tx.storeDomain.delete({ where: { id: row.id } });
    await recordAudit(
      {
        storeId: ctx.store.id,
        actorId: ctx.user.id,
        action: "domain.removed",
        entityType: "StoreDomain",
        entityId: row.id,
        metadata: { hostname: row.hostname },
      },
      tx,
    );
  });
}

/**
 * Attach the paired www/apex host as a redirect. A failure here (say the
 * apex is used by another website) mustn't block the main domain, so it's
 * returned as a message to show instead of thrown.
 */
async function attachRedirect(
  redirect: ParsedDomain,
  target: ParsedDomain,
): Promise<{ challenges: Challenge[]; error?: string }> {
  try {
    return await domainProvider().addRedirect(redirect, target);
  } catch (error) {
    if (!(error instanceof AppError)) throw error;
    return { challenges: [], error: error.message };
  }
}

/** Re-attach (idempotent, so older domains pick it up) and check the redirect host. */
async function checkRedirect(
  redirect: ParsedDomain,
  target: ParsedDomain,
): Promise<{ check?: DomainCheck; error?: string }> {
  const attached = await attachRedirect(redirect, target);
  if (attached.error) return { error: attached.error };
  return { check: await domainProvider().check(redirect) };
}
