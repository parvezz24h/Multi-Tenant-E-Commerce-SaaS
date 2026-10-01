import Link from "next/link";

import { Price } from "@/components/storefront/price";
import { ProductImage } from "@/components/storefront/product-image";
import { discountPercent } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { ThemeProductCardProps } from "@/themes/types";

export function ModernProductCard({ product }: ThemeProductCardProps) {
  const soldOut = product.stock <= 0;
  const image = product.images[0];
  const discount = discountPercent(product.price, product.compareAtPrice);

  return (
    <Link href={`/products/${product.slug}`} className="group flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-xl">
        <ProductImage
          url={image?.url}
          alt={image?.alt || product.name}
          className={cn(
            "rounded-xl transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100",
            soldOut && "opacity-60",
          )}
        />
        {soldOut ? (
          <span className="absolute top-2 left-2 rounded-full bg-foreground/85 px-2.5 py-1 text-xs font-medium text-background">
            Sold out
          </span>
        ) : (
          discount !== null && (
            <span className="absolute top-2 left-2 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
              −{discount}%
            </span>
          )
        )}
      </div>
      <div className="grid gap-1">
        <h3 className="line-clamp-2 text-sm font-medium group-hover:text-primary">{product.name}</h3>
        <Price price={product.price} compareAtPrice={product.compareAtPrice} hideDiscount />
      </div>
    </Link>
  );
}
