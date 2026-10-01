import Link from "next/link";

import { BrandLogo } from "@/components/brand";
import { Button } from "@/components/ui/button";

import { HeaderFrame, MobileNav, SignedOutActions, SiteNav } from "./site-nav";

export function Logo() {
  return <BrandLogo priority />;
}

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  return (
    <HeaderFrame>
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Logo />
        <SiteNav />
        <div className="ml-auto flex items-center gap-2">
          {signedIn ? (
            <Button size="lg" asChild className="px-4">
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
          ) : (
            <SignedOutActions />
          )}
          <MobileNav signedIn={signedIn} />
        </div>
      </div>
    </HeaderFrame>
  );
}
