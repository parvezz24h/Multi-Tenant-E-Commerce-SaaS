import type { Prisma } from "@/generated/prisma/client";

export const PRODUCT_SORTS = {
  newest: { label: "Newest", orderBy: [{ createdAt: "desc" }, { id: "desc" }] },
  "price-asc": { label: "Price: low to high", orderBy: [{ price: "asc" }, { id: "asc" }] },
  "price-desc": { label: "Price: high to low", orderBy: [{ price: "desc" }, { id: "desc" }] },
  name: { label: "Name", orderBy: [{ name: "asc" }, { id: "asc" }] },
} satisfies Record<string, { label: string; orderBy: Prisma.ProductOrderByWithRelationInput[] }>;

export type ProductSort = keyof typeof PRODUCT_SORTS;

export type ProductQuery = {
  q?: string;
  categorySlug?: string;
  inStock?: boolean;
  sort?: ProductSort;
  page?: number;
};

type SearchParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Parse untrusted listing query params into a safe ProductQuery. */
export function parseProductQuery(params: SearchParams): ProductQuery {
  const sort = first(params.sort);
  const page = Number.parseInt(first(params.page) ?? "", 10);
  return {
    q: first(params.q)?.trim().slice(0, 100) || undefined,
    categorySlug: first(params.category)?.slice(0, 80) || undefined,
    inStock: first(params.inStock) === "1",
    sort: sort && Object.hasOwn(PRODUCT_SORTS, sort) ? (sort as ProductSort) : "newest",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

/** Build a listing URL, dropping defaults so URLs stay clean. */
export function productsHref(query: ProductQuery, overrides: Partial<ProductQuery> = {}) {
  const merged = { ...query, ...overrides };
  const sp = new URLSearchParams();
  if (merged.q) sp.set("q", merged.q);
  if (merged.categorySlug) sp.set("category", merged.categorySlug);
  if (merged.inStock) sp.set("inStock", "1");
  if (merged.sort && merged.sort !== "newest") sp.set("sort", merged.sort);
  if (merged.page && merged.page > 1) sp.set("page", String(merged.page));
  const qs = sp.toString();
  return qs ? `/products?${qs}` : "/products";
}
