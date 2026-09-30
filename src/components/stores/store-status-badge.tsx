import { Badge } from "@/components/ui/badge";
import type { StoreStatus } from "@/generated/prisma/enums";

const LABELS: Record<StoreStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Live",
  SUSPENDED: "Suspended",
};

const VARIANTS = {
  DRAFT: "secondary",
  ACTIVE: "default",
  SUSPENDED: "destructive",
} as const satisfies Record<StoreStatus, string>;

export function StoreStatusBadge({ status }: { status: StoreStatus }) {
  return <Badge variant={VARIANTS[status]}>{LABELS[status]}</Badge>;
}
