import { Banknote, ChevronRight, PackageSearch, Truck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AddToCart } from "@/components/storefront/add-to-cart";
import { Price } from "@/components/storefront/price";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { discountPercent, formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { MAX_QUANTITY_PER_ITEM } from "@/server/cart/service";
import { requireOpenStore } from "@/server/storefront/context";
import { getProduct, getRelatedProducts } from "@/server/storefront/service";

type Props = PageProps<"/s/[storeSlug]/products/[productSlug]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { storeSlug, productSlug } = await params;
  const { store } = await requireOpenStore(storeSlug);
  const product = await getProduct(store.id, productSlug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.description?.slice(0, 160),
    openGraph: product.images[0] ? { images: [product.images[0].url] } : undefined,
  };
}

export default async function ProductPage({ params }: Props) {
  const { storeSlug, productSlug } = await params;
  const { store, components } = await requireOpenStore(storeSlug);
  const product = await getProduct(store.id, productSlug);
  if (!product) notFound();

  const related = await getRelatedProducts(store.id, product);
  const { ProductCard } = components;
  const inStock = product.stock > 0;
  const lowStock = inStock && product.stock <= 5;
  const saving =
    discountPercent(product.price, product.compareAtPrice) !== null
      ? product.compareAtPrice! - product.price
      : null;

  return (
    // Extra bottom padding on phones so the sticky add-to-cart bar never covers content.
    <div className="grid gap-12 pb-24 md:pb-0">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/products" className="hover:text-foreground">
          Products
        </Link>
        {product.category && (
          <>
            <ChevronRight className="size-3.5" aria-hidden />
            <Link
              href={`/products?category=${encodeURIComponent(product.category.slug)}`}
              className="hover:text-foreground"
            >
              {product.category.name}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <ProductGallery name={product.name} images={product.images} />

        <div className="grid content-start gap-5">
          <div className="grid gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              {product.name}
            </h1>
            <Price price={product.price} compareAtPrice={product.compareAtPrice} size="lg" />
            {saving !== null && (
              <p className="text-sm font-medium text-primary">You save {formatMoney(saving)}</p>
            )}
          </div>

          <p
            className={cn(
              "inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-sm font-medium",
              !inStock
                ? "bg-destructive/10 text-destructive"
                : lowStock
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                  : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
            )}
          >
            <span aria-hidden className="size-1.5 rounded-full bg-current" />
            {inStock ? (lowStock ? `Only ${product.stock} left` : "In stock") : "Sold out"}
          </p>

          {/* On phones this becomes a bar stuck to the bottom of the screen. */}
          <div className="max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-20 max-md:border-t max-md:bg-background/95 max-md:px-4 max-md:py-3 max-md:backdrop-blur">
            <AddToCart
              storeId={store.id}
              productId={product.id}
              maxQuantity={Math.min(product.stock, MAX_QUANTITY_PER_ITEM)}
            />
          </div>

          <ul className="grid gap-3 rounded-xl border p-4 text-sm">
            <li className="flex items-start gap-3">
              <Banknote className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span>
                <span className="font-medium">Cash on delivery</span>
                <span className="block text-muted-foreground">Pay when you receive your order.</span>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Truck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span>
                <span className="font-medium">Delivery charge</span>
                <span className="block text-muted-foreground">
                  {formatMoney(store.deliveryChargeInsideDhaka)} inside Dhaka ·{" "}
                  {formatMoney(store.deliveryChargeOutsideDhaka)} outside Dhaka
                </span>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <PackageSearch className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span>
                <span className="font-medium">Track your order</span>
                <span className="block text-muted-foreground">Follow your order online after you buy.</span>
              </span>
            </li>
          </ul>

          {product.description && (
            <div className="grid gap-2 border-t pt-5">
              <h2 className="font-medium">Description</h2>
              <p className="text-sm whitespace-pre-line text-muted-foreground">{product.description}</p>
            </div>
          )}
          {product.sku && <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>}
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="grid gap-4">
          <h2 id="related-heading" className="text-xl font-semibold tracking-tight">
            You may also like
          </h2>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4">
            {related.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
