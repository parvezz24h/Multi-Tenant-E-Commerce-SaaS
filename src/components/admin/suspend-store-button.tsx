"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { setStoreSuspendedAction } from "@/server/admin/actions";

type Props = { storeId: string; storeName: string; suspended: boolean };

/** Two-step inline confirmation (no browser dialogs). */
export function SuspendStoreButton({ storeId, storeName, suspended }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      const result = await setStoreSuspendedAction(storeId, !suspended);
      setConfirming(false);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message ?? "Something went wrong.");
    });
  }

  if (suspended) {
    return (
      <Button size="sm" variant="outline" onClick={run} disabled={pending}>
        {pending ? "Reinstating…" : "Reinstate"}
      </Button>
    );
  }

  if (!confirming) {
    return (
      <Button size="sm" variant="outline" onClick={() => setConfirming(true)}>
        Suspend
      </Button>
    );
  }

  return (
    <div className="inline-flex items-center gap-2">
      <Button size="sm" variant="ghost" onClick={() => setConfirming(false)} disabled={pending}>
        Cancel
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={run}
        disabled={pending}
        aria-label={`Confirm suspending ${storeName}`}
      >
        {pending ? "Suspending…" : "Confirm suspend"}
      </Button>
    </div>
  );
}
