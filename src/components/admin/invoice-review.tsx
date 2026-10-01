"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { reviewInvoiceAction } from "@/server/billing/actions";

/** Approve or reject a submitted payment, with an optional note. */
export function InvoiceReview({ invoiceId, label }: { invoiceId: string; label: string }) {
  const [note, setNote] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [pending, startTransition] = useTransition();

  function decide(decision: "paid" | "void") {
    startTransition(async () => {
      const result = await reviewInvoiceAction(invoiceId, decision, note);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message ?? "Something went wrong.");
    });
  }

  if (rejecting) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <label className="sr-only" htmlFor={`note-${invoiceId}`}>
          Reason for rejecting {label}
        </label>
        <Input
          id={`note-${invoiceId}`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Reason (shown to merchant)"
          maxLength={300}
          className="h-8 w-56"
        />
        <Button size="sm" variant="destructive" disabled={pending} onClick={() => decide("void")}>
          Reject
        </Button>
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => setRejecting(false)}>
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button size="sm" disabled={pending} onClick={() => decide("paid")} aria-label={`Mark ${label} paid`}>
        {pending ? "Saving…" : "Mark paid"}
      </Button>
      <Button size="sm" variant="outline" disabled={pending} onClick={() => setRejecting(true)}>
        Reject
      </Button>
    </div>
  );
}
