"use client";

import { startTransition, useActionState, useEffect } from "react";
import { toast } from "sonner";

import { FormField } from "@/components/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { siteConfig } from "@/lib/site";
import { updateStoreAction } from "@/server/stores/actions";
import { SLUG_MAX } from "@/server/stores/schemas";

type Defaults = {
  name: string;
  slug: string;
  description: string;
  logoUrl: string;
  contactEmail: string;
  contactPhone: string;
  addressLine: string;
  district: string;
  deliveryChargeInsideDhaka: string;
  deliveryChargeOutsideDhaka: string;
};

type Props = {
  storeId: string;
  districts: readonly string[];
  defaults: Defaults;
};

export function StoreSettingsForm({ storeId, districts, defaults }: Props) {
  const [state, formAction, pending] = useActionState(
    updateStoreAction.bind(null, storeId),
    {},
  );
  const errors = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.ok && state.message) toast.success(state.message);
  }, [state]);

  // Submit manually so React doesn't reset the form (and lose input) on errors.
  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  const field = (name: keyof Defaults) => ({
    id: name,
    name,
    defaultValue: defaults[name],
    "aria-invalid": !!errors[name],
    "aria-describedby": `${name}-desc`,
  });

  return (
    <form method="post" onSubmit={onSubmit} className="grid gap-6">
      {state.ok === false && state.message && (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>How your store appears to customers.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <FormField id="name" label="Store name" errors={errors.name}>
            <Input {...field("name")} required maxLength={80} />
          </FormField>
          <FormField
            id="slug"
            label="Store address"
            errors={errors.slug}
            hint={`Your store lives at <address>.${siteConfig.rootDomain}. Changing it breaks old links.`}
          >
            <Input
              {...field("slug")}
              required
              maxLength={SLUG_MAX}
              autoCapitalize="none"
              spellCheck={false}
            />
          </FormField>
          <FormField id="description" label="Description" errors={errors.description}>
            <Textarea {...field("description")} rows={3} maxLength={500} />
          </FormField>
          <FormField
            id="logoUrl"
            label="Logo URL"
            errors={errors.logoUrl}
            hint="Image uploads are coming soon. For now, paste an https:// link."
          >
            <Input {...field("logoUrl")} type="url" placeholder="https://" />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact &amp; address</CardTitle>
          <CardDescription>Shown on your storefront and used for deliveries.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField id="contactPhone" label="Phone" errors={errors.contactPhone}>
            <Input
              {...field("contactPhone")}
              type="tel"
              inputMode="tel"
              placeholder="01XXXXXXXXX"
              autoComplete="tel"
            />
          </FormField>
          <FormField id="contactEmail" label="Email" errors={errors.contactEmail}>
            <Input {...field("contactEmail")} type="email" autoComplete="email" />
          </FormField>
          <div className="sm:col-span-2">
            <FormField id="addressLine" label="Address" errors={errors.addressLine}>
              <Input {...field("addressLine")} maxLength={200} autoComplete="street-address" />
            </FormField>
          </div>
          <FormField id="district" label="District" errors={errors.district}>
            <Select name="district" defaultValue={defaults.district || undefined}>
              <SelectTrigger
                id="district"
                className="w-full"
                aria-invalid={!!errors.district}
                aria-describedby="district-desc"
              >
                <SelectValue placeholder="Select a district" />
              </SelectTrigger>
              <SelectContent>
                {districts.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delivery charges</CardTitle>
          <CardDescription>Added to each order at checkout, in taka.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="deliveryChargeInsideDhaka"
            label="Inside Dhaka (৳)"
            errors={errors.deliveryChargeInsideDhaka}
          >
            <Input {...field("deliveryChargeInsideDhaka")} inputMode="decimal" required />
          </FormField>
          <FormField
            id="deliveryChargeOutsideDhaka"
            label="Outside Dhaka (৳)"
            errors={errors.deliveryChargeOutsideDhaka}
          >
            <Input {...field("deliveryChargeOutsideDhaka")} inputMode="decimal" required />
          </FormField>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
