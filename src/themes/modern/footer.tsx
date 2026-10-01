import { Banknote, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

import { siteConfig } from "@/lib/site";
import type { ThemeFooterProps } from "@/themes/types";

const MAX_FOOTER_CATEGORIES = 6;

export function ModernFooter({ store, theme, categories }: ThemeFooterProps) {
  const address = [store.addressLine, store.district].filter(Boolean).join(", ");
  const linkClass = "text-muted-foreground transition-colors hover:text-foreground";

  return (
    <footer className="mt-16 border-t bg-muted/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div className="grid content-start gap-3">
          <div className="text-lg font-semibold">{store.name}</div>
          {store.description && <p className="max-w-sm text-sm text-muted-foreground">{store.description}</p>}
          {theme.footerText && <p className="text-sm text-muted-foreground">{theme.footerText}</p>}
          <ul className="mt-2 grid gap-2 text-sm">
            {store.contactPhone && (
              <li className="flex items-center gap-2">
                <Phone className="size-4 text-muted-foreground" aria-hidden />
                <a href={`tel:${store.contactPhone}`} className="hover:underline">
                  {store.contactPhone}
                </a>
              </li>
            )}
            {store.contactEmail && (
              <li className="flex items-center gap-2">
                <Mail className="size-4 text-muted-foreground" aria-hidden />
                <a href={`mailto:${store.contactEmail}`} className="hover:underline">
                  {store.contactEmail}
                </a>
              </li>
            )}
            {address && (
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                {address}
              </li>
            )}
          </ul>
        </div>

        <nav aria-label="Shop" className="grid content-start gap-2 text-sm">
          <p className="font-medium">Shop</p>
          <Link href="/products" className={linkClass}>
            All products
          </Link>
          {categories.slice(0, MAX_FOOTER_CATEGORIES).map((c) => (
            <Link key={c.id} href={`/products?category=${encodeURIComponent(c.slug)}`} className={linkClass}>
              {c.name}
            </Link>
          ))}
        </nav>

        <nav aria-label="Help" className="grid content-start gap-2 text-sm">
          <p className="font-medium">Help</p>
          <Link href="/track" className={linkClass}>
            Track your order
          </Link>
          <Link href="/cart" className={linkClass}>
            Your cart
          </Link>
          <p className="mt-2 flex items-center gap-2 text-muted-foreground">
            <Banknote className="size-4" aria-hidden />
            Cash on delivery available
          </p>
        </nav>
      </div>
      <div className="border-t">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-muted-foreground">
          © {new Date().getFullYear()} {store.name} · Powered by {siteConfig.name}
        </p>
      </div>
    </footer>
  );
}
