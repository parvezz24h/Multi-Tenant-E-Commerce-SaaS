import type { InventoryReason } from "@/generated/prisma/enums";

export const REASON_LABELS: Record<InventoryReason, string> = {
  INITIAL: "Initial stock",
  RESTOCK: "Restocked",
  CORRECTION: "Correction",
  DAMAGED: "Damaged or lost",
  ORDER_PLACED: "Order placed",
  ORDER_CANCELLED: "Order cancelled",
  ORDER_RETURNED: "Order returned",
};
