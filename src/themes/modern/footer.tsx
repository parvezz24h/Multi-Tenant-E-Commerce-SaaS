import { Mail, MapPin, Package, Phone } from "lucide-react";
import Link from "next/link";

import { siteConfig } from "@/lib/site";
import type { ThemeFooterProps } from "@/themes/types";

export function ModernFooter({ store, theme }: ThemeFooterProps) {
  const address = [store.addressLine, store.district].filter(Boolean).join(", ");

  return (
    <footer className="mt-16 border-t bg-muted/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2">
        <div className="grid content-start gap-2">
          <div className="text-lg font-semibold">{store.name}</div>
          {store.description && (
            <p className="max-w-sm text-sm text-muted-foreground">{store.description}</p>
          )}
          {theme.footerText && <p className="text-sm text-muted-foreground">{theme.footerText}</p>}
        </div>
        <ul className="grid content-start gap-2 text-sm">
          <li className="flex items-center gap-2">
            <Package className="size-4 text-muted-foreground" aria-hidden />
            <Link href="/track" className="hover:underline">
              Track your order
            </Link>
          </li>
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
            <li className="flex items-center gap-2">
              <MapPin className="size-4 text-muted-foreground" aria-hidden />
              {address}
            </li>
          )}
        </ul>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {store.name} · Powered by {siteConfig.name}
      </div>
    </footer>
  );
}
