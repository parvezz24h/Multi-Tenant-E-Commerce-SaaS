import Link from "next/link";

import { siteConfig } from "@/lib/site";

import { Logo } from "./site-header";

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:grid-cols-[1fr_auto_auto]">
        <div className="grid content-start gap-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">{siteConfig.description}</p>
        </div>
        <nav aria-label="Product" className="grid content-start gap-2 text-sm">
          <p className="font-medium">Product</p>
          <a href="#features" className="text-muted-foreground hover:text-foreground">
            Features
          </a>
          <a href="#pricing" className="text-muted-foreground hover:text-foreground">
            Pricing
          </a>
          <a href="#faq" className="text-muted-foreground hover:text-foreground">
            FAQ
          </a>
        </nav>
        <nav aria-label="Account" className="grid content-start gap-2 text-sm">
          <p className="font-medium">Account</p>
          <Link href="/sign-up" className="text-muted-foreground hover:text-foreground">
            Create a store
          </Link>
          <Link href="/sign-in" className="text-muted-foreground hover:text-foreground">
            Sign in
          </Link>
        </nav>
      </div>
      <div className="border-t">
        <p className="mx-auto w-full max-w-6xl px-4 py-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} {siteConfig.name}. Made in Bangladesh.
        </p>
      </div>
    </footer>
  );
}
