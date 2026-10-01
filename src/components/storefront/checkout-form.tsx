"use client";

import { Banknote } from "lucide-react";
import { startTransition, useActionState, useState } from "react";

import { FormField } from "@/components/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { deliveryChargeFor } from "@/lib/delivery";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { placeOrderAction } from "@/server/checkout/actions";
import type { ActionState } from "@/server/errors";

type Line = { productId: string; name: string; quantity: number; lineTotal: number };

type Props = {
  storeId: string;
  districts: readonly string[];
  rates: { deliveryChargeInsideDhaka: number; deliveryChargeOutsideDhaka: number };
  lines: Line[];
  subtotal: number;
};

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive";

export function CheckoutForm({ storeId, districts, rates, lines, subtotal }: Props) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    placeOrderAction.bind(null, storeId),
    {},
  );
  const [district, setDistrict] = useState("");
  const errors = state.fieldErrors ?? {};
  const delivery = district ? deliveryChargeFor(district, rates) : null;

  // Submit manually so React doesn't reset the form (and lose input) on errors.
  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  const field = (name: string) => ({
    id: name,
    name,
    "aria-invalid": !!errors[name],
    "aria-describedby": `${name}-desc`,
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[1fr_22rem]" noValidate>
      <div className="grid content-start gap-6">
        {state.ok === false && state.message && (
          <Alert variant="destructive">
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}

        <fieldset className="grid gap-4">
          <legend className="mb-2 text-lg font-semibold">Contact</legend>
          <FormField id="name" label="Full name" errors={errors.name}>
            <Input {...field("name")} autoComplete="name" required maxLength={80} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="phone"
              label="Mobile number"
              errors={errors.phone}
              hint="We'll call to confirm your order."
            >
              <Input
                {...field("phone")}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="01XXXXXXXXX"
                required
              />
            </FormField>
            <FormField id="email" label="Email (optional)" errors={errors.email}>
              <Input {...field("email")} type="email" autoComplete="email" />
            </FormField>
          </div>
        </fieldset>

        <fieldset className="grid gap-4">
          <legend className="mb-2 text-lg font-semibold">Delivery address</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="district" label="District" errors={errors.district}>
              <select
                {...field("district")}
                required
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className={cn(selectClass, !district && "text-muted-foreground")}
              >
                <option value="" disabled>
                  Select district
                </option>
                {districts.map((d) => (
                  <option key={d} value={d} className="text-foreground">
                    {d}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField id="upazila" label="Upazila / Thana" errors={errors.upazila}>
              <Input {...field("upazila")} required maxLength={60} placeholder="e.g. Mirpur" />
            </FormField>
            <FormField id="area" label="Area (optional)" errors={errors.area}>
              <Input {...field("area")} maxLength={60} placeholder="e.g. Section 10" />
            </FormField>
            <FormField id="postalCode" label="Postal code (optional)" errors={errors.postalCode}>
              <Input {...field("postalCode")} inputMode="numeric" maxLength={4} autoComplete="postal-code" />
            </FormField>
          </div>
          <FormField id="addressLine" label="House, road, flat" errors={errors.addressLine}>
            <Input
              {...field("addressLine")}
              required
              maxLength={200}
              autoComplete="street-address"
              placeholder="e.g. House 14, Road 3, Flat 4B"
            />
          </FormField>
          <FormField id="note" label="Note for the seller (optional)" errors={errors.note}>
            <Textarea {...field("note")} rows={2} maxLength={300} placeholder="e.g. Call before delivery" />
          </FormField>
        </fieldset>

        <fieldset className="grid gap-2">
          <legend className="mb-2 text-lg font-semibold">Payment</legend>
          <label className="flex items-center gap-3 rounded-lg border border-primary bg-primary/5 p-4">
            <input type="radio" name="paymentMethod" value="COD" defaultChecked className="accent-primary" />
            <Banknote className="size-5 text-primary" aria-hidden />
            <span>
              <span className="block font-medium">Cash on delivery</span>
              <span className="block text-sm text-muted-foreground">Pay when you receive your order.</span>
            </span>
          </label>
        </fieldset>
      </div>

      <aside className="grid content-start gap-4 rounded-xl border p-5 lg:sticky lg:top-28" aria-labelledby="summary">
        <h2 id="summary" className="font-semibold">
          Order summary
        </h2>
        <ul className="grid gap-2 text-sm">
          {lines.map((l) => (
            <li key={l.productId} className="flex justify-between gap-3">
              <span className="min-w-0">
                <span className="line-clamp-2">{l.name}</span>
                <span className="text-muted-foreground">× {l.quantity}</span>
              </span>
              <span className="shrink-0 tabular-nums">{formatMoney(l.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="grid gap-2 border-t pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="tabular-nums">{formatMoney(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Delivery</dt>
            <dd className="tabular-nums">{delivery === null ? "Select district" : formatMoney(delivery)}</dd>
          </div>
          <div className="flex justify-between border-t pt-2 text-base font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatMoney(subtotal + (delivery ?? 0))}</dd>
          </div>
        </dl>
        <Button type="submit" size="lg" disabled={pending} className="w-full">
          {pending ? "Placing order…" : "Place order"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          You&apos;ll pay {formatMoney(subtotal + (delivery ?? 0))} in cash on delivery.
        </p>
      </aside>
    </form>
  );
}
