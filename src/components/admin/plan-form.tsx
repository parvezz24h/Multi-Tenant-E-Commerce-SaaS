"use client";

import { startTransition, useActionState, useEffect } from "react";
import { toast } from "sonner";

import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePlanAction } from "@/server/billing/actions";
import type { ActionState } from "@/server/errors";

type Props = {
  plan: {
    id: string;
    key: string;
    name: string;
    description: string;
    price: string;
    maxProducts: string;
    maxStaff: string;
    customDomain: boolean;
    isActive: boolean;
  };
};

export function PlanForm({ plan }: Props) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updatePlanAction.bind(null, plan.id),
    {},
  );
  const errors = state.fieldErrors ?? {};
  const id = (f: string) => `${plan.key}-${f}`;

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
    <form method="post" onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id={id("name")} label="Name" errors={errors.name}>
          <Input id={id("name")} name="name" defaultValue={plan.name} required maxLength={40} />
        </FormField>
        <FormField id={id("priceMonthly")} label="Price per month (৳)" errors={errors.priceMonthly}>
          <Input id={id("priceMonthly")} name="priceMonthly" defaultValue={plan.price} inputMode="decimal" required />
        </FormField>
      </div>
      <FormField id={id("description")} label="Description" errors={errors.description}>
        <Input id={id("description")} name="description" defaultValue={plan.description} maxLength={200} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id={id("maxProducts")} label="Max products" errors={errors.maxProducts} hint="Empty = unlimited">
          <Input
            id={id("maxProducts")}
            name="maxProducts"
            defaultValue={plan.maxProducts}
            inputMode="numeric"
            aria-describedby={`${id("maxProducts")}-desc`}
          />
        </FormField>
        <FormField id={id("maxStaff")} label="Max team members" errors={errors.maxStaff} hint="Empty = unlimited">
          <Input
            id={id("maxStaff")}
            name="maxStaff"
            defaultValue={plan.maxStaff}
            inputMode="numeric"
            aria-describedby={`${id("maxStaff")}-desc`}
          />
        </FormField>
      </div>
      <div className="flex flex-wrap gap-6">
        <div className="flex items-center gap-2">
          <Checkbox id={id("customDomain")} name="customDomain" defaultChecked={plan.customDomain} />
          <Label htmlFor={id("customDomain")}>Custom domain</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id={id("isActive")} name="isActive" defaultChecked={plan.isActive} />
          <Label htmlFor={id("isActive")}>Available to merchants</Label>
        </div>
      </div>
      <Button type="submit" disabled={pending} className="justify-self-start">
        {pending ? "Saving…" : "Save plan"}
      </Button>
    </form>
  );
}
