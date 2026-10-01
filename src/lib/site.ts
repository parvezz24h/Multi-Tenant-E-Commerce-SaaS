export const siteConfig = {
  name: "ShopCreatorBD",
  description: "Launch your own online store in minutes — built for Bangladeshi businesses.",
  rootDomain: process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "shopcreatorbd.vercel.app",
};

/** Public platform hostname for a store, e.g. `rahim-fashion.shopcreatorbd.vercel.app`. */
export function storeHostname(slug: string) {
  return `${slug}.${siteConfig.rootDomain}`;
}

/**
 * Only allow same-origin relative paths as post-login redirects, so
 * `?next=` can't be used as an open redirect.
 */
export function safeRedirectPath(next: string | null | undefined, fallback = "/dashboard") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}
