import { getSession } from "@/server/auth/session";

import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

/** Shared frame for marketing pages (About, Contact): header, intro, footer. */
export async function MarketingPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  const signedIn = Boolean(await getSession());

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader signedIn={signedIn} />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,var(--color-muted),transparent_60%)]"
          />
          <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <p className="text-sm font-medium text-primary">{eyebrow}</p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">{title}</h1>
            <p className="max-w-2xl text-lg text-muted-foreground text-pretty">{intro}</p>
          </div>
        </section>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
