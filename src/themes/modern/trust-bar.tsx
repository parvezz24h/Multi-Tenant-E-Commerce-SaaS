import { Banknote, PackageSearch, Truck } from "lucide-react";
import Link from "next/link";

import { formatMoney } from "@/lib/money";
import type { ThemeTrustBarProps } from "@/themes/types";

export function ModernTrustBar({ store }: ThemeTrustBarProps) {
  const items = [
    {
      icon: Banknote,
      title: "Cash on delivery",
      body: "Pay when your order arrives",
    },
    {
      icon: Truck,
      title: "Delivery all over Bangladesh",
      body: `${formatMoney(store.deliveryChargeInsideDhaka)} in Dhaka · ${formatMoney(store.deliveryChargeOutsideDhaka)} outside`,
    },
    {
      icon: PackageSearch,
      title: "Track your order",
      body: "Check your order status any time",
      href: "/track",
    },
  ];

  return (
    <ul className="grid gap-3 sm:grid-cols-3">
      {items.map(({ icon: Icon, title, body, href }) => {
        const content = (
          <>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="size-5" aria-hidden />
            </span>
            <span className="grid gap-0.5">
              <span className="text-sm font-medium">{title}</span>
              <span className="text-xs text-muted-foreground">{body}</span>
            </span>
          </>
        );
        return (
          <li key={title}>
            {href ? (
              <Link
                href={href}
                className="flex h-full items-center gap-3 rounded-xl border p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                {content}
              </Link>
            ) : (
              <div className="flex h-full items-center gap-3 rounded-xl border p-4">{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
