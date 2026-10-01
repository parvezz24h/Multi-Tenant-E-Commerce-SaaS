import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

import { storeSlugForCustomDomain } from "@/lib/custom-domain-lookup";
import { isPlatformHost, normalizeHost, storeSlugFromHost } from "@/lib/hosts";

/** Internal prefix storefront routes live under (src/app/s/[storeSlug]). */
const STOREFRONT_PREFIX = "/s";

const PROTECTED_PREFIXES = ["/dashboard", "/onboarding", "/admin"];

function rewriteToStore(request: NextRequest, storeSlug: string) {
  const { pathname, search } = request.nextUrl;
  const url = request.nextUrl.clone();
  url.pathname = `${STOREFRONT_PREFIX}/${storeSlug}${pathname === "/" ? "" : pathname}`;
  url.search = search;
  return NextResponse.rewrite(url);
}

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host");
  const { pathname } = request.nextUrl;

  // 1. Platform subdomains: <slug>.<root domain> (or <slug>.localhost in dev).
  // Every path is rewritten under the store, so platform pages
  // (/dashboard, /admin…) are unreachable on store hosts.
  const subdomainSlug = storeSlugFromHost(host);
  if (subdomainSlug) return rewriteToStore(request, subdomainSlug);

  // 2. Merchant custom domains: anything that isn't a platform host.
  if (!isPlatformHost(host)) {
    const slug = await storeSlugForCustomDomain(normalizeHost(host));
    if (slug) return rewriteToStore(request, slug);
    return new NextResponse("This domain isn't connected to a store.", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  // 3. Platform host. Storefront routes are only reachable via their host,
  // so relative links and per-store cookies always work.
  if (pathname === STOREFRONT_PREFIX || pathname.startsWith(`${STOREFRONT_PREFIX}/`)) {
    return new NextResponse(null, { status: 404 });
  }

  // Optimistic redirect for signed-out visitors. Real authorization happens
  // on the server in every page and action (src/server/tenant/context.ts).
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (isProtected && !getSessionCookie(request)) {
    const signIn = new URL("/sign-in", request.url);
    signIn.searchParams.set("next", pathname);
    return NextResponse.redirect(signIn);
  }

  return NextResponse.next();
}

export const config = {
  // Everything except Next internals, the auth API and files with extensions.
  matcher: ["/((?!_next/|api/|favicon.ico|.*\\.[\\w]+$).*)"],
};
