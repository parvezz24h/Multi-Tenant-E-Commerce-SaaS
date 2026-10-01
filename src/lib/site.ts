export const siteConfig = {
  name: "ShopCreatorBD",
  description: "Launch your own online store in minutes — built for Bangladeshi businesses.",
  rootDomain: process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "shopcreatorbd.vercel.app",
  /** A real store on the platform, linked from the landing page as a live demo. */
  demoStore: { url: "https://www.motkhola.com", host: "www.motkhola.com", name: "Rahim Fashion" },
  /** Platform contact details shown on /contact. */
  contact: {
    email: "parvezz24h@gmail.com",
    phone: "+8801736194336",
    address: "House-2729, Road-22/1, Khilkhet, Dhaka-1229",
  },
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
