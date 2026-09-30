"use client";

import { useState } from "react";

import { ProductImage } from "@/components/storefront/product-image";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  images: { id: string; url: string; alt: string | null }[];
};

export function ProductGallery({ name, images }: Props) {
  const [index, setIndex] = useState(0);
  const current = images[index];

  return (
    <div className="grid gap-3">
      <ProductImage
        url={current?.url}
        alt={current?.alt || name}
        sizes="(min-width: 768px) 50vw, 100vw"
        priority
      />
      {images.length > 1 && (
        <ul className="grid grid-cols-5 gap-2">
          {images.map((image, i) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show image ${i + 1} of ${images.length}`}
                aria-current={i === index ? "true" : undefined}
                className={cn(
                  "block w-full rounded-lg ring-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  i === index && "ring-2 ring-primary",
                )}
              >
                <ProductImage url={image.url} alt="" sizes="10vw" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
