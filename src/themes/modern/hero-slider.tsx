"use client";

import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ThemeHeroSlide } from "@/themes/types";

const INTERVAL_MS = 6000;
/** Horizontal drag (px) that counts as a swipe. */
const SWIPE_PX = 40;

/** Store paths stay in the site; https links open in a new tab. */
function SlideLink({ href, className, children, ...rest }: React.ComponentProps<"a"> & { href: string }) {
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} {...rest}>
      {children}
    </a>
  );
}

export function ModernHeroSlider({ slides, storeName }: { slides: ThemeHeroSlide[]; storeName: string }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const dragStart = useRef<number | null>(null);
  const count = slides.length;

  const go = useCallback((next: number) => setIndex(((next % count) + count) % count), [count]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // Autoplay pauses on hover/focus, for reduced motion, and when the visitor pauses it.
  const autoplay = count > 1 && playing && !hovered && !focused && !reducedMotion;
  useEffect(() => {
    if (!autoplay) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") setIndex((i) => (i + 1) % count);
    }, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [autoplay, count, index]);

  function onPointerDown(event: React.PointerEvent) {
    if (event.pointerType !== "mouse") dragStart.current = event.clientX;
  }

  function onPointerUp(event: React.PointerEvent) {
    if (dragStart.current === null) return;
    const delta = event.clientX - dragStart.current;
    dragStart.current = null;
    if (Math.abs(delta) >= SWIPE_PX) go(index + (delta < 0 ? 1 : -1));
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowLeft") go(index - 1);
    else if (event.key === "ArrowRight") go(index + 1);
  }

  return (
    <section
      aria-roledescription="carousel"
      aria-label={`${storeName} highlights`}
      className="relative isolate overflow-hidden rounded-3xl bg-muted"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setFocused(false)}
      onKeyDown={onKeyDown}
    >
      <div
        className="relative aspect-[4/3] touch-pan-y sm:aspect-[16/7]"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (dragStart.current = null)}
      >
        {slides.map((slide, i) => {
          const active = i === index;
          const hasText = Boolean(slide.title || slide.subtitle || slide.buttonLabel);
          return (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={!active}
              inert={!active}
              className={cn(
                "absolute inset-0 transition-opacity duration-700 ease-out motion-reduce:transition-none",
                active ? "z-10 opacity-100" : "opacity-0",
              )}
            >
              <Image
                src={slide.imageUrl}
                alt={hasText ? "" : slide.title || `${storeName} banner ${i + 1}`}
                fill
                unoptimized
                priority={i === 0}
                sizes="100vw"
                draggable={false}
                className="-z-10 object-cover select-none"
              />
              {/* An image-only slide with a link is clickable as a whole. */}
              {!slide.buttonLabel && slide.linkUrl && (
                <SlideLink
                  href={slide.linkUrl}
                  aria-label={slide.title || `Open banner ${i + 1}`}
                  className="absolute inset-0 z-0"
                />
              )}
              {hasText && (
                <>
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-black/65 via-black/35 to-transparent"
                  />
                  <div className="pointer-events-none relative flex h-full flex-col items-start justify-center gap-4 px-6 py-10 text-white sm:px-20">
                    {slide.title && (
                      <h2 className="max-w-xl text-2xl font-semibold tracking-tight text-balance sm:text-5xl">
                        {slide.title}
                      </h2>
                    )}
                    {slide.subtitle && (
                      <p className="max-w-lg text-sm text-pretty opacity-90 sm:text-lg">{slide.subtitle}</p>
                    )}
                    {slide.buttonLabel && slide.linkUrl && (
                      <Button
                        asChild
                        size="lg"
                        className="pointer-events-auto mt-1 bg-white text-neutral-900 hover:bg-white/90"
                      >
                        <SlideLink href={slide.linkUrl}>
                          {slide.buttonLabel} <ArrowRight />
                        </SlideLink>
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous slide"
            className="absolute top-1/2 left-3 z-20 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-neutral-900 shadow-sm backdrop-blur transition hover:bg-white sm:flex"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next slide"
            className="absolute top-1/2 right-3 z-20 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-neutral-900 shadow-sm backdrop-blur transition hover:bg-white sm:flex"
          >
            <ChevronRight className="size-5" />
          </button>
          <div className="absolute inset-x-0 bottom-3 z-20 flex items-center justify-center gap-2">
            {!reducedMotion && (
              <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                aria-label={playing ? "Pause slides" : "Play slides"}
                className="flex size-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60"
              >
                {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
              </button>
            )}
            <div className="flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-2 backdrop-blur">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={i === index}
                  className={cn(
                    "h-2 rounded-full bg-white transition-all",
                    i === index ? "w-6" : "w-2 opacity-50 hover:opacity-80",
                  )}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
