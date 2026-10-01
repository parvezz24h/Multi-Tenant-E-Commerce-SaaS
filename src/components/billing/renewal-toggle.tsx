"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { ConfirmButton } from "@/components/dashboard/confirm-button";
import { Button } from "@/components/ui/button";
import { setCancelAtPeriodEndAction } from "@/server/billing/actions";

export function RenewalToggle({ storeId, cancelling }: { storeId: string; cancelling: boolean }) {
  const [pending, startTransition] = useTransition();

  if (cancelling) {
    return (
      <Button
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await setCancelAtPeriodEndAction(storeId, false);
            if (result.ok) toast.success(result.message);
            else toast.error(result.message ?? "Something went wrong.");
          })
        }
      >
        Keep my subscription
      </Button>
    );
  }

  return (
    <ConfirmButton
      label="Cancel subscription"
      confirmLabel="Yes, cancel at period end"
      pendingLabel="Cancelling…"
      variant="ghost"
      size="default"
      action={() => setCancelAtPeriodEndAction(storeId, true)}
    />
  );
}
