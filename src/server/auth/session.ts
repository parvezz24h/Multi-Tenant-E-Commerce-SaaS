import "server-only";

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { db } from "@/lib/db";
import { auth } from "@/server/auth/auth";

/** Current session, deduplicated per request. */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/** The signed-in user, or redirect to sign-in. */
export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session.user;
}

/**
 * The signed-in user if they are a platform SUPER_ADMIN, otherwise 404.
 * The role is re-read from the database so a demotion takes effect
 * immediately instead of waiting for the session to refresh.
 */
export const requireSuperAdmin = cache(async () => {
  const user = await requireUser();
  const row = await db.user.findUnique({
    where: { id: user.id },
    select: { platformRole: true },
  });
  if (row?.platformRole !== "SUPER_ADMIN") notFound();
  return user;
});
