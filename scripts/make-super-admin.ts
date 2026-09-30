/**
 * Promote an existing user to platform SUPER_ADMIN.
 *
 *   pnpm make-admin you@example.com
 */
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error("Usage: pnpm make-admin <email>");
    process.exit(1);
  }

  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  try {
    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      console.error(`No user with email ${email}. Sign up first.`);
      process.exit(1);
    }
    await db.$transaction([
      db.user.update({ where: { id: user.id }, data: { platformRole: "SUPER_ADMIN" } }),
      db.auditLog.create({
        data: {
          action: "user.promoted_super_admin",
          entityType: "User",
          entityId: user.id,
          metadata: { via: "cli" },
        },
      }),
    ]);
    console.log(`${email} is now a SUPER_ADMIN.`);
  } finally {
    await db.$disconnect();
  }
}

main();
