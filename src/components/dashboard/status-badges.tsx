import { Badge } from "@/components/ui/badge";
import type { OrderStatus, PaymentStatus, ProductStatus } from "@/generated/prisma/enums";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/order-status";
import { cn } from "@/lib/utils";

const ORDER_STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  CONFIRMED: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
  PROCESSING: "bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200",
  SHIPPED: "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200",
  DELIVERED: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  CANCELLED: "bg-muted text-muted-foreground",
  RETURNED: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant="secondary" className={cn("border-transparent", ORDER_STYLES[status])}>
      {ORDER_STATUS_LABELS[status]}
    </Badge>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge variant={status === "PAID" ? "default" : "outline"}>{PAYMENT_STATUS_LABELS[status]}</Badge>
  );
}

const PRODUCT_LABELS: Record<ProductStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  ARCHIVED: "Archived",
};

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return (
    <Badge variant={status === "ACTIVE" ? "default" : status === "DRAFT" ? "secondary" : "outline"}>
      {PRODUCT_LABELS[status]}
    </Badge>
  );
}

export function StockLevel({ stock, low = 5 }: { stock: number; low?: number }) {
  return (
    <span
      className={cn(
        "tabular-nums",
        stock <= 0 ? "font-medium text-destructive" : stock <= low ? "font-medium text-amber-600" : undefined,
      )}
    >
      {stock <= 0 ? "Out of stock" : stock}
    </span>
  );
}
