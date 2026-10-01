import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

/** The cart-"S" mark from the ShopCreatorBD logo (public/logo-mark.png). */
export function BrandMark({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/logo-mark.png"
      alt=""
      width={256}
      height={256}
      priority={priority}
      className={cn("size-8 shrink-0", className)}
    />
  );
}

/** "ShopCreator" + orange "BD", matching the logo's wordmark but as live text. */
export function BrandName({ className, accentClassName }: { className?: string; accentClassName?: string }) {
  return (
    <span className={cn("font-semibold tracking-tight", className)}>
      ShopCreator<span className={cn("text-primary", accentClassName)}>BD</span>
    </span>
  );
}

/** Mark + name, linking home. Used in headers and footers. */
export function BrandLogo({
  href = "/",
  className,
  markClassName,
  priority,
}: {
  href?: string;
  className?: string;
  markClassName?: string;
  priority?: boolean;
}) {
  return (
    <Link href={href} className={cn("flex items-center gap-2", className)} aria-label="ShopCreatorBD home">
      <BrandMark className={markClassName} priority={priority} />
      <BrandName />
    </Link>
  );
}
