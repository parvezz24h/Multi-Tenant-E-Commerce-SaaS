/**
 * Hostname → tenant resolution. Pure and runtime-agnostic so it can run in
 * the proxy and in tests.
 *
 *   rahim-fashion.shopbd.com     → "rahim-fashion"
 *   rahim-fashion.localhost:3000 → "rahim-fashion"   (development)
 *   shopbd.com, www.shopbd.com   → null (platform)
 *
 * Custom domains (Phase 7) will be resolved by a database lookup instead.
 */

const PLATFORM_SUBDOMAINS = new Set(["www", "app"]);

export function rootDomain() {
  return (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "shopbd.com").toLowerCase();
}

export function storeSlugFromHost(host: string | null | undefined, root = rootDomain()) {
  if (!host) return null;
  const hostname = host.split(":")[0]!.toLowerCase().replace(/\.$/, "");

  for (const base of [root, "localhost"]) {
    if (!hostname.endsWith(`.${base}`)) continue;
    const sub = hostname.slice(0, -(base.length + 1));
    // Only single-label subdomains are stores; `a.b.shopbd.com` is not.
    if (!sub || sub.includes(".") || PLATFORM_SUBDOMAINS.has(sub)) return null;
    return sub;
  }
  return null;
}

/** Public URL of a store's storefront. Uses `<slug>.localhost` in development. */
export function storeUrl(slug: string, appUrl = process.env.NEXT_PUBLIC_APP_URL) {
  if (appUrl) {
    const url = new URL(appUrl);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      return `${url.protocol}//${slug}.localhost${url.port ? `:${url.port}` : ""}`;
    }
  }
  return `https://${slug}.${rootDomain()}`;
}
