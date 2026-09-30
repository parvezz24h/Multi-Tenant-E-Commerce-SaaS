"use client";

import {
  Boxes,
  CreditCard,
  Globe,
  LayoutDashboard,
  Package,
  Palette,
  Settings,
  ShoppingCart,
  Ticket,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type NavItem = { label: string; icon: LucideIcon; href?: string };

/** Items without `href` are on the roadmap and shown as "Soon". */
function navItems(base: string): NavItem[] {
  return [
    { label: "Overview", icon: LayoutDashboard, href: base },
    { label: "Products", icon: Package },
    { label: "Orders", icon: ShoppingCart },
    { label: "Customers", icon: Users },
    { label: "Inventory", icon: Boxes },
    { label: "Coupons", icon: Ticket },
    { label: "Store design", icon: Palette, href: `${base}/design` },
    { label: "Domain", icon: Globe },
    { label: "Payments", icon: Wallet },
    { label: "Subscription", icon: CreditCard },
    { label: "Settings", icon: Settings, href: `${base}/settings` },
  ];
}

export function StoreNav({ storeSlug }: { storeSlug: string }) {
  const pathname = usePathname();
  const base = `/dashboard/${storeSlug}`;

  return (
    <nav
      aria-label="Store"
      className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible"
    >
      {navItems(base).map(({ label, icon: Icon, href }) => {
        const itemClass =
          "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm whitespace-nowrap";

        if (!href) {
          return (
            <span
              key={label}
              className={cn(itemClass, "hidden text-muted-foreground/60 md:flex")}
              aria-disabled
            >
              <Icon className="size-4" aria-hidden />
              {label}
              <span className="ml-auto text-xs">Soon</span>
            </span>
          );
        }

        const active = pathname === href;
        return (
          <Link
            key={label}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              itemClass,
              active ? "bg-muted font-medium" : "text-muted-foreground hover:bg-muted/60",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
