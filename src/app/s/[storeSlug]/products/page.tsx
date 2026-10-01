import { SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { SortSelect } from "@/components/storefront/sort-select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { requireOpenStore } from "@/server/storefront/context";
import {
  parseProductQuery,
  PRODUCT_SORTS,
  productsHref,
  type ProductSort,
} from "@/server/storefront/params";
import { listCategories, listProducts } from "@/server/storefront/service";

export async function generateMetadata({
  searchParams,
}: PageProps<"/s/[storeSlug]/products">): Promise<Metadata> {
  const { q } = parseProductQuery(await searchParams);
  return { title: q ? `Search: ${q}` : "Products" };
}

export default async function ProductsPage({
  params,
  searchParams,
}: PageProps<"/s/[storeSlug]/products">) {
  const { store, components } = await requireOpenStore((await params).storeSlug);
  const { ProductCard } = components;
  const query = parseProductQuery(await searchParams);

  const [categories, result] = await Promise.all([
    listCategories(store.id),
    listProducts(store.id, query),
  ]);
  const activeCategory = categories.find((c) => c.slug === query.categorySlug);

  const heading = query.q
    ? `Results for “${query.q}”`
    : (activeCategory?.name ?? "All products");

  const sortOptions = (Object.keys(PRODUCT_SORTS) as ProductSort[]).map((key) => ({
    value: key,
    label: PRODUCT_SORTS[key].label,
    href: productsHref(query, { sort: key, page: 1 }),
  }));

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>
          <p className="text-sm text-muted-foreground">
            {result.total} {result.total === 1 ? "product" : "products"}
          </p>
        </div>
        <SortSelect value={query.sort ?? "newest"} options={sortOptions} />
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filters">
        <FilterChip href={productsHref(query, { categorySlug: undefined, page: 1 })} active={!query.categorySlug}>
          All
        </FilterChip>
        {categories.map((c) => (
          <FilterChip
            key={c.id}
            href={productsHref(query, { categorySlug: c.slug, page: 1 })}
            active={c.slug === query.categorySlug}
          >
            {c.name}
          </FilterChip>
        ))}
        <FilterChip
          href={productsHref(query, { inStock: !query.inStock, page: 1 })}
          active={Boolean(query.inStock)}
        >
          In stock only
        </FilterChip>
      </div>

      {result.items.length > 0 ? (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {result.items.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="grid justify-items-center gap-3 rounded-xl border border-dashed p-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <SearchX className="size-5" aria-hidden />
          </span>
          <p className="text-muted-foreground">No products match your search.</p>
          <Button variant="outline" asChild>
            <Link href="/products">Clear filters</Link>
          </Button>
        </div>
      )}

      {result.pageCount > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-center gap-2">
          <PageLink href={productsHref(query, { page: result.page - 1 })} disabled={result.page <= 1}>
            Previous
          </PageLink>
          <span className="px-2 text-sm text-muted-foreground tabular-nums">
            Page {result.page} of {result.pageCount}
          </span>
          <PageLink
            href={productsHref(query, { page: result.page + 1 })}
            disabled={result.page >= result.pageCount}
          >
            Next
          </PageLink>
        </nav>
      )}
    </div>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={cn(
        "rounded-full border px-3 py-1 text-sm transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "hover:border-primary/40 hover:bg-muted",
      )}
    >
      {children}
    </Link>
  );
}

function PageLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <Button variant="outline" size="sm" disabled>
        {children}
      </Button>
    );
  }
  return (
    <Button variant="outline" size="sm" asChild>
      <Link href={href}>{children}</Link>
    </Button>
  );
}
