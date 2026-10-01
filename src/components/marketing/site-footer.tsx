import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

import { BrandMark, BrandName } from "@/components/brand";
import { siteConfig } from "@/lib/site";

const LINK = "text-primary-foreground/75 transition-colors hover:text-primary-foreground";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/#features", label: "Features" },
      { href: "/#pricing", label: "Pricing" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/sign-up", label: "Create a store" },
      { href: "/sign-in", label: "Sign in" },
    ],
  },
];

export function SiteFooter() {
  const { email, phone, address } = siteConfig.contact;

  return (
    <footer className="relative overflow-hidden bg-primary text-primary-foreground">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-24 size-96 rounded-full bg-white/10" />
        <div className="absolute -bottom-40 left-1/3 size-80 rounded-full bg-white/5" />
      </div>

      <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.4fr_2fr] lg:gap-16 lg:px-8">
        <div className="grid content-start gap-5">
          <Link href="/" className="flex items-center gap-2.5 justify-self-start" aria-label={`${siteConfig.name} home`}>
            {/* White tile so the orange mark stays visible on the orange footer. */}
            <span className="flex size-10 items-center justify-center rounded-xl bg-white shadow-sm">
              <BrandMark className="size-7" />
            </span>
            <BrandName className="text-lg" accentClassName="text-primary-foreground/70" />
          </Link>
          <p className="max-w-sm text-sm text-primary-foreground/80">{siteConfig.description}</p>
          <ul className="grid gap-2.5 text-sm">
            <li>
              <a href={`mailto:${email}`} className={`inline-flex items-center gap-2.5 ${LINK}`}>
                <Mail className="size-4 shrink-0" aria-hidden /> {email}
              </a>
            </li>
            <li>
              <a href={`tel:${phone}`} className={`inline-flex items-center gap-2.5 ${LINK}`}>
                <Phone className="size-4 shrink-0" aria-hidden /> {phone}
              </a>
            </li>
            <li className="flex items-start gap-2.5 text-primary-foreground/75">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden /> {address}
            </li>
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title} className="grid content-start gap-3 text-sm">
              <p className="font-semibold">{col.title}</p>
              {col.links.map((l) => (
                <Link key={l.href} href={l.href} className={`justify-self-start ${LINK}`}>
                  {l.label}
                </Link>
              ))}
            </nav>
          ))}
        </div>
      </div>

      <div className="relative border-t border-primary-foreground/15">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-xs text-primary-foreground/70 sm:px-6 lg:px-8">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <p>Made in Bangladesh 🇧🇩</p>
        </div>
      </div>
    </footer>
  );
}
