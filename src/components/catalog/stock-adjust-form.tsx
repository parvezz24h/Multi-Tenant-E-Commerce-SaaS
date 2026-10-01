"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { adjustStockAction } from "@/server/catalog/actions";
import type { ActionState } from "@/server/errors";

type Mode = "add" | "remove" | "set";

const MODES: { value: Mode; label: string }[] = [
  { value: "add", label: "Add" },
  { value: "remove", label: "Remove" },
  { value: "set", label: "Set to" },
];

const REASONS = [
  { value: "RESTOCK", label: "New stock received" },
  { value: "CORRECTION", label: "Stock count correction" },
  { value: "DAMAGED", label: "Damaged or lost" },
];

type Props = {
  storeId: string;
  productId: string;
  currentStock: number;
  /** Prefix for element ids when several forms are on one page. */
  idPrefix?: string;
  onDone?: () => void;
};

export function StockAdjustForm({ storeId, productId, currentStock, idPrefix = "stock", onDone }: Props) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    adjustStockAction.bind(null, storeId, productId),
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [mode, setMode] = useState<Mode>("add");
  const [reason, setReason] = useState("RESTOCK");
  const errors = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Stock updated.");
      formRef.current?.reset();
      onDone?.();
    } else if (state.ok === false && state.message) {
      toast.error(state.message);
    }
  }, [state, onDone]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  const qtyId = `${idPrefix}-quantity`;
  const noteId = `${idPrefix}-note`;
  const reasonId = `${idPrefix}-reason`;

  return (
    <form ref={formRef} onSubmit={onSubmit} className="grid gap-4">
      <p className="text-sm">
        Current stock: <span className="font-medium tabular-nums">{currentStock}</span>
      </p>
      <input type="hidden" name="mode" value={mode} />
      <div role="radiogroup" aria-label="Adjustment type" className="inline-flex rounded-lg border p-0.5">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            role="radio"
            aria-checked={mode === m.value}
            onClick={() => {
              setMode(m.value);
              setReason(m.value === "remove" ? "DAMAGED" : m.value === "set" ? "CORRECTION" : "RESTOCK");
            }}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-sm",
              mode === m.value ? "bg-muted font-medium" : "text-muted-foreground",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
      <FormField id={qtyId} label={mode === "set" ? "New stock" : "Quantity"} errors={errors.quantity}>
        <Input
          id={qtyId}
          name="quantity"
          inputMode="numeric"
          required
          aria-invalid={!!errors.quantity}
          aria-describedby={`${qtyId}-desc`}
        />
      </FormField>
      <FormField id={reasonId} label="Reason" errors={errors.reason}>
        <input type="hidden" name="reason" value={reason} />
        <Select value={reason} onValueChange={setReason}>
          <SelectTrigger id={reasonId} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REASONS.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField id={noteId} label="Note (optional)" errors={errors.note}>
        <Input id={noteId} name="note" maxLength={200} />
      </FormField>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Update stock"}
      </Button>
    </form>
  );
}
