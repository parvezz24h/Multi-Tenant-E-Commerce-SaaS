import { Check } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { TRIAL_DAYS } from "@/lib/subscription";
import { cn } from "@/lib/utils";

type Plan = {
  key: string;
  name: string;
  description: string | null;
  priceMonthly: number;
  maxProducts: number | null;
  maxStaff: number | null;
  customDomain: boolean;
};

/** The plan highlighted as the default choice. */
const FEATURED_PLAN = "business";

function features(plan: Plan) {
  return [
    plan.maxProducts === null ? "Unlimited products" : `Up to ${plan.maxProducts.toLocaleString("en-US")} products`,
    plan.maxStaff === null
      ? "Unlimited team members"
      : plan.maxStaff === 1
        ? "Owner account"
        : `Up to ${plan.maxStaff} team members`,
    plan.customDomain ? "Your own domain (.com, .com.bd)" : "Free store address",
    "Cash on delivery checkout",
    "Orders, inventory & customers",
  ];
}

export function Pricing({ plans, signedIn }: { plans: Plan[]; signedIn: boolean }) {
  const cta = signedIn ? "/dashboard" : "/sign-up";

  return (
    <div className={cn("grid gap-6", plans.length === 1 ? "mx-auto w-full max-w-md" : "lg:grid-cols-3")}>
      {plans.map((plan) => {
        // A "most popular" badge only makes sense when there's a choice.
        const featured = plans.length > 1 && plan.key === FEATURED_PLAN;
        return (
          <div
            key={plan.key}
            className={cn(
              "relative flex flex-col gap-6 rounded-2xl border bg-background p-6",
              featured && "border-primary shadow-xl shadow-primary/10",
            )}
          >
            {featured && (
              <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                Most popular
              </span>
            )}
            {/* With a single plan its name adds nothing; lead with the price. */}
            {plans.length > 1 && (
              <div className="grid gap-2">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                {plan.description && <p className="text-sm text-muted-foreground">{plan.description}</p>}
              </div>
            )}
            <p className="flex items-baseline gap-1">
              <span className="text-4xl font-semibold tracking-tight tabular-nums">{formatMoney(plan.priceMonthly)}</span>
              <span className="text-sm text-muted-foreground">/ month</span>
            </p>
            <ul className="grid flex-1 gap-3 text-sm">
              {features(plan).map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
            <Button asChild size="lg" variant={featured || plans.length === 1 ? "default" : "outline"}>
              <Link href={cta}>Start {TRIAL_DAYS}-day free trial</Link>
            </Button>
          </div>
        );
      })}
    </div>
  );
}
