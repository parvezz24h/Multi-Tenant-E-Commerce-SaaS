import { ArrowRight, Check } from "lucide-react";
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

/** Everything else every plan includes (shown on the wide single-plan card). */
const INCLUDED = [
  "Mobile-friendly storefront",
  "Brand color, logo & banner",
  "Bangladesh address checkout",
  "Order tracking for customers",
  "Stock alerts & history",
  "No commission on your sales",
];

/** One plan: a wide card using the full container. */
function SinglePlan({ plan, cta }: { plan: Plan; cta: string }) {
  return (
    <div className="reveal grid overflow-hidden rounded-3xl border bg-background shadow-xl shadow-primary/5 lg:grid-cols-[2fr_3fr]">
      <div className="grid content-center gap-5 bg-primary/5 p-8 sm:p-10">
        <p className="text-sm font-medium text-primary">Everything included</p>
        <p className="flex items-baseline gap-1.5">
          <span className="text-5xl font-semibold tracking-tight tabular-nums sm:text-6xl">
            {formatMoney(plan.priceMonthly)}
          </span>
          <span className="text-muted-foreground">/ month</span>
        </p>
        <p className="text-sm text-muted-foreground">
          {TRIAL_DAYS} days free, no card needed. Pay monthly or for several months at once.
        </p>
        <Button asChild size="lg" className="justify-self-start">
          <Link href={cta}>
            Start {TRIAL_DAYS}-day free trial <ArrowRight />
          </Link>
        </Button>
      </div>
      <ul className="grid content-center gap-x-8 gap-y-4 p-8 text-sm sm:grid-cols-2 sm:p-10">
        {[...features(plan), ...INCLUDED].map((f) => (
          <li key={f} className="flex items-start gap-3">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Check className="size-3.5" aria-hidden />
            </span>
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Pricing({ plans, signedIn }: { plans: Plan[]; signedIn: boolean }) {
  const cta = signedIn ? "/dashboard" : "/sign-up";
  if (plans.length === 1) return <SinglePlan plan={plans[0]!} cta={cta} />;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {plans.map((plan) => {
        const featured = plan.key === FEATURED_PLAN;
        return (
          <div
            key={plan.key}
            className={cn(
              "reveal relative flex flex-col gap-6 rounded-2xl border bg-background p-6 transition-shadow hover:shadow-lg",
              featured && "border-primary shadow-xl shadow-primary/10",
            )}
          >
            {featured && (
              <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                Most popular
              </span>
            )}
            <div className="grid gap-2">
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              {plan.description && <p className="text-sm text-muted-foreground">{plan.description}</p>}
            </div>
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
            <Button asChild size="lg" variant={featured ? "default" : "outline"}>
              <Link href={cta}>Start {TRIAL_DAYS}-day free trial</Link>
            </Button>
          </div>
        );
      })}
    </div>
  );
}
