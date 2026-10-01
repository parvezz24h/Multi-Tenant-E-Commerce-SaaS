"use client";

import { startTransition, useActionState, useEffect } from "react";
import { toast } from "sonner";

import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addDomainAction } from "@/server/domains/actions";
import type { ActionState } from "@/server/errors";

export function AddDomainForm({ storeId }: { storeId: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    addDomainAction.bind(null, storeId),
    {},
  );
  const error = state.fieldErrors?.hostname?.[0] ?? (state.ok === false ? state.message : undefined);

  useEffect(() => {
    if (state.ok && state.message) toast.success(state.message);
  }, [state]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <form method="post" onSubmit={onSubmit} className="grid gap-4 sm:max-w-md">
      <FormField
        id="hostname"
        label="Your domain"
        errors={error ? [error] : undefined}
        hint="We recommend www.yourshop.com. Root domains like yourshop.com.bd also work."
      >
        <Input
          id="hostname"
          name="hostname"
          placeholder="www.yourshop.com"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          inputMode="url"
          required
          aria-invalid={!!error}
          aria-describedby="hostname-desc"
        />
      </FormField>
      <Button type="submit" disabled={pending} className="justify-self-start">
        {pending ? "Adding…" : "Connect domain"}
      </Button>
    </form>
  );
}
