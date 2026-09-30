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
          ? "relative isolate overflow-hidden rounded-2xl text-white"
          : "rounded-2xl bg-primary text-primary-foreground"
      }
    >
      {hasImage && (
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
          <div aria-hidden className="absolute inset-0 -z-10 bg-black/45" />
        </>
      )}
      <div className="flex flex-col items-start gap-4 px-6 py-12 sm:px-10 sm:py-20">
        <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
          {theme.heroTitle}
        </h1>
        <p className="max-w-lg text-base opacity-90 text-pretty sm:text-lg">{theme.heroSubtitle}</p>
        <Button
          asChild
          size="lg"
          className={
            hasImage
              ? "bg-white text-neutral-900 hover:bg-white/90"
              : "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
          }
        >
          <Link href="/products">Shop now</Link>
        </Button>
      </div>
    </section>
  );
}
