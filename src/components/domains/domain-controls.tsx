"use client";

import { Check, Copy, RefreshCw } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { ConfirmButton } from "@/components/dashboard/confirm-button";
import { Button } from "@/components/ui/button";
import { checkDomainAction, removeDomainAction } from "@/server/domains/actions";

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy. Select the text and copy it manually.");
    }
  }

  return (
    <Button type="button" variant="ghost" size="icon-sm" onClick={copy} aria-label={`Copy ${label}`}>
      {copied ? <Check /> : <Copy />}
    </Button>
  );
}

export function DomainActions({ storeId, hostname, active }: { storeId: string; hostname: string; active: boolean }) {
  const [pending, startTransition] = useTransition();

  function check() {
    startTransition(async () => {
      const result = await checkDomainAction(storeId);
      if (result.ok) toast.success(result.message);
      else toast.message(result.message ?? "Not connected yet.");
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant={active ? "outline" : "default"} onClick={check} disabled={pending}>
        <RefreshCw className={pending ? "animate-spin" : undefined} />
        {pending ? "Checking…" : active ? "Re-check" : "Check now"}
      </Button>
      <ConfirmButton
        label="Remove domain"
        confirmLabel={`Remove ${hostname}`}
        pendingLabel="Removing…"
        size="default"
        action={() => removeDomainAction(storeId)}
      />
    </div>
  );
}
