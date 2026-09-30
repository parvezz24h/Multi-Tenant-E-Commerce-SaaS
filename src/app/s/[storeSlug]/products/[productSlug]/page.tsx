import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AddToCart } from "@/components/storefront/add-to-cart";
import { Price } from "@/components/storefront/price";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { formatMoney } from "@/lib/money";
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

  return (
    <div className="grid gap-12">
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
          </div>

          <p className={inStock ? "text-sm text-primary" : "text-sm text-destructive"}>
            {inStock
              ? product.stock <= 5
                ? `Only ${product.stock} left in stock`
                : "In stock"
              : "Sold out"}
          </p>

          <AddToCart
            storeId={store.id}
            productId={product.id}
            maxQuantity={Math.min(product.stock, MAX_QUANTITY_PER_ITEM)}
          />

          <ul className="grid gap-1 rounded-lg bg-muted/60 p-4 text-sm">
            <li>Cash on delivery available</li>
            <li>
              Delivery {formatMoney(store.deliveryChargeInsideDhaka)} inside Dhaka,{" "}
              {formatMoney(store.deliveryChargeOutsideDhaka)} outside Dhaka
            </li>
          </ul>

          {product.description && (
            <div className="grid gap-2">
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
