"use client";

import { startTransition, useActionState, useEffect } from "react";
import { toast } from "sonner";

import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateCustomerAction } from "@/server/customers/actions";
import type { ActionState } from "@/server/errors";

type Props = {
  storeId: string;
  customerId: string;
  defaults: { name: string; email: string; note: string };
};

export function CustomerForm({ storeId, customerId, defaults }: Props) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateCustomerAction.bind(null, storeId, customerId),
    {},
  );
  const errors = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.ok) toast.success(state.message);
    else if (state.ok === false && state.message) toast.error(state.message);
  }, [state]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <FormField id="name" label="Name" errors={errors.name}>
        <Input id="name" name="name" defaultValue={defaults.name} required maxLength={80} />
      </FormField>
      <FormField id="email" label="Email" errors={errors.email}>
        <Input id="email" name="email" type="email" defaultValue={defaults.email} />
      </FormField>
      <FormField id="note" label="Note" errors={errors.note} hint="Only your team can see this.">
        <Textarea id="note" name="note" rows={3} maxLength={1000} defaultValue={defaults.note} aria-describedby="note-desc" />
      </FormField>
      <Button type="submit" variant="outline" disabled={pending} className="justify-self-start">
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
