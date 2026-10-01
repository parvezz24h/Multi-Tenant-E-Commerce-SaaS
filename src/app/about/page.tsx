import { ArrowRight, Banknote, HeartHandshake, MapPin, Smartphone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { MarketingPage } from "@/components/marketing/marketing-page";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";
import { TRIAL_DAYS } from "@/lib/subscription";

export const metadata: Metadata = {
  title: "About",
  description: `${siteConfig.name} helps Bangladeshi sellers move from Facebook pages to their own online store.`,
};

const PRINCIPLES = [
  {
    icon: MapPin,
    title: "Built for Bangladesh",
    body: "Taka prices, all 64 districts, inside/outside Dhaka delivery charges and Cash on Delivery are built in — not bolted on.",
  },
  {
    icon: Smartphone,
    title: "Phone first",
    body: "Most customers shop on their phones, and many sellers run their business from one too. Everything works on a small screen.",
  },
  {
    icon: Banknote,
    title: "Simple, honest pricing",
    body: `A ${TRIAL_DAYS}-day free trial, then simple monthly pricing paid by bKash, Nagad or bank. No hidden fees and no commission on your sales.`,
  },
  {
    icon: HeartHandshake,
    title: "Your store, your customers",
    body: "Your products, orders and customer list belong to you. Use your own domain and build a brand people remember.",
  },
];

export default function AboutPage() {
  return (
    <MarketingPage
      eyebrow="About us"
      title="Helping Bangladeshi sellers own their online business"
      intro={`Many businesses in Bangladesh sell through Facebook pages and inbox messages. ${siteConfig.name} gives them a proper online store of their own — without coding, developers or big setup costs.`}
    >
      <section className="py-20">
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="grid content-start gap-4">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Why we built it</h2>
            <div className="grid gap-4 leading-relaxed text-muted-foreground">
              <p>
                Selling through social media works — until it doesn&apos;t. Orders get lost in message threads,
                prices are repeated a hundred times a day, stock is tracked on paper, and customers can&apos;t browse
                everything you sell.
              </p>
              <p>
                {siteConfig.name} turns that into a real store: a catalog customers can browse, a checkout that
                collects the address your courier needs, and one dashboard to confirm, ship and track every order.
              </p>
            </div>
          </div>
          <div className="grid content-start gap-4">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Who it&apos;s for</h2>
            <ul className="grid gap-3 text-muted-foreground">
              {[
                "Facebook and Instagram sellers ready for their own website",
                "Fashion, cosmetics, grocery and electronics shops",
                "Local brands and small retailers",
                "Wholesalers starting to sell online",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section aria-labelledby="principles-heading" className="border-t bg-muted/30 py-20">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 sm:px-6 lg:px-8">
          <h2 id="principles-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
            What we believe
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {PRINCIPLES.map(({ icon: Icon, title, body }) => (
              <li key={title} className="grid content-start gap-3 rounded-2xl border bg-background p-6">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl justify-items-center gap-5 rounded-3xl bg-primary px-6 py-14 text-center text-primary-foreground">
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance">Ready to open your store?</h2>
          <p className="max-w-xl text-primary-foreground/80">
            Start your {TRIAL_DAYS}-day free trial — no card needed.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="xl" asChild className="bg-white text-primary shadow-lg shadow-black/10 hover:-translate-y-0.5 hover:bg-white/90 hover:text-primary motion-reduce:hover:translate-y-0">
              <Link href="/sign-up">
                Create your store <ArrowRight className="transition-transform group-hover/button:translate-x-0.5 motion-reduce:transition-none" />
              </Link>
            </Button>
            <Button
              size="xl"
              variant="ghost"
              asChild
              className="border border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link href="/contact">Talk to us</Link>
            </Button>
          </div>
        </div>
      </section>
    </MarketingPage>
  );
}
