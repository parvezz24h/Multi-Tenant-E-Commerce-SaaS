"use client";

import { CircleDollarSign, Home, Info, Mail, Menu, type LucideIcon } from "lucide-react";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon };

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/about", label: "About", icon: Info },
  { href: "/#pricing", label: "Pricing", icon: CircleDollarSign },
  { href: "/contact", label: "Contact", icon: Mail },
];

const PRICING_ID = "pricing";

const smooth = (): ScrollBehavior =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

/**
 * Which nav item is current. On the home page, "Pricing" takes over from
 * "Home" while the pricing section is in the middle of the screen.
 */
function useActiveHref() {
  const pathname = usePathname();
  const [onPricing, setOnPricing] = useState(false);

  useEffect(() => {
    if (pathname !== "/") return;
    const section = document.getElementById(PRICING_ID);
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => setOnPricing(entry!.isIntersecting), {
      rootMargin: "-45% 0px -50% 0px",
    });
    observer.observe(section);
    return () => observer.disconnect();
  }, [pathname]);

  if (pathname === "/") return onPricing ? "/#pricing" : "/";
  return pathname;
}

/**
 * Links to the page you're already on don't navigate in Next.js, so handle
 * them here: "Home" scrolls back to the top and "Pricing" scrolls to its
 * section, both keeping the URL in sync. Returns true when handled.
 */
function scrollInPage(href: string, pathname: string) {
  if (pathname !== "/") return false;
  if (href === "/") {
    window.scrollTo({ top: 0, behavior: smooth() });
    history.replaceState(null, "", "/");
    return true;
  }
  if (href === "/#pricing") {
    document.getElementById(PRICING_ID)?.scrollIntoView({ behavior: smooth(), block: "start" });
    history.replaceState(null, "", "/#pricing");
    return true;
  }
  return false;
}

/** Thin bar under a link while its page loads (always rendered, no layout shift). */
function PendingBar({ className }: { className?: string }) {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute rounded-full bg-primary transition-opacity",
        pending ? "animate-pulse opacity-100" : "opacity-0",
        className,
      )}
    />
  );
}

export function SiteNav() {
  const pathname = usePathname();
  const active = useActiveHref();

  return (
    <nav aria-label="Main" className="hidden md:block">
      <ul className="flex items-center gap-1 rounded-full border bg-muted/50 p-1">
        {NAV_ITEMS.map((item) => {
          const current = active === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={current ? (item.href.includes("#") ? "location" : "page") : undefined}
                onClick={(e) => {
                  if (scrollInPage(item.href, pathname)) e.preventDefault();
                }}
                className={cn(
                  "relative flex h-9 items-center rounded-full px-3 text-sm lg:px-4 font-medium outline-none transition-all select-none",
                  "focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.97] motion-reduce:active:scale-100",
                  current
                    ? "bg-background text-primary shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:bg-background/70 hover:text-foreground",
                )}
              >
                {item.label}
                <PendingBar className="inset-x-3 bottom-1 h-0.5 lg:inset-x-4" />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function MobileNav({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const active = useActiveHref();
  const [open, setOpen] = useState(false);
  // In-page target to scroll to once the sheet has closed and unlocked scrolling.
  const scrollAfterClose = useRef<string | null>(null);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-lg" className="md:hidden" aria-label="Open menu">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-80 max-w-[85vw]"
        onCloseAutoFocus={(e) => {
          const href = scrollAfterClose.current;
          if (!href) return;
          scrollAfterClose.current = null;
          e.preventDefault(); // don't jump back to the menu button
          scrollInPage(href, pathname);
        }}
      >
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav aria-label="Main" className="px-3">
          <ul className="grid gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const current = active === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={current ? (href.includes("#") ? "location" : "page") : undefined}
                    onClick={(e) => {
                      if (pathname === "/" && (href === "/" || href === "/#pricing")) {
                        e.preventDefault();
                        scrollAfterClose.current = href;
                      }
                      setOpen(false);
                    }}
                    className={cn(
                      "relative flex h-12 items-center gap-3 rounded-xl px-3 text-base font-medium outline-none transition-colors select-none",
                      "focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-muted",
                      current ? "bg-primary/10 text-primary" : "text-foreground/80 hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-8 items-center justify-center rounded-lg",
                        current ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon className="size-4" aria-hidden />
                    </span>
                    {label}
                    <PendingBar className="right-3 size-1.5" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="mt-auto grid gap-2 border-t p-4">
          {signedIn ? (
            <Button size="xl" asChild>
              <Link href="/dashboard" onClick={() => setOpen(false)}>Go to dashboard</Link>
            </Button>
          ) : (
            <>
              {pathname !== "/sign-up" && (
                <Button size="xl" asChild>
                  <Link href="/sign-up" onClick={() => setOpen(false)}>Start free trial</Link>
                </Button>
              )}
              {pathname !== "/sign-in" && (
                <Button size="xl" variant="outline" asChild>
                  <Link href="/sign-in" onClick={() => setOpen(false)}>Sign in</Link>
                </Button>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Header buttons for signed-out visitors. The button for the page you're on
 * (sign in / sign up) is hidden; on /sign-up, "Sign in" is the only button,
 * so it stays visible on small screens too.
 */
export function SignedOutActions() {
  const pathname = usePathname();
  const onSignUp = pathname === "/sign-up";
  return (
    <>
      {pathname !== "/sign-in" && (
        <Button
          size="lg"
          variant={onSignUp ? "outline" : "ghost"}
          asChild
          className={cn("px-4", !onSignUp && "hidden sm:inline-flex")}
        >
          <Link href="/sign-in">Sign in</Link>
        </Button>
      )}
      {!onSignUp && (
        <Button size="lg" asChild className="px-4 shadow-sm shadow-primary/25">
          <Link href="/sign-up">Start free trial</Link>
        </Button>
      )}
    </>
  );
}

/** Sticky header frame that gains a border and soft shadow once the page scrolls. */
export function HeaderFrame({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header
      data-scrolled={scrolled || undefined}
      className="sticky top-0 z-30 border-b border-transparent bg-background/80 backdrop-blur transition-[border-color,box-shadow] duration-200 supports-[backdrop-filter]:bg-background/70 data-scrolled:border-border data-scrolled:shadow-sm"
    >
      {children}
    </header>
  );
}
