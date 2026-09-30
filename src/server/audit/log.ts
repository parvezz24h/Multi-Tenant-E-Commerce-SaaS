import "server-only";

import { headers } from "next/headers";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

type AuditEntry = {
  action: string;
  entityType: string;
  entityId?: string;
  storeId?: string | null;
  actorId?: string | null;
  metadata?: Prisma.InputJsonValue;
};

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
}

/**
 * Record an audit event. Pass a transaction client to write the entry
 * atomically with the change it describes.
 */
export async function recordAudit(
  entry: AuditEntry,
  tx: Prisma.TransactionClient = db,
) {
  await tx.auditLog.create({
    data: { ...entry, ipAddress: await clientIp() },
  });
}
