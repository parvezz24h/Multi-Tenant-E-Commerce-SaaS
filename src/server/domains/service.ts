import "server-only";

import { Prisma, type StoreDomain } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { recordAudit } from "@/server/audit/log";
import { AppError } from "@/server/errors";
import type { StoreContext } from "@/server/tenant/context";

import { defaultDnsTargets, dnsRecordsFor, parseCustomDomain, type DnsRecord, type ParsedDomain } from "./hostname";
import { domainProvider } from "./providers";

/** Don't hit DNS / the hosting API more often than this per domain. */
const CHECK_COOLDOWN_MS = 10_000;

export type StoreDomainView = Omit<StoreDomain, "records"> & { records: DnsRecord[] };

function toView(row: StoreDomain): StoreDomainView {
  return { ...row, records: (row.records as DnsRecord[] | null) ?? [] };
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

  if (await db.storeDomain.count({ where: { storeId: ctx.store.id } })) {
    throw new AppError("CONFLICT", "Remove your current domain before adding another.", "hostname");
  }
  if (await db.storeDomain.count({ where: { hostname: domain.hostname } })) {
    throw new AppError("CONFLICT", "This domain is already connected to another store.", "hostname");
  }

  const { challenges } = await domainProvider().add(domain);

  try {
    await db.$transaction(async (tx) => {
      const row = await tx.storeDomain.create({
        data: {
          storeId: ctx.store.id,
          hostname: domain.hostname,
          records: dnsRecordsFor(domain, defaultDnsTargets(), challenges) as Prisma.InputJsonValue,
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
  const result = await domainProvider().check(domain);
  const becameActive = result.active && row.status !== "ACTIVE";

  const updated = await db.storeDomain.update({
    where: { id: row.id },
    data: {
      status: result.active ? "ACTIVE" : "PENDING",
      records: dnsRecordsFor(domain, result.targets, result.challenges) as Prisma.InputJsonValue,
      lastCheckedAt: new Date(),
      lastError: result.active ? null : (result.problem ?? null),
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

  await domainProvider().remove(parsedFor(row.hostname));
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
