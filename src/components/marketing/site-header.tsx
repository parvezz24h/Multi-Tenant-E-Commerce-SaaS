import Link from "next/link";

import { BrandLogo } from "@/components/brand";
import { Button } from "@/components/ui/button";

import { MobileNav, SiteNav } from "./site-nav";

export function Logo() {
  return <BrandLogo priority />;
}

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-transparent bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Logo />
        <SiteNav />
        <div className="ml-auto flex items-center gap-2">
          {signedIn ? (
            <Button size="lg" asChild className="px-4">
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
          ) : (
            <>
              <Button size="lg" variant="ghost" asChild className="hidden px-4 sm:inline-flex">
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button size="lg" asChild className="px-4 shadow-sm shadow-primary/25">
                <Link href="/sign-up">Start free trial</Link>
              </Button>
            </>
          )}
          <MobileNav signedIn={signedIn} />
        </div>
      </div>
    </header>
  );
}
