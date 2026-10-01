import { Pool } from "pg";

/**
 * Custom domain → store slug, for the proxy. Uses its own tiny `pg` pool
 * (the Prisma client in lib/db is server-only and too heavy for every
 * request) and caches answers briefly so most requests skip the database.
 */

const HIT_TTL_MS = 60_000;
const MISS_TTL_MS = 30_000;
const MAX_ENTRIES = 5_000;

type Entry = { slug: string | null; expires: number };

const globalForLookup = globalThis as unknown as {
  customDomainPool?: Pool;
  customDomainCache?: Map<string, Entry>;
};

const cache = (globalForLookup.customDomainCache ??= new Map());

function pool() {
  globalForLookup.customDomainPool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
    idleTimeoutMillis: 10_000,
  });
  return globalForLookup.customDomainPool;
}

export async function storeSlugForCustomDomain(hostname: string): Promise<string | null> {
  const cached = cache.get(hostname);
  if (cached && cached.expires > Date.now()) return cached.slug;

  try {
    const { rows } = await pool().query<{ slug: string }>(
      `select s.slug
         from store_domains d
         join stores s on s.id = d."storeId"
        where d.hostname = $1 and d.status = 'ACTIVE'
        limit 1`,
      [hostname],
    );
    const slug = rows[0]?.slug ?? null;
    if (cache.size >= MAX_ENTRIES) cache.clear();
    cache.set(hostname, { slug, expires: Date.now() + (slug ? HIT_TTL_MS : MISS_TTL_MS) });
    return slug;
  } catch (error) {
    // Don't cache failures; a blip shouldn't take a store offline for a minute.
    console.error("Custom domain lookup failed", error);
    return null;
  }
}
