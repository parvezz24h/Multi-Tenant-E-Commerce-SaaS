import Link from "next/link";

import type { ThemeCategoryListProps } from "@/themes/types";

export function ModernCategoryList({ categories }: ThemeCategoryListProps) {
  if (categories.length === 0) return null;

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {categories.map((c) => (
        <li key={c.id}>
          <Link
            href={`/products?category=${encodeURIComponent(c.slug)}`}
            className="flex h-full flex-col justify-between gap-6 rounded-xl border bg-primary/5 p-4 transition-colors hover:border-primary/40 hover:bg-primary/10"
          >
            <span className="font-medium">{c.name}</span>
            <span className="text-xs text-muted-foreground">
              {c.productCount} {c.productCount === 1 ? "product" : "products"}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
