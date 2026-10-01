"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const SECTION_LABELS: Record<string, string> = {
  orders: "Orders",
  customers: "Customers",
  products: "Products",
  categories: "Categories",
  inventory: "Inventory",
  design: "Store design",
  domain: "Domain",
  billing: "Subscription",
  plans: "Plans",
  settings: "Settings",
  stores: "Stores",
  users: "Users",
};

/** Label for a detail segment (an id, order number or "new"). */
function detailLabel(section: string, segment: string) {
  if (segment === "new") return section === "products" ? "Add product" : "New";
  if (section === "orders") return `#${segment}`;
  if (section === "products") return "Edit product";
  if (section === "customers") return "Customer";
  return "Details";
}

/**
 * Path-based breadcrumbs for an area such as `/dashboard/<slug>` or `/admin`.
 * The last crumb is the current page.
 */
export function Breadcrumbs({
  base,
  rootLabel,
  labels,
}: {
  base: string;
  rootLabel: string;
  /** Per-area overrides, e.g. "billing" is "Billing" in admin but "Subscription" for merchants. */
  labels?: Record<string, string>;
}) {
  const pathname = usePathname();
  const segments = pathname.startsWith(base)
    ? pathname.slice(base.length).split("/").filter(Boolean)
    : [];

  const crumbs = [{ label: rootLabel, href: base }];
  if (segments[0]) {
    crumbs.push({
      label: labels?.[segments[0]] ?? SECTION_LABELS[segments[0]] ?? segments[0],
      href: `${base}/${segments[0]}`,
    });
  }
  if (segments[0] && segments[1]) {
    crumbs.push({
      label: detailLabel(segments[0], decodeURIComponent(segments[1])),
      href: `${base}/${segments[0]}/${segments[1]}`,
    });
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1;
          return (
            <Fragment key={crumb.href}>
              {i > 0 && <BreadcrumbSeparator className={i < crumbs.length - 1 ? "hidden md:block" : undefined} />}
              <BreadcrumbItem className={!last && i > 0 ? "hidden md:inline-flex" : undefined}>
                {last ? (
                  <BreadcrumbPage className="max-w-48 truncate">{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href} className="max-w-40 truncate">
                      {crumb.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
