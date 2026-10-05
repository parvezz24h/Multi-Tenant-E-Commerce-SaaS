import { Pool } from "pg";

/**
 * Custom domain → store slug, for the proxy. Uses its own tiny `pg` pool
 * (the Prisma client in lib/db is server-only and too heavy for every
 * request) and caches answers briefly so most requests skip the database.
 */

const HIT_TTL_MS = 60_000;
const MISS_TTL_MS = 30_000;
const MAX_ENTRIES = 5_000;

/** The store a custom domain serves, and the domain it is connected as. */
export type CustomDomainMatch = { slug: string; hostname: string };

type Entry = { match: CustomDomainMatch | null; expires: number };

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

/** `www.shop.com` ↔ `shop.com`: the host that forwards to a connected domain. */
export function pairedHost(hostname: string) {
  return hostname.startsWith("www.") ? hostname.slice(4) : `www.${hostname}`;
}

/**
 * The store for a custom domain. A host that isn't connected itself but whose
 * www/apex pair is (`motkhola.com` for `www.motkhola.com`) matches that
 * domain, so the proxy can redirect to it.
 */
export async function lookupCustomDomain(hostname: string): Promise<CustomDomainMatch | null> {
  const cached = cache.get(hostname);
  if (cached && cached.expires > Date.now()) return cached.match;

  try {
    const { rows } = await pool().query<CustomDomainMatch>(
      `select s.slug, d.hostname
         from store_domains d
         join stores s on s.id = d."storeId"
        where d.hostname = any($1) and d.status = 'ACTIVE'`,
      [[hostname, pairedHost(hostname)]],
    );
    const match = rows.find((r) => r.hostname === hostname) ?? rows[0] ?? null;
    if (cache.size >= MAX_ENTRIES) cache.clear();
    cache.set(hostname, { match, expires: Date.now() + (match ? HIT_TTL_MS : MISS_TTL_MS) });
    return match;
  } catch (error) {
    // Don't cache failures; a blip shouldn't take a store offline for a minute.
    console.error("Custom domain lookup failed", error);
    return null;
  }
}
