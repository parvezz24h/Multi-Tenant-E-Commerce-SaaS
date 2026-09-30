import { Banknote, MapPin, Smartphone, Store } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";
import { getSession } from "@/server/auth/session";

const FEATURES = [
  {
    icon: Store,
    title: "Your own store",
    body: `A ready-made storefront at your-name.${siteConfig.rootDomain}, with your own domain later.`,
  },
  {
    icon: Banknote,
    title: "Cash on Delivery first",
    body: "Take COD orders from day one. bKash, Nagad and SSLCommerz are on the way.",
  },
  {
    icon: MapPin,
    title: "Local addresses",
    body: "District, upazila and area built in, ready for courier integrations.",
  },
  {
    icon: Smartphone,
    title: "Mobile-first",
    body: "Storefronts and the merchant dashboard work great on any phone.",
  },
];

export default async function Home() {
  const session = await getSession();

  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          {siteConfig.name}
        </Link>
        <nav className="flex items-center gap-2">
          {session ? (
            <Button asChild>
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/sign-up">Start free</Link>
              </Button>
            </>
          )}
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4">
        <section className="flex flex-col items-start gap-6 py-16 sm:py-24">
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Move your business from Facebook to your own online store.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground text-pretty">
            {siteConfig.description} Add products, take orders and manage everything from one
            dashboard.
          </p>
          <Button size="lg" asChild>
            <Link href={session ? "/dashboard" : "/sign-up"}>Create your store</Link>
          </Button>
        </section>

        <section className="grid gap-6 pb-20 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border p-5">
              <Icon className="mb-3 size-5 text-muted-foreground" aria-hidden />
              <h2 className="font-medium">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
