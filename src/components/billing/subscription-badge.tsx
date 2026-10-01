import { Badge } from "@/components/ui/badge";
import type { SubscriptionStatus } from "@/generated/prisma/enums";
import { SUBSCRIPTION_STATUS_LABELS } from "@/lib/subscription";
import { cn } from "@/lib/utils";

const STYLES: Record<SubscriptionStatus, string> = {
  TRIAL: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
  ACTIVE: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  PAST_DUE: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  SUSPENDED: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200",
  CANCELLED: "bg-muted text-muted-foreground",
};

export function SubscriptionBadge({ status }: { status: SubscriptionStatus }) {
  return (
    <Badge variant="secondary" className={cn("border-transparent", STYLES[status])}>
      {SUBSCRIPTION_STATUS_LABELS[status]}
    </Badge>
  );
}
