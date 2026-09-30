import { Search, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Input } from "@/components/ui/input";
import type { ThemeHeaderProps } from "@/themes/types";

export function ModernHeader({ store, theme, categories, cartCount }: ThemeHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
      {theme.announcement && (
        <div className="bg-primary px-4 py-1.5 text-center text-xs font-medium text-primary-foreground">
          {theme.announcement}
        </div>
      )}
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          {store.logoUrl ? (
            <Image
              src={store.logoUrl}
              alt=""
              width={32}
              height={32}
              unoptimized
              className="size-8 rounded object-contain"
            />
          ) : (
            <span
              aria-hidden
              className="flex size-8 shrink-0 items-center justify-center rounded bg-primary text-sm font-bold text-primary-foreground"
            >
              {store.name.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="truncate text-lg font-semibold tracking-tight">{store.name}</span>
        </Link>

        <form action="/products" role="search" className="ml-auto hidden max-w-sm flex-1 sm:block">
          <label htmlFor="store-search" className="sr-only">
            Search products
          </label>
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input id="store-search" name="q" type="search" placeholder="Search products" className="pl-8" />
          </div>
        </form>

        <Link
          href="/cart"
          className="relative ml-auto inline-flex size-10 items-center justify-center rounded-full hover:bg-muted sm:ml-0"
          aria-label={`Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
        >
          <ShoppingBag className="size-5" aria-hidden />
          {cartCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground tabular-nums">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </Link>
      </div>

      <form action="/products" role="search" className="px-4 pb-3 sm:hidden">
        <label htmlFor="store-search-mobile" className="sr-only">
          Search products
        </label>
        <Input id="store-search-mobile" name="q" type="search" placeholder="Search products" />
      </form>

      {categories.length > 0 && (
        <nav aria-label="Categories" className="border-t">
          <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 text-sm">
            <li>
              <Link href="/products" className="block rounded-full px-3 py-1 whitespace-nowrap hover:bg-muted">
                All products
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/products?category=${encodeURIComponent(c.slug)}`}
                  className="block rounded-full px-3 py-1 whitespace-nowrap text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
