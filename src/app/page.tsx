import {
  ArrowRight,
  Banknote,
  Boxes,
  CheckCircle2,
  ExternalLink,
  Globe,
  MapPin,
  MessageCircleQuestion,
  Palette,
  ShoppingCart,
  Smartphone,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";

import { DashboardPreview } from "@/components/marketing/dashboard-preview";
import { Faq } from "@/components/marketing/faq";
import { Pricing } from "@/components/marketing/pricing";
import { SellerMarquee } from "@/components/marketing/seller-marquee";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { StorePreview } from "@/components/marketing/store-preview";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";
import { TRIAL_DAYS } from "@/lib/subscription";
import { cn } from "@/lib/utils";
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

const DASHBOARD_POINTS = [
  "See today's sales and the orders waiting for you at a glance",
  "Move each order from pending to delivered in one tap",
  "Get warned before products run out of stock",
  "Know your customers and what they bought before",
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

/** Stagger index for scroll reveals (see .reveal in globals.css). */
const revealAt = (i: number) => ({ "--reveal-index": i }) as CSSProperties;
/** Delay for page-load entrance animations. */
const enterAt = (ms: number) => ({ animationDelay: `${ms}ms` });

function SectionHeading({
  eyebrow,
  title,
  body,
  id,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  body?: string;
  id: string;
  align?: "center" | "left";
}) {
  return (
    <div className={cn("reveal grid gap-3", align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-xl")}>
      <p className="text-sm font-semibold tracking-wide text-primary uppercase">{eyebrow}</p>
      <h2 id={id} className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      {body && <p className="text-lg text-muted-foreground text-pretty">{body}</p>}
    </div>
  );
}

export default async function Home() {
  const [session, plans] = await Promise.all([getSession(), listPlans()]);
  const signedIn = Boolean(session);
  const domainPlanNames = plans.filter((p) => p.customDomain).map((p) => p.name);
  const features = FEATURES.filter((f) => f.title !== "Your own domain" || domainPlanNames.length > 0);
  const primaryHref = signedIn ? "/dashboard" : "/sign-up";
  const demo = siteConfig.demoStore;

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader signedIn={signedIn} />

      <main className="flex-1">
        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--color-muted),transparent_60%)]" />
            <div className="absolute -top-40 right-0 size-[36rem] rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -bottom-40 -left-20 size-[28rem] rounded-full bg-primary/5 blur-3xl" />
          </div>
          {/* At least one screen tall (minus the 4rem header); svh avoids jumps when mobile browser bars move. */}
          <div className="mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-7xl items-center gap-14 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:px-8 lg:py-20">
            <div className="grid justify-items-start gap-6">
              <span
                className="enter-up inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground"
                style={enterAt(0)}
              >
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60 motion-reduce:hidden" />
                  <span className="relative inline-flex size-2 rounded-full bg-primary" />
                </span>
                Built for Bangladeshi sellers
              </span>
              <h1
                className="enter-up text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl"
                style={enterAt(80)}
              >
                Move your business from Facebook to{" "}
                <span className="text-primary">your own online store.</span>
              </h1>
              <p className="enter-up max-w-xl text-lg text-muted-foreground text-pretty" style={enterAt(160)}>
                {siteConfig.name} gives you a ready-made store with Cash on Delivery checkout, order management and
                stock tracking — no coding, no developer.
              </p>
              <div className="enter-up flex flex-wrap items-center gap-3" style={enterAt(240)}>
                <Button size="xl" asChild className="shadow-lg shadow-primary/25 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 motion-reduce:hover:translate-y-0">
                  <Link href={primaryHref}>
                    {signedIn ? "Go to your dashboard" : "Start your free trial"} <ArrowRight className="transition-transform group-hover/button:translate-x-0.5 motion-reduce:transition-none" />
                  </Link>
                </Button>
                <Button size="xl" variant="outline" asChild className="hover:border-primary/40">
                  <a href={demo.url} target="_blank" rel="noopener noreferrer">
                    View live demo <ExternalLink />
                  </a>
                </Button>
              </div>
              <ul className="enter-up flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground" style={enterAt(320)}>
                {[`${TRIAL_DAYS} days free`, "No card needed", "Pay with bKash or Nagad"].map((t) => (
                  <li key={t} className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-primary" aria-hidden />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="enter-left lg:pl-6" style={enterAt(200)}>
              <StorePreview />
            </div>
          </div>
        </section>

        {/* ── Who it's for ─────────────────────────────────── */}
        <section aria-label="Who it's for" className="border-y bg-muted/30 py-8">
          <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-muted-foreground">Made for every kind of seller</p>
            <SellerMarquee />
          </div>
        </section>

        {/* ── Features ─────────────────────────────────────── */}
        <section aria-labelledby="features-heading" className="scroll-mt-20 py-24" id="features">
          <div className="mx-auto grid w-full max-w-7xl gap-14 px-4 sm:px-6 lg:px-8">
            <SectionHeading
              id="features-heading"
              eyebrow="Features"
              title="Everything you need to sell online"
              body="Made for how people in Bangladesh actually buy: on their phones, paying cash at the door."
            />
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, body }, i) => (
                <li
                  key={title}
                  style={revealAt(i % 3)}
                  className="reveal group grid content-start gap-4 rounded-2xl border bg-background p-7 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="leading-relaxed text-muted-foreground">{body}</p>
                </li>
              ))}
            </ul>
            <p className="reveal flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Palette className="size-4 text-primary" aria-hidden />
              Ready-made theme in your brand color — change it any time.
            </p>
          </div>
        </section>

        {/* ── Dashboard ────────────────────────────────────── */}
        <section aria-labelledby="dashboard-heading" className="border-t bg-muted/30 py-24">
          <div className="mx-auto grid w-full max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:px-8">
            <div className="grid content-start gap-8">
              <SectionHeading
                id="dashboard-heading"
                align="left"
                eyebrow="Your dashboard"
                title="Run your whole business from one place"
                body="Works just as well on your phone as on a laptop, so you can handle orders wherever you are."
              />
              <ul className="grid gap-4">
                {DASHBOARD_POINTS.map((point, i) => (
                  <li key={point} style={revealAt(i)} className="reveal flex items-start gap-3">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <CheckCircle2 className="size-4" aria-hidden />
                    </span>
                    <span className="text-pretty">{point}</span>
                  </li>
                ))}
              </ul>
              <Button size="xl" asChild className="reveal justify-self-start shadow-lg shadow-primary/25 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 motion-reduce:hover:translate-y-0">
                <Link href={primaryHref}>
                  {signedIn ? "Open your dashboard" : "Try it free"} <ArrowRight className="transition-transform group-hover/button:translate-x-0.5 motion-reduce:transition-none" />
                </Link>
              </Button>
            </div>
            <div className="reveal">
              <DashboardPreview />
            </div>
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────── */}
        <section aria-labelledby="how-heading" className="scroll-mt-20 py-24" id="how-it-works">
          <div className="mx-auto grid w-full max-w-7xl gap-14 px-4 sm:px-6 lg:px-8">
            <SectionHeading id="how-heading" eyebrow="How it works" title="Your store is live in three steps" />
            <ol className="relative grid gap-6 md:grid-cols-3">
              {/* Connector line between the step numbers on wide screens. */}
              <span
                aria-hidden
                className="absolute top-7 right-[16.66%] left-[16.66%] hidden h-px bg-gradient-to-r from-primary/40 via-primary to-primary/40 md:block"
              />
              {STEPS.map((step, i) => (
                <li
                  key={step.title}
                  style={revealAt(i)}
                  className="reveal relative grid justify-items-center gap-4 rounded-2xl border bg-background p-8 text-center"
                >
                  <span className="relative flex size-14 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground ring-8 ring-background">
                    {i + 1}
                  </span>
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <p className="leading-relaxed text-muted-foreground">{step.body}</p>
                </li>
              ))}
            </ol>
            <p className="reveal text-center text-muted-foreground">
              Want to see one first?{" "}
              <a href={demo.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                Visit our demo store, {demo.name} →
              </a>
            </p>
          </div>
        </section>

        {/* ── Pricing ──────────────────────────────────────── */}
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

        {/* ── FAQ ──────────────────────────────────────────── */}
        <section aria-labelledby="faq-heading" className="scroll-mt-20 py-24" id="faq">
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.6fr] lg:gap-16 lg:px-8">
            <div className="grid content-start gap-6 lg:sticky lg:top-24">
              <SectionHeading
                id="faq-heading"
                align="left"
                eyebrow="FAQ"
                title="Questions sellers ask"
                body="Everything you need to know before you start. Can't find your answer?"
              />
              <div className="reveal grid gap-3 rounded-2xl border bg-muted/30 p-6">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MessageCircleQuestion className="size-5" aria-hidden />
                </span>
                <p className="font-semibold">Still have questions?</p>
                <p className="text-sm text-muted-foreground">
                  Call or email us — we&apos;re happy to help you set up your store.
                </p>
                <Button size="lg" variant="outline" asChild className="justify-self-start px-4">
                  <Link href="/contact">Contact us</Link>
                </Button>
              </div>
            </div>
            <div className="reveal">
              <Faq
                trialPlanName={plans[0]?.name ?? "free"}
                domainPlanNames={domainPlanNames}
                multiplePlans={plans.length > 1}
              />
            </div>
          </div>
        </section>

      </main>

      <SiteFooter />
    </div>
  );
}
