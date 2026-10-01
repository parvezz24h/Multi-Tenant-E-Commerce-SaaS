import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/datetime";
import {
  daysUntil,
  periodEndsAt,
  RENEWAL_WARNING_DAYS,
  suspendsAt,
} from "@/lib/subscription";
import type { StoreSubscription } from "@/server/billing/service";

/**
 * Dashboard-wide notice when the subscription needs attention. Renders
 * nothing while everything is fine.
 */
export function SubscriptionBanner({
  subscription,
  billingHref,
}: {
  subscription: StoreSubscription;
  /** Null for staff who can't manage billing. */
  billingHref: string | null;
}) {
  const endsAt = periodEndsAt(subscription);
  const daysLeft = daysUntil(endsAt);
  const action = billingHref && (
    <Button asChild size="sm" className="mt-2">
      <Link href={billingHref}>Choose a plan &amp; pay</Link>
    </Button>
  );
  const askOwner = !billingHref && " Ask the store owner to renew the subscription.";

  switch (subscription.status) {
    case "TRIAL":
    case "ACTIVE": {
      if (subscription.cancelAtPeriodEnd && endsAt) {
        return (
          <Alert className="mb-6">
            <AlertTitle>Your subscription ends on {formatDate(endsAt)}</AlertTitle>
            <AlertDescription>
              <span>Your store will go offline after that.{askOwner}</span>
              {action}
            </AlertDescription>
          </Alert>
        );
      }
      if (daysLeft > RENEWAL_WARNING_DAYS) return null;
      return (
        <Alert className="mb-6">
          <AlertTitle>
            {subscription.status === "TRIAL" ? "Your free trial" : "Your plan"} ends{" "}
            {daysLeft <= 1 ? "within a day" : `in ${daysLeft} days`}
          </AlertTitle>
          <AlertDescription>
            <span>Pay now to keep your store online without interruption.{askOwner}</span>
            {action}
          </AlertDescription>
        </Alert>
      );
    }
    case "PAST_DUE": {
      const offline = suspendsAt(subscription);
      return (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Payment overdue</AlertTitle>
          <AlertDescription>
            <span>
              Your store goes offline{offline ? ` on ${formatDate(offline)}` : " soon"} unless the subscription
              is paid.{askOwner}
            </span>
            {action}
          </AlertDescription>
        </Alert>
      );
    }
    case "SUSPENDED":
    case "CANCELLED":
      return (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Your store is offline</AlertTitle>
          <AlertDescription>
            <span>
              {subscription.status === "CANCELLED"
                ? "The subscription was cancelled."
                : "The subscription wasn't paid."}{" "}
              Customers can&apos;t see your store and you can&apos;t add products until you pay.{askOwner}
            </span>
            {action}
          </AlertDescription>
        </Alert>
      );
  }
}
