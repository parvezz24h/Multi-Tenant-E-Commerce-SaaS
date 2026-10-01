/**
 * Hostname → tenant resolution. Pure and runtime-agnostic so it can run in
 * the proxy and in tests.
 *
 *   rahim-fashion.shopcreatorbd.vercel.app → "rahim-fashion"
 *   rahim-fashion.localhost:3000           → "rahim-fashion"   (development)
 *   shopcreatorbd.vercel.app, www.…        → null (platform)
 *
 * Any other hostname that isn't a platform host is treated as a merchant's
 * custom domain and resolved with a database lookup (custom-domain-lookup.ts).
 */

const PLATFORM_SUBDOMAINS = new Set(["www", "app"]);

export function rootDomain() {
  return (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "shopcreatorbd.vercel.app").toLowerCase();
}

/** `Host` header → bare lowercase hostname (no port, no trailing dot). */
export function normalizeHost(host: string | null | undefined) {
  if (!host) return "";
  const withoutPort = host.startsWith("[") ? host.slice(0, host.indexOf("]") + 1) : host.split(":")[0]!;
  return withoutPort.toLowerCase().replace(/\.$/, "");
}

export function storeSlugFromHost(host: string | null | undefined, root = rootDomain()) {
  const hostname = normalizeHost(host);
  if (!hostname) return null;

  for (const base of [root, "localhost"]) {
    if (!hostname.endsWith(`.${base}`)) continue;
    const sub = hostname.slice(0, -(base.length + 1));
    // Only single-label subdomains are stores; `a.b.shopcreatorbd.vercel.app` is not.
    if (!sub || sub.includes(".") || PLATFORM_SUBDOMAINS.has(sub)) return null;
    return sub;
  }
  return null;
}

/**
 * Hosts that serve the platform itself (landing, dashboard, admin), never a
 * custom domain: the root domain and its `www`/`app`, the app URL's host,
 * localhost, and Vercel deployment URLs (`*.vercel.app`, incl. previews).
 */
export function isPlatformHost(
  host: string | null | undefined,
  root = rootDomain(),
  appUrl = process.env.NEXT_PUBLIC_APP_URL,
) {
  const hostname = normalizeHost(host);
  if (!hostname) return true;
  const appHost = appUrl ? normalizeHost(new URL(appUrl).host) : null;
  return (
    hostname === root ||
    hostname === `www.${root}` ||
    hostname === `app.${root}` ||
    hostname === appHost ||
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname.endsWith(".vercel.app")
  );
}

/**
 * Public URL of a store's storefront: its active custom domain if it has
 * one, otherwise `<slug>.<root domain>` (`<slug>.localhost` in development).
 */
export function storeUrl(
  slug: string,
  { customDomain, appUrl = process.env.NEXT_PUBLIC_APP_URL }: { customDomain?: string | null; appUrl?: string } = {},
) {
  if (customDomain) return `https://${customDomain}`;
  if (appUrl) {
    const url = new URL(appUrl);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      return `${url.protocol}//${slug}.localhost${url.port ? `:${url.port}` : ""}`;
    }
  }
  return `https://${slug}.${rootDomain()}`;
}
