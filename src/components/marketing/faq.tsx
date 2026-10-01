import { ChevronDown } from "lucide-react";

import { GRACE_DAYS, TRIAL_DAYS } from "@/lib/subscription";

type FaqProps = {
  /** Name of the plan new stores try (first offered plan). */
  trialPlanName: string;
  /** Names of offered plans that include custom domains (empty = none). */
  domainPlanNames: string[];
  multiplePlans: boolean;
};

function questions({ trialPlanName, domainPlanNames, multiplePlans }: FaqProps) {
  const allPlansHaveDomains = domainPlanNames.length > 0 && !multiplePlans;
  return [
    {
      q: "Do I need to know coding or hire a developer?",
      a: "No. Pick a name, add your products with photos and prices, choose your brand color, and your store is ready. Everything is done from a simple dashboard that works on your phone.",
    },
    {
      q: "How do my customers pay?",
      a: "Customers order with Cash on Delivery. You confirm the order by phone, send it with your usual courier, and mark it delivered when the cash is collected.",
    },
    {
      q: "What does the free trial include?",
      a: multiplePlans
        ? `You get ${TRIAL_DAYS} days free on the ${trialPlanName} plan. You can switch plans during the trial and only pay when you decide to keep your store.`
        : `You get ${TRIAL_DAYS} days free with every feature included. You only pay when you decide to keep your store.`,
    },
    {
      q: "How do I pay for my subscription?",
      a: "Pay monthly or for several months at once with bKash, Nagad or bank transfer, then enter the transaction ID in your dashboard. Your plan is activated as soon as the payment is confirmed.",
    },
    ...(domainPlanNames.length > 0
      ? [
          {
            q: "Can I use my own domain like myshop.com.bd?",
            a: `Yes${allPlansHaveDomains ? "" : `, on the ${domainPlanNames.join(" and ")} plan${domainPlanNames.length > 1 ? "s" : ""}`}. Add your domain in the dashboard and follow the DNS steps shown; HTTPS is set up automatically. Your free store address keeps working too.`,
          },
        ]
      : []),
    {
      q: "What happens if I forget to renew?",
      a: `Your store stays online for a ${GRACE_DAYS}-day grace period so you don't lose orders. After that it goes offline until you pay — your products, orders and customers are kept safe.`,
    },
  ];
}

/** Native <details> accordion: works without JavaScript and is keyboard accessible. */
export function Faq(props: FaqProps) {
  return (
    <div className="divide-y rounded-2xl border bg-background">
      {questions(props).map(({ q, a }) => (
        <details key={q} className="group px-6 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-medium">
            {q}
            <ChevronDown
              className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
              aria-hidden
            />
          </summary>
          <p className="pb-5 text-sm leading-relaxed text-muted-foreground">{a}</p>
        </details>
      ))}
    </div>
  );
}
