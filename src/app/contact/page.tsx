import { Mail, MapPin, Phone, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ContactForm } from "@/components/contact/contact-form";
import { MarketingPage } from "@/components/marketing/marketing-page";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${siteConfig.name}.`,
};

type ContactDetail = {
  icon: LucideIcon;
  label: string;
  value: string;
  href?: string;
};

function contactDetails(): ContactDetail[] {
  const { email, phone, address } = siteConfig.contact;
  return [
    { icon: Mail, label: "Email", value: email, href: `mailto:${email}` },
    { icon: Phone, label: "Phone", value: phone, href: `tel:${phone.replace(/[^\d+]/g, "")}` },
    { icon: MapPin, label: "Office", value: address },
  ];
}

export default function ContactPage() {
  const details = contactDetails();

  return (
    <MarketingPage
      eyebrow="Contact"
      title="We're here to help"
      intro="Questions about setting up your store, billing or connecting your domain? Send us a message, or call or email us directly."
    >
      <section className="py-20">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start">
            <div className="grid gap-6 rounded-2xl border bg-background p-6 shadow-sm sm:p-8">
              <div className="grid gap-1">
                <h2 className="text-xl font-semibold tracking-tight">Send us a message</h2>
                <p className="text-sm text-muted-foreground">
                  Tell us what you need and we&apos;ll get back to you by email.
                </p>
              </div>
              <ContactForm />
            </div>

            <ul className="grid gap-4">
              {details.map(({ icon: Icon, label, value, href }) => (
                <li key={label} className="flex items-start gap-4 rounded-2xl border p-5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div className="grid min-w-0 gap-1">
                    <h2 className="text-sm font-medium text-muted-foreground">{label}</h2>
                    {href ? (
                      <a href={href} className="font-semibold break-words hover:text-primary hover:underline">
                        {value}
                      </a>
                    ) : (
                      <p className="font-semibold whitespace-pre-line">{value}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-2 rounded-2xl bg-muted/40 p-6 text-sm sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <p className="font-medium">Already selling with {siteConfig.name}?</p>
              <p className="text-muted-foreground">
                Sign in to your dashboard — billing, domains and settings are all there.
              </p>
            </div>
            <Link href="/sign-in" className="font-medium text-primary hover:underline">
              Sign in →
            </Link>
          </div>
        </div>
      </section>
    </MarketingPage>
  );
}
