import { ArrowRight } from "lucide-react";
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
            className="group flex h-full items-center gap-3 rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5"
          >
            <span
              aria-hidden
              className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-semibold text-primary"
            >
              {c.name.charAt(0).toUpperCase()}
            </span>
            <span className="grid min-w-0 flex-1 gap-0.5">
              <span className="truncate font-medium">{c.name}</span>
              <span className="text-xs text-muted-foreground">
                {c.productCount} {c.productCount === 1 ? "product" : "products"}
              </span>
            </span>
            <ArrowRight
              className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
              aria-hidden
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
