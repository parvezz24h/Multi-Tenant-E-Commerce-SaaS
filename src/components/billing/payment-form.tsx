"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { ConfirmButton } from "@/components/dashboard/confirm-button";
import { CopyButton } from "@/components/domains/domain-controls";
import { FormField } from "@/components/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { cancelInvoiceAction, submitPaymentAction } from "@/server/billing/actions";
import type { ActionState } from "@/server/errors";

type Method = "BKASH" | "NAGAD" | "BANK";

type Props = {
  storeId: string;
  invoice: { id: string; number: string; amount: number; planName: string; periodMonths: number };
  instructions: { bkash: string | null; nagad: string | null; bank: string | null };
};

export function PaymentForm({ storeId, invoice, instructions }: Props) {
  const methods = (
    [
      { value: "BKASH", label: "bKash", detail: instructions.bkash },
      { value: "NAGAD", label: "Nagad", detail: instructions.nagad },
      { value: "BANK", label: "Bank transfer", detail: instructions.bank },
    ] as { value: Method; label: string; detail: string | null }[]
  ).filter((m) => m.detail);

  const [method, setMethod] = useState<Method | undefined>(methods[0]?.value);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    submitPaymentAction.bind(null, storeId, invoice.id),
    {},
  );
  const errors = state.fieldErrors ?? {};
  const selected = methods.find((m) => m.value === method);

  useEffect(() => {
    if (state.ok) toast.success(state.message);
  }, [state]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  if (methods.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          Online payment details aren&apos;t set up yet. Please contact support to pay invoice {invoice.number}.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-5">
      <ol className="grid gap-3 text-sm">
        <li>
          <span className="font-medium">1. Send {formatMoney(invoice.amount)}</span> for {invoice.planName} (
          {invoice.periodMonths} {invoice.periodMonths === 1 ? "month" : "months"}).
        </li>
        <li className="grid gap-2">
          <span className="font-medium">2. Choose how you’ll pay:</span>
          <div role="radiogroup" aria-label="Payment method" className="flex flex-wrap gap-2">
            {methods.map((m) => (
              <button
                key={m.value}
                type="button"
                role="radio"
                aria-checked={method === m.value}
                onClick={() => setMethod(m.value)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm",
                  method === m.value ? "border-primary bg-primary/10 font-medium" : "hover:bg-muted",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
          {selected && (
            <div className="flex items-start gap-2 rounded-lg bg-muted/60 p-3">
              <p className="flex-1 font-mono text-sm whitespace-pre-line">{selected.detail}</p>
              <CopyButton value={selected.detail!} label={`${selected.label} details`} />
            </div>
          )}
          {method !== "BANK" && (
            <p className="text-muted-foreground">
              Use “Send money” (not “Payment”) and write <span className="font-mono">{invoice.number}</span> as the
              reference if your app asks for one.
            </p>
          )}
        </li>
        <li className="font-medium">3. Enter the transaction details below.</li>
      </ol>

      <form method="post" onSubmit={onSubmit} className="grid gap-4 sm:max-w-md">
        {state.ok === false && state.message && (
          <Alert variant="destructive">
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}
        <input type="hidden" name="method" value={method ?? ""} />
        <FormField
          id="payerAccount"
          label={method === "BANK" ? "Your bank account name / number" : "Number you sent from"}
          errors={errors.payerAccount}
        >
          <Input
            id="payerAccount"
            name="payerAccount"
            inputMode={method === "BANK" ? "text" : "tel"}
            placeholder={method === "BANK" ? "" : "01XXXXXXXXX"}
            required
            maxLength={40}
            aria-invalid={!!errors.payerAccount}
            aria-describedby="payerAccount-desc"
          />
        </FormField>
        <FormField id="reference" label="Transaction ID" errors={errors.reference ?? errors.method}>
          <Input
            id="reference"
            name="reference"
            placeholder="e.g. 9K7A2BXQ4M"
            autoCapitalize="characters"
            spellCheck={false}
            required
            maxLength={40}
            aria-invalid={!!errors.reference}
            aria-describedby="reference-desc"
          />
        </FormField>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={pending || !method}>
            {pending ? "Submitting…" : "I've paid — submit"}
          </Button>
          <ConfirmButton
            label="Cancel invoice"
            confirmLabel="Cancel invoice"
            pendingLabel="Cancelling…"
            variant="ghost"
            size="default"
            action={() => cancelInvoiceAction(storeId, invoice.id)}
          />
        </div>
      </form>
    </div>
  );
}
