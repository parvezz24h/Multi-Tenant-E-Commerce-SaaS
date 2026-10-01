"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ActionState } from "@/server/errors";

type Props = {
  label: React.ReactNode;
  confirmLabel: string;
  pendingLabel?: string;
  /** Returns action state; redirects thrown by the action are followed. */
  action: () => Promise<ActionState | void>;
  variant?: "outline" | "ghost" | "destructive";
  size?: "sm" | "default";
  "aria-label"?: string;
};

/** Destructive action with an inline two-step confirm (no browser dialogs). */
export function ConfirmButton({
  label,
  confirmLabel,
  pendingLabel = "Working…",
  action,
  variant = "outline",
  size = "sm",
  ...rest
}: Props) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      const result = await action();
      setConfirming(false);
      if (!result) return;
      if (result.ok && result.message) toast.success(result.message);
      else if (!result.ok) toast.error(result.message ?? "Something went wrong.");
    });
  }

  if (!confirming) {
    return (
      <Button variant={variant} size={size} onClick={() => setConfirming(true)} aria-label={rest["aria-label"]}>
        {label}
      </Button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      <Button variant="ghost" size={size} onClick={() => setConfirming(false)} disabled={pending}>
        Cancel
      </Button>
      <Button variant="destructive" size={size} onClick={run} disabled={pending}>
        {pending ? pendingLabel : confirmLabel}
      </Button>
    </span>
  );
}
