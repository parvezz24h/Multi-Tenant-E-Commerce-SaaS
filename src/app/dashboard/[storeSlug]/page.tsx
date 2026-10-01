import { CheckCircle2, Circle, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { OrderStatusBadge } from "@/components/dashboard/status-badges";
import { PublishToggle } from "@/components/stores/publish-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/datetime";
import { storeUrl } from "@/lib/hosts";
import { formatMoney } from "@/lib/money";
import { storeHostname } from "@/lib/site";
import { countStockAlerts } from "@/server/catalog/inventory";
import { countCustomers } from "@/server/customers/service";
import { getOrderStats } from "@/server/orders/service";
import { STORE_ROLE_LABELS } from "@/server/rbac/permissions";
import { getSetupProgress } from "@/server/stores/service";
import { getStoreContext } from "@/server/tenant/context";

export async function generateMetadata({
  params,
}: PageProps<"/dashboard/[storeSlug]">): Promise<Metadata> {
  const { store } = await getStoreContext((await params).storeSlug);
  return { title: store.name };
}

export default async function StoreOverviewPage({ params }: PageProps<"/dashboard/[storeSlug]">) {
  const { storeSlug } = await params;
  const { store, role, can } = await getStoreContext(storeSlug);
  const [progress, orders, stock, customers] = await Promise.all([
    getSetupProgress(store.id),
    getOrderStats(store.id),
    countStockAlerts(store.id),
    countCustomers(store.id),
  ]);
  const base = `/dashboard/${store.slug}`;
  const tiles = [
    { label: "Orders today", value: String(orders.todayOrders), href: `${base}/orders` },
    { label: "Sales today", value: formatMoney(orders.todayRevenue), href: `${base}/orders` },
    { label: "Orders to handle", value: String(orders.openOrders), href: `${base}/orders?status=PENDING` },
    {
      label: "Low / out of stock",
      value: `${stock.low} / ${stock.out}`,
      href: `${base}/inventory?filter=${stock.out > 0 ? "out" : "low"}`,
    },
    { label: "Customers", value: String(customers), href: `${base}/customers` },
  ];

  const checklist = [
    {
      label: "Add your store details",
      done: Boolean(store.contactPhone && store.district),
      href: `/dashboard/${store.slug}/settings`,
    },
    {
      label: "Choose a theme",
      done: progress.hasTheme,
      href: `/dashboard/${store.slug}/design`,
    },
    { label: "Add your first product", done: progress.hasProducts, href: `${base}/products/new` },
    { label: "Publish your store", done: store.status === "ACTIVE" },
  ];

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{store.name}</h1>
          <p className="text-sm text-muted-foreground">
            {storeHostname(store.slug)} · You are {STORE_ROLE_LABELS[role].toLowerCase()}
          </p>
        </div>
        {store.status === "ACTIVE" && (
          <Button variant="outline" asChild>
            <a href={storeUrl(store.slug)} target="_blank" rel="noopener noreferrer">
              View store <ExternalLink />
            </a>
          </Button>
        )}
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((t) => (
          <li key={t.label}>
            <Link href={t.href} className="grid h-full gap-1 rounded-xl border p-4 hover:bg-muted/40">
              <span className="text-xs text-muted-foreground">{t.label}</span>
              <span className="text-xl font-semibold tabular-nums">{t.value}</span>
            </Link>
          </li>
        ))}
      </ul>

      <Card>
        <CardHeader>
          <CardTitle>Recent orders</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet. Share your store link to get started.</p>
          ) : (
            <ul className="divide-y text-sm">
              {orders.recent.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                  <div>
                    <Link href={`${base}/orders/${o.orderNumber}`} className="font-medium hover:underline">
                      #{o.orderNumber}
                    </Link>{" "}
                    <span className="text-muted-foreground">· {o.customerName}</span>
                    <div className="text-xs text-muted-foreground">{formatDateTime(o.createdAt)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <OrderStatusBadge status={o.status} />
                    <span className="w-20 text-right tabular-nums">{formatMoney(o.total)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Get your store ready</CardTitle>
          <CardDescription>
            {checklist.filter((i) => i.done).length} of {checklist.length} steps done
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3">
            {checklist.map(({ label, done, href }) => (
              <li key={label} className="flex items-center gap-3 text-sm">
                {done ? (
                  <CheckCircle2 className="size-5 text-primary" aria-label="Done" />
                ) : (
                  <Circle className="size-5 text-muted-foreground" aria-label="Not done" />
                )}
                {href && !done ? (
                  <Link href={href} className="underline-offset-4 hover:underline">
                    {label}
                  </Link>
                ) : (
                  <span className={done ? "text-muted-foreground line-through" : undefined}>
                    {label}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {can("store:publish") && store.status !== "SUSPENDED" && (
        <Card>
          <CardHeader>
            <CardTitle>Store visibility</CardTitle>
            <CardDescription>
              {store.status === "ACTIVE"
                ? "Your store is live. Customers can browse products and add them to their cart."
                : "Your store is a draft and hidden from customers."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PublishToggle storeId={store.id} published={store.status === "ACTIVE"} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
