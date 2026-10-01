"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

type Props = { categories: { id: string; name: string; slug: string }[] };

/** Category bar under the header; highlights the category being browsed. */
export function CategoryNav({ categories }: Props) {
  const pathname = usePathname();
  const params = useSearchParams();
  // Storefront paths are rewritten (/s/<slug>/products), so match the end.
  const onListing = pathname.endsWith("/products");
  const current = onListing ? (params.get("category") ?? "") : null;

  const item = (href: string, label: string, active: boolean) => (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "block rounded-full px-3 py-1 whitespace-nowrap transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );

  return (
    <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 text-sm">
      <li>{item("/products", "All products", current === "")}</li>
      {categories.map((c) => (
        <li key={c.id}>{item(`/products?category=${encodeURIComponent(c.slug)}`, c.name, current === c.slug)}</li>
      ))}
    </ul>
  );
}

/** Static version for the first render (before search params are known). */
export function CategoryNavFallback({ categories }: Props) {
  return (
    <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 text-sm">
      <li>
        <Link href="/products" className="block rounded-full px-3 py-1 whitespace-nowrap text-muted-foreground">
          All products
        </Link>
      </li>
      {categories.map((c) => (
        <li key={c.id}>
          <Link
            href={`/products?category=${encodeURIComponent(c.slug)}`}
            className="block rounded-full px-3 py-1 whitespace-nowrap text-muted-foreground"
          >
            {c.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
