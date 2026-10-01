import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { ThemeHeroProps } from "@/themes/types";

export function ModernHero({ theme }: ThemeHeroProps) {
  const hasImage = Boolean(theme.heroImageUrl);

  return (
    <section
      className={
        hasImage
          ? "relative isolate overflow-hidden rounded-3xl text-white"
          : "relative isolate overflow-hidden rounded-3xl bg-primary text-primary-foreground"
      }
    >
      {hasImage ? (
        <>
          <Image
            src={theme.heroImageUrl!}
            alt=""
            fill
            unoptimized
            priority
            sizes="100vw"
            className="-z-10 object-cover"
          />
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-black/65 via-black/40 to-black/10" />
        </>
      ) : (
        // Soft decorative shapes so a plain brand color doesn't look flat.
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 -right-16 size-80 rounded-full bg-current opacity-[0.08]" />
          <div className="absolute -right-10 -bottom-32 size-96 rounded-full bg-current opacity-[0.06]" />
          <div className="absolute top-10 right-1/3 size-24 rounded-full bg-current opacity-[0.05]" />
        </div>
      )}
      <div className="flex min-h-72 flex-col items-start justify-center gap-5 px-6 py-14 sm:min-h-96 sm:px-12">
        <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
          {theme.heroTitle}
        </h1>
        <p className="max-w-lg text-base text-pretty opacity-90 sm:text-lg">{theme.heroSubtitle}</p>
        <div className="flex flex-wrap gap-3">
          <Button
            asChild
            size="lg"
            className={
              hasImage
                ? "bg-white text-neutral-900 hover:bg-white/90"
                : "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            }
          >
            <Link href="/products">
              Shop now <ArrowRight />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="ghost"
            className="border border-current/30 bg-transparent text-current hover:bg-current/10 hover:text-current"
          >
            <Link href="/track">Track your order</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
