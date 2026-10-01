import type { OrderStatus, PaymentStatus } from "@/generated/prisma/enums";

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
] as const satisfies readonly OrderStatus[];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "Unpaid",
  PAID: "Paid",
  REFUNDED: "Refunded",
};

/**
 * Allowed status changes. The happy path is
 * PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED.
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "RETURNED"],
  DELIVERED: ["RETURNED"],
  CANCELLED: [],
  RETURNED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus) {
  return ORDER_TRANSITIONS[from].includes(to);
}

/** Statuses that put the order's items back into stock. */
export const RESTOCKING_STATUSES: ReadonlySet<OrderStatus> = new Set(["CANCELLED", "RETURNED"]);

/** Orders that still need the merchant to act. */
export const OPEN_ORDER_STATUSES: readonly OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING"];

/** Verb for the button that moves an order into `status`. */
export const ORDER_ACTION_LABELS: Record<OrderStatus, string> = {
  PENDING: "Mark pending",
  CONFIRMED: "Confirm order",
  PROCESSING: "Start processing",
  SHIPPED: "Mark as shipped",
  DELIVERED: "Mark as delivered",
  CANCELLED: "Cancel order",
  RETURNED: "Mark as returned",
};
