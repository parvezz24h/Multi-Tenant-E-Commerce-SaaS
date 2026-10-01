"use client";

import { Check } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { createInvoiceAction, switchTrialPlanAction } from "@/server/billing/actions";

export type PlanCard = {
  key: string;
  name: string;
  description: string | null;
  priceMonthly: number;
  maxProducts: number | null;
  maxStaff: number | null;
  customDomain: boolean;
};

type Props = {
  storeId: string;
  plans: PlanCard[];
  currentPlanKey: string;
  inTrial: boolean;
  /** A submitted payment is awaiting review; new invoices are blocked. */
  awaitingReview: boolean;
};

const MONTH_OPTIONS = [1, 3, 6, 12];

function features(plan: PlanCard) {
  return [
    plan.maxProducts === null ? "Unlimited products" : `Up to ${plan.maxProducts.toLocaleString("en-US")} products`,
    plan.maxStaff === null ? "Unlimited staff" : plan.maxStaff === 1 ? "Owner only" : `Up to ${plan.maxStaff} team members`,
    plan.customDomain ? "Your own domain" : "Free store address only",
    "Cash on delivery orders",
  ];
}

export function PlanCards({ storeId, plans, currentPlanKey, inTrial, awaitingReview }: Props) {
  const [pending, startTransition] = useTransition();
  const [months, setMonths] = useState<Record<string, number>>({});

  function run(action: () => Promise<{ ok?: boolean; message?: string }>) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) toast.success(result.message);
      else toast.error(result.message ?? "Something went wrong.");
    });
  }

  return (
    <div className={cn("grid gap-4", plans.length === 1 ? "max-w-md" : "md:grid-cols-3")}>
      {plans.map((plan) => {
        const current = plan.key === currentPlanKey;
        const m = months[plan.key] ?? 1;
        return (
          <div
            key={plan.key}
            className={cn(
              "flex flex-col gap-4 rounded-xl border p-5",
              current && "border-primary ring-2 ring-primary/15",
            )}
          >
            <div className="grid gap-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold">{plan.name}</h3>
                {current && plans.length > 1 && <Badge>{inTrial ? "Trial plan" : "Current"}</Badge>}
              </div>
              {plan.description && <p className="text-sm text-muted-foreground">{plan.description}</p>}
            </div>
            <p>
              <span className="text-2xl font-semibold tabular-nums">{formatMoney(plan.priceMonthly)}</span>
              <span className="text-sm text-muted-foreground"> / month</span>
            </p>
            <ul className="grid flex-1 gap-2 text-sm">
              {features(plan).map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
            <div className="grid gap-2">
              {inTrial && !current && (
                <Button
                  variant="outline"
                  disabled={pending}
                  onClick={() => run(() => switchTrialPlanAction(storeId, plan.key))}
                >
                  Try {plan.name} during trial
                </Button>
              )}
              <div className="flex gap-2">
                <label className="sr-only" htmlFor={`months-${plan.key}`}>
                  Months to pay for {plan.name}
                </label>
                <select
                  id={`months-${plan.key}`}
                  value={m}
                  onChange={(e) => setMonths((prev) => ({ ...prev, [plan.key]: Number(e.target.value) }))}
                  className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm"
                >
                  {MONTH_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? "month" : "months"}
                    </option>
                  ))}
                </select>
                <Button
                  className="flex-1"
                  variant={current ? "default" : "outline"}
                  disabled={pending || awaitingReview}
                  onClick={() => run(() => createInvoiceAction(storeId, plan.key, m))}
                >
                  Pay {formatMoney(plan.priceMonthly * m)}
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
