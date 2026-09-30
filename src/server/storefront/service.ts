import "server-only";

import { cache } from "react";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

import { PRODUCT_SORTS, type ProductQuery } from "./params";

/**
 * Public storefront queries. Every query is scoped by `storeId` taken from
 * the resolved store (never from user input), and only ACTIVE products in
 * ACTIVE stores are ever returned.
 */

export const PRODUCTS_PER_PAGE = 12;

const storeSelect = {
  id: true,
  name: true,
  slug: true,
  status: true,
  description: true,
  logoUrl: true,
  contactEmail: true,
  contactPhone: true,
  addressLine: true,
  district: true,
  currency: true,
  deliveryChargeInsideDhaka: true,
  deliveryChargeOutsideDhaka: true,
  theme: true,
} satisfies Prisma.StoreSelect;

export type StorefrontStore = Prisma.StoreGetPayload<{ select: typeof storeSelect }>;

/** The store for a slug regardless of status (the layout decides what to show). */
export const getStorefrontStore = cache(async (slug: string) => {
  return db.store.findUnique({ where: { slug }, select: storeSelect });
});

/** The store only if it is open to the public. */
export const getOpenStore = cache(async (slug: string) => {
  const store = await getStorefrontStore(slug);
  return store?.status === "ACTIVE" ? store : null;
});

const activeProduct = (storeId: string) =>
  ({ storeId, status: "ACTIVE" }) satisfies Prisma.ProductWhereInput;

export const productCardSelect = {
  id: true,
  name: true,
  slug: true,
  price: true,
  compareAtPrice: true,
  stock: true,
  images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, alt: true } },
} satisfies Prisma.ProductSelect;

export type StorefrontProductCard = Prisma.ProductGetPayload<{ select: typeof productCardSelect }>;

export const listCategories = cache(async (storeId: string) => {
  const categories = await db.category.findMany({
    where: { storeId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      imageUrl: true,
      _count: { select: { products: { where: activeProduct(storeId) } } },
    },
  });
  // Hide empty categories from shoppers.
  return categories
    .filter((c) => c._count.products > 0)
    .map(({ _count, ...c }) => ({ ...c, productCount: _count.products }));
});

export type StorefrontCategory = Awaited<ReturnType<typeof listCategories>>[number];

export async function getFeaturedProducts(storeId: string, limit = 8) {
  return db.product.findMany({
    where: activeProduct(storeId),
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: productCardSelect,
  });
}

export async function listProducts(storeId: string, query: ProductQuery) {
  const q = query.q?.trim().slice(0, 100);
  const where: Prisma.ProductWhereInput = {
    ...activeProduct(storeId),
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { sku: { equals: q, mode: "insensitive" } },
      ],
    }),
    ...(query.categorySlug && { category: { storeId, slug: query.categorySlug } }),
    ...(query.inStock && { stock: { gt: 0 } }),
  };

  const total = await db.product.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / PRODUCTS_PER_PAGE));
  const page = Math.min(Math.max(1, query.page ?? 1), pageCount);

  const items = await db.product.findMany({
    where,
    orderBy: PRODUCT_SORTS[query.sort ?? "newest"].orderBy,
    skip: (page - 1) * PRODUCTS_PER_PAGE,
    take: PRODUCTS_PER_PAGE,
    select: productCardSelect,
  });

  return { items, total, page, pageCount };
}

export const getProduct = cache(async (storeId: string, slug: string) => {
  return db.product.findFirst({
    where: { ...activeProduct(storeId), slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      price: true,
      compareAtPrice: true,
      stock: true,
      sku: true,
      categoryId: true,
      category: { select: { name: true, slug: true } },
      images: { orderBy: { sortOrder: "asc" }, select: { id: true, url: true, alt: true } },
    },
  });
});

export async function getRelatedProducts(
  storeId: string,
  product: { id: string; categoryId: string | null },
  limit = 4,
) {
  return db.product.findMany({
    where: {
      ...activeProduct(storeId),
      id: { not: product.id },
      ...(product.categoryId && { categoryId: product.categoryId }),
    },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: productCardSelect,
  });
}
