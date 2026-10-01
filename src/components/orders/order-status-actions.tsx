"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OrderStatus } from "@/generated/prisma/enums";
import { ORDER_ACTION_LABELS, ORDER_TRANSITIONS, RESTOCKING_STATUSES } from "@/lib/order-status";
import { updateOrderStatusAction } from "@/server/orders/actions";

type Props = { storeId: string; orderId: string; status: OrderStatus };

export function OrderStatusActions({ storeId, orderId, status }: Props) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<OrderStatus | null>(null);
  const [note, setNote] = useState("");
  const next = ORDER_TRANSITIONS[status];

  if (next.length === 0) {
    return <p className="text-sm text-muted-foreground">This order is closed. No further changes.</p>;
  }

  function apply(to: OrderStatus) {
    startTransition(async () => {
      const result = await updateOrderStatusAction(storeId, orderId, to, note);
      if (result.ok) {
        toast.success(result.message);
        setConfirming(null);
        setNote("");
      } else {
        toast.error(result.message ?? "Couldn't update the order.");
      }
    });
  }

  if (confirming) {
    const restocks = RESTOCKING_STATUSES.has(confirming);
    return (
      <div className="grid gap-3 rounded-lg border p-3">
        <p className="text-sm">
          {ORDER_ACTION_LABELS[confirming]}?{" "}
          {restocks && <span className="text-muted-foreground">Items will be added back to stock.</span>}
        </p>
        <div className="grid gap-2">
          <Label htmlFor="status-note">Reason (optional)</Label>
          <Input id="status-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} />
        </div>
        <div className="flex gap-2">
          <Button variant="destructive" onClick={() => apply(confirming)} disabled={pending}>
            {pending ? "Saving…" : ORDER_ACTION_LABELS[confirming]}
          </Button>
          <Button variant="ghost" onClick={() => setConfirming(null)} disabled={pending}>
            Back
          </Button>
        </div>
      </div>
    );
  }

  // The first non-restocking step is the main action; cancel/return need a confirm.
  const primary = next.find((to) => !RESTOCKING_STATUSES.has(to));
  return (
    <div className="flex flex-wrap gap-2">
      {next.map((to) => {
        const restocks = RESTOCKING_STATUSES.has(to);
        return (
          <Button
            key={to}
            variant={to === primary ? "default" : "outline"}
            onClick={() => (restocks ? setConfirming(to) : apply(to))}
            disabled={pending}
          >
            {pending && to === primary ? "Saving…" : ORDER_ACTION_LABELS[to]}
          </Button>
        );
      })}
    </div>
  );
}
