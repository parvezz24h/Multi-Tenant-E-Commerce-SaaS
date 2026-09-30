import { discountPercent, formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

type Props = {
  price: number;
  compareAtPrice?: number | null;
  className?: string;
  size?: "sm" | "lg";
};

export function Price({ price, compareAtPrice, className, size = "sm" }: Props) {
  const discount = discountPercent(price, compareAtPrice);
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2", className)}>
      <span className={cn("font-semibold tabular-nums", size === "lg" ? "text-2xl" : "text-base")}>
        {formatMoney(price)}
      </span>
      {discount !== null && (
        <>
          <span className="text-sm text-muted-foreground tabular-nums line-through">
            <span className="sr-only">Was </span>
            {formatMoney(compareAtPrice!)}
          </span>
          <span className="text-sm font-medium text-primary">{discount}% off</span>
        </>
      )}
    </div>
  );
}
