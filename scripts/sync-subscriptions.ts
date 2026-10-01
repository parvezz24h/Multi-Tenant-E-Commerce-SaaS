/**
 * Bring stored subscription statuses up to date with their dates (trial
 * ended → past due → suspended, cancellations taking effect). The app also
 * does this lazily on read; run this on a schedule (e.g. hourly) so reports
 * and the admin list are always current.
 *
 *   pnpm billing:sync
 */
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { effectiveStatus } from "../src/lib/subscription";

async function main() {
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  try {
    const subs = await db.subscription.findMany({
      where: { status: { in: ["TRIAL", "ACTIVE", "PAST_DUE"] } },
    });
    let changed = 0;
    for (const sub of subs) {
      const status = effectiveStatus(sub);
      if (status === sub.status) continue;
      const { count } = await db.subscription.updateMany({
        where: { id: sub.id, status: sub.status, updatedAt: sub.updatedAt },
        data: { status },
      });
      if (count) {
        changed++;
        await db.auditLog.create({
          data: {
            storeId: sub.storeId,
            action: "subscription.status_changed",
            entityType: "Subscription",
            entityId: sub.id,
            metadata: { from: sub.status, to: status, via: "sync" },
          },
        });
      }
    }
    console.log(`Checked ${subs.length} subscriptions, updated ${changed}.`);
  } finally {
    await db.$disconnect();
  }
}

main();
