import Image from "next/image";

import { cn } from "@/lib/utils";

type Props = {
  url: string | null | undefined;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

/**
 * Square product image. Merchant images can come from any host, so they
 * skip Next's optimizer; uploads via R2 (Phase 3) can switch to a loader.
 */
export function ProductImage({ url, alt, className, sizes, priority }: Props) {
  return (
    <div className={cn("@container relative aspect-square overflow-hidden rounded-lg bg-muted", className)}>
      {url ? (
        <Image
          src={url}
          alt={alt}
          fill
          unoptimized
          priority={priority}
          sizes={sizes ?? "(min-width: 1024px) 25vw, 50vw"}
          className="object-cover"
        />
      ) : (
        <div
          aria-hidden
          className="flex size-full items-center justify-center bg-gradient-to-br from-primary/15 to-primary/5 text-[40cqw] font-semibold text-primary/60"
        >
          {alt.trim().charAt(0).toUpperCase() || "?"}
        </div>
      )}
    </div>
  );
}
