"use client";

import { startTransition, useActionState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState } from "@/server/errors";
import { updateMerchantNoteAction } from "@/server/orders/actions";

export function MerchantNoteForm({
  storeId,
  orderId,
  defaultValue,
}: {
  storeId: string;
  orderId: string;
  defaultValue: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateMerchantNoteAction.bind(null, storeId, orderId),
    {},
  );

  useEffect(() => {
    if (state.ok) toast.success(state.message);
    else if (state.ok === false) toast.error(state.fieldErrors?.note?.[0] ?? state.message ?? "Couldn't save.");
  }, [state]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <form method="post" onSubmit={onSubmit} className="grid gap-2">
      <label htmlFor="merchant-note" className="sr-only">
        Internal note
      </label>
      <Textarea
        id="merchant-note"
        name="note"
        rows={3}
        maxLength={1000}
        defaultValue={defaultValue}
        placeholder="Only your team can see this."
      />
      <Button type="submit" variant="outline" size="sm" disabled={pending} className="justify-self-start">
        {pending ? "Saving…" : "Save note"}
      </Button>
    </form>
  );
}
