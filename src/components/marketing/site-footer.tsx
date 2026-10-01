import Link from "next/link";

import { siteConfig } from "@/lib/site";

import { Logo } from "./site-header";

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 sm:grid-cols-[1fr_auto_auto_auto] sm:gap-12 sm:px-6 lg:px-8">
        <div className="grid content-start gap-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">{siteConfig.description}</p>
        </div>
        <nav aria-label="Product" className="grid content-start gap-2 text-sm">
          <p className="font-medium">Product</p>
          <Link href="/#features" className="text-muted-foreground hover:text-foreground">
            Features
          </Link>
          <Link href="/#pricing" className="text-muted-foreground hover:text-foreground">
            Pricing
          </Link>
          <Link href="/#faq" className="text-muted-foreground hover:text-foreground">
            FAQ
          </Link>
        </nav>
        <nav aria-label="Company" className="grid content-start gap-2 text-sm">
          <p className="font-medium">Company</p>
          <Link href="/about" className="text-muted-foreground hover:text-foreground">
            About
          </Link>
          <Link href="/contact" className="text-muted-foreground hover:text-foreground">
            Contact
          </Link>
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
        <p className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} {siteConfig.name}. Made in Bangladesh.
        </p>
      </div>
    </footer>
  );
}
