import Link from "next/link";

import { Price } from "@/components/storefront/price";
import { ProductImage } from "@/components/storefront/product-image";
import type { ThemeProductCardProps } from "@/themes/types";

export function ModernProductCard({ product }: ThemeProductCardProps) {
  const soldOut = product.stock <= 0;
  const image = product.images[0];

  return (
    <Link href={`/products/${product.slug}`} className="group flex flex-col gap-2">
      <div className="relative">
        <ProductImage
          url={image?.url}
          alt={image?.alt || product.name}
          className="transition-opacity group-hover:opacity-90"
        />
        {soldOut && (
          <span className="absolute top-2 left-2 rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium">
            Sold out
          </span>
        )}
      </div>
      <div className="grid gap-0.5">
        <h3 className="line-clamp-2 text-sm font-medium group-hover:underline">{product.name}</h3>
        <Price price={product.price} compareAtPrice={product.compareAtPrice} />
      </div>
    </Link>
  );
}
