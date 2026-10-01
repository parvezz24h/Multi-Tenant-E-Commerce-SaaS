import {
  ArrowRight,
  Banknote,
  Boxes,
  ExternalLink,
  Globe,
  MapPin,
  Palette,
  ShoppingCart,
  Smartphone,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Faq } from "@/components/marketing/faq";
import { Pricing } from "@/components/marketing/pricing";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { StorePreview } from "@/components/marketing/store-preview";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";
import { TRIAL_DAYS } from "@/lib/subscription";
import { getSession } from "@/server/auth/session";
import { listPlans } from "@/server/billing/service";

export const metadata: Metadata = {
  title: { absolute: `${siteConfig.name} — Your own online store, built for Bangladesh` },
  description:
    "Create an online store in minutes. Take Cash on Delivery orders, manage stock and customers, and use your own domain. Free 14-day trial.",
};

const FEATURES = [
  {
    icon: Smartphone,
    title: "A store that looks great on phones",
    body: "Most of your customers shop on mobile. Your storefront is fast and easy to use on any phone.",
  },
  {
    icon: Banknote,
    title: "Cash on Delivery checkout",
    body: "Customers order without paying online. Delivery charges are added automatically for inside or outside Dhaka.",
  },
  {
    icon: MapPin,
    title: "Bangladeshi addresses",
    body: "All 64 districts, upazila and area — the details your courier needs, collected at checkout.",
  },
  {
    icon: ShoppingCart,
    title: "Orders in one place",
    body: "See new orders instantly, confirm, ship and mark delivered. Customers can track their order online.",
  },
  {
    icon: Boxes,
    title: "Stock that keeps itself right",
    body: "Stock goes down with every order and back up on cancellations, so you never sell what you don't have.",
  },
  {
    icon: Globe,
    title: "Your own domain",
    body: "Start with a free store address, then connect yourshop.com or .com.bd whenever you're ready.",
  },
];

const STEPS = [
  {
    title: "Create your store",
    body: "Sign up, choose your store name and web address. It takes about a minute.",
  },
  {
    title: "Add your products",
    body: "Upload photos, set prices and stock, and pick your brand color.",
  },
  {
    title: "Share and start selling",
    body: "Publish your store and share the link on Facebook, Instagram and WhatsApp.",
  },
];

function SectionHeading({
  eyebrow,
  title,
  body,
  id,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  id: string;
}) {
  return (
    <div className="mx-auto grid max-w-2xl gap-3 text-center">
      <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p>
      <h2 id={id} className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      {body && <p className="text-muted-foreground text-pretty">{body}</p>}
    </div>
  );
}

export default async function Home() {
  const [session, plans] = await Promise.all([getSession(), listPlans()]);
  const signedIn = Boolean(session);
  const domainPlanNames = plans.filter((p) => p.customDomain).map((p) => p.name);
  const features = FEATURES.filter((f) => f.title !== "Your own domain" || domainPlanNames.length > 0);
  const primaryHref = signedIn ? "/dashboard" : "/sign-up";

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader signedIn={signedIn} />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,var(--color-muted),transparent_60%)]"
          />
          {/* At least one screen tall (minus the 4rem header); svh avoids jumps when mobile browser bars move. */}
          <div className="mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-7xl items-center gap-14 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:px-8 lg:py-20">
            <div className="grid justify-items-start gap-6">
              <span className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
                <span className="size-1.5 rounded-full bg-primary" />
                Built for Bangladeshi sellers
              </span>
              <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                Move your business from Facebook to your own online store.
              </h1>
              <p className="max-w-xl text-lg text-muted-foreground text-pretty">
                {siteConfig.name} gives you a ready-made store with Cash on Delivery checkout, order
                management and stock tracking — no coding, no developer.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="lg" asChild>
                  <Link href={primaryHref}>
                    {signedIn ? "Go to your dashboard" : "Start your free trial"} <ArrowRight />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href={siteConfig.demoStore.url} target="_blank" rel="noopener noreferrer">
                    View live demo <ExternalLink />
                  </a>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {TRIAL_DAYS} days free · No card needed · Pay later with bKash or Nagad
              </p>
            </div>
            <div className="lg:pl-6">
              <StorePreview />
            </div>
          </div>
        </section>

        {/* Features */}
        <section aria-labelledby="features-heading" className="scroll-mt-20 border-t bg-muted/30 py-24" id="features">
          <div className="mx-auto grid w-full max-w-7xl gap-14 px-4 sm:px-6 lg:px-8">
            <SectionHeading
              id="features-heading"
              eyebrow="Features"
              title="Everything you need to sell online"
              body="Made for how people in Bangladesh actually buy: on their phones, paying cash at the door."
            />
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, body }) => (
                <li key={title} className="grid content-start gap-3 rounded-2xl border bg-background p-6">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Palette className="size-4" aria-hidden />
              Ready-made theme in your brand color — change it any time.
            </div>
          </div>
        </section>

        {/* How it works */}
        <section aria-labelledby="how-heading" className="scroll-mt-20 py-24" id="how-it-works">
          <div className="mx-auto grid w-full max-w-7xl gap-14 px-4 sm:px-6 lg:px-8">
            <SectionHeading id="how-heading" eyebrow="How it works" title="Your store is live in three steps" />
            <ol className="grid gap-6 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <li key={step.title} className="grid content-start gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {i + 1}
                  </span>
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </li>
              ))}
            </ol>
            <p className="text-center text-sm text-muted-foreground">
              Want to see one first?{" "}
              <a
                href={siteConfig.demoStore.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                Visit our demo store, {siteConfig.demoStore.name} →
              </a>
            </p>
          </div>
        </section>

        {/* Pricing */}
        {plans.length > 0 && (
          <section aria-labelledby="pricing-heading" className="scroll-mt-20 border-t bg-muted/30 py-24" id="pricing">
            <div className="mx-auto grid w-full max-w-7xl gap-14 px-4 sm:px-6 lg:px-8">
              <SectionHeading
                id="pricing-heading"
                eyebrow="Pricing"
                title={plans.length > 1 ? "Simple monthly plans" : "One simple plan"}
                body={`Try everything free for ${TRIAL_DAYS} days. Pay monthly with bKash, Nagad or bank transfer. Cancel any time.`}
              />
              <Pricing
                signedIn={signedIn}
                plans={plans.map(({ key, name, description, priceMonthly, maxProducts, maxStaff, customDomain }) => ({
                  key,
                  name,
                  description,
                  priceMonthly,
                  maxProducts,
                  maxStaff,
                  customDomain,
                }))}
              />
            </div>
          </section>
        )}

        {/* FAQ */}
        <section aria-labelledby="faq-heading" className="scroll-mt-20 py-24" id="faq">
          <div className="mx-auto grid w-full max-w-3xl gap-10 px-4">
            <SectionHeading id="faq-heading" eyebrow="FAQ" title="Questions sellers ask" />
            <Faq
              trialPlanName={plans[0]?.name ?? "free"}
              domainPlanNames={domainPlanNames}
              multiplePlans={plans.length > 1}
            />
          </div>
        </section>

        {/* Final call to action */}
        <section className="px-4 pb-24 sm:px-6 lg:px-8">
          <div className="mx-auto grid w-full max-w-7xl justify-items-center gap-6 rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground">
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Your customers are already online. Is your store?
            </h2>
            <p className="max-w-xl text-primary-foreground/80">
              Start free today. Set up your store in minutes and take your first Cash on Delivery order this week.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link href={primaryHref}>
                {signedIn ? "Go to your dashboard" : "Create your store"} <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
