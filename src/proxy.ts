import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

import { storeSlugFromHost } from "@/lib/hosts";

/** Internal prefix storefront routes live under (src/app/s/[storeSlug]). */
const STOREFRONT_PREFIX = "/s";

const PROTECTED_PREFIXES = ["/dashboard", "/onboarding", "/admin"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const storeSlug = storeSlugFromHost(request.headers.get("host"));

  // Store hostnames: serve the storefront. Every path is rewritten under the
  // store, so platform pages (/dashboard, /admin…) are unreachable here.
  if (storeSlug) {
    const url = request.nextUrl.clone();
    url.pathname = `${STOREFRONT_PREFIX}/${storeSlug}${pathname === "/" ? "" : pathname}`;
    url.search = search;
    return NextResponse.rewrite(url);
  }

  // Platform hostname: storefront routes are only reachable via their host,
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
