"use client";

import { startTransition, useActionState } from "react";

import { FormField } from "@/components/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackOrderAction } from "@/server/checkout/actions";
import type { ActionState } from "@/server/errors";

export function TrackOrderForm({ storeId }: { storeId: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    trackOrderAction.bind(null, storeId),
    {},
  );
  const errors = state.fieldErrors ?? {};

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <form method="post" onSubmit={onSubmit} className="grid gap-4" noValidate>
      {state.message && (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      <FormField id="orderNumber" label="Order number" errors={errors.orderNumber}>
        <Input
          id="orderNumber"
          name="orderNumber"
          inputMode="numeric"
          placeholder="e.g. 1001"
          required
          aria-invalid={!!errors.orderNumber}
          aria-describedby="orderNumber-desc"
        />
      </FormField>
      <FormField id="phone" label="Mobile number used for the order" errors={errors.phone}>
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="01XXXXXXXXX"
          required
          aria-invalid={!!errors.phone}
          aria-describedby="phone-desc"
        />
      </FormField>
      <Button type="submit" disabled={pending}>
        {pending ? "Looking up…" : "Track order"}
      </Button>
    </form>
  );
}
