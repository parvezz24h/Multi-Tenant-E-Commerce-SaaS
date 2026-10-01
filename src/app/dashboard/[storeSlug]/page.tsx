import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  CheckCircle2,
  Circle,
  ClipboardList,
  ExternalLink,
  Palette,
  Plus,
  ShoppingCart,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { SalesChart } from "@/components/dashboard/sales-chart";
import { OrderStatusBadge } from "@/components/dashboard/status-badges";
import { PublishToggle } from "@/components/stores/publish-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/datetime";
import { storeUrl } from "@/lib/hosts";
import { formatMoney } from "@/lib/money";
import { storeHostname } from "@/lib/site";
import { cn } from "@/lib/utils";
import { countStockAlerts } from "@/server/catalog/inventory";
import { countCustomers } from "@/server/customers/service";
import { getActiveDomain } from "@/server/domains/service";
import { getDailySales, getOrderStats } from "@/server/orders/service";
import { STORE_ROLE_LABELS } from "@/server/rbac/permissions";
import { getSetupProgress } from "@/server/stores/service";
import { getStoreContext } from "@/server/tenant/context";

export async function generateMetadata({
  params,
}: PageProps<"/dashboard/[storeSlug]">): Promise<Metadata> {
  const { store } = await getStoreContext((await params).storeSlug);
  return { title: store.name };
}

/** "Good morning" etc. in Bangladesh time. */
function greeting(now = new Date()) {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Dhaka" }).format(now),
  );
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

export default async function StoreOverviewPage({ params }: PageProps<"/dashboard/[storeSlug]">) {
  const { storeSlug } = await params;
  const { store, user, role, can } = await getStoreContext(storeSlug);
  const [progress, orders, stock, customers, customDomain, sales] = await Promise.all([
    getSetupProgress(store.id),
    getOrderStats(store.id),
    countStockAlerts(store.id),
    countCustomers(store.id),
    getActiveDomain(store.id),
    getDailySales(store.id, 14),
  ]);
  const base = `/dashboard/${store.slug}`;
  const firstName = user.name.split(/\s+/)[0];

  const tiles = [
    { label: "Sales today", value: formatMoney(orders.todayRevenue), href: `${base}/orders`, icon: Banknote },
    { label: "Orders today", value: String(orders.todayOrders), href: `${base}/orders`, icon: ShoppingCart },
    {
      label: "Orders to handle",
      value: String(orders.openOrders),
      href: `${base}/orders?status=PENDING`,
      icon: ClipboardList,
      attention: orders.openOrders > 0,
    },
    {
      label: "Low / out of stock",
      value: `${stock.low} / ${stock.out}`,
      href: `${base}/inventory?filter=${stock.out > 0 ? "out" : "low"}`,
      icon: AlertTriangle,
      attention: stock.out > 0,
    },
    { label: "Customers", value: String(customers), href: `${base}/customers`, icon: Users },
  ];

  const checklist = [
    { label: "Add your store details", done: Boolean(store.contactPhone && store.district), href: `${base}/settings` },
    { label: "Choose a theme and color", done: progress.hasTheme, href: `${base}/design` },
    { label: "Add your first product", done: progress.hasProducts, href: `${base}/products/new` },
    { label: "Publish your store", done: store.status === "ACTIVE" },
  ];
  const done = checklist.filter((i) => i.done).length;
  const setupComplete = done === checklist.length;

  return (
    <div className="grid gap-6">
      {/* Greeting + quick actions */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1">
          <p className="text-sm text-muted-foreground">
            {greeting()}, {firstName}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{store.name}</h1>
          <p className="text-sm text-muted-foreground">
            {customDomain ?? storeHostname(store.slug)} · You are {STORE_ROLE_LABELS[role].toLowerCase()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {can("products:write") && (
            <Button asChild>
              <Link href={`${base}/products/new`}>
                <Plus /> Add product
              </Link>
            </Button>
          )}
          {store.status === "ACTIVE" && (
            <Button variant="outline" asChild>
              <a href={storeUrl(store.slug, { customDomain })} target="_blank" rel="noopener noreferrer">
                View store <ExternalLink />
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Stat tiles */}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((t) => (
          <li key={t.label}>
            <Link
              href={t.href}
              className="group grid h-full gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40"
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">{t.label}</span>
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg",
                    t.attention ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
                  )}
                >
                  <t.icon className="size-4" aria-hidden />
                </span>
              </span>
              <span className="text-xl font-semibold tabular-nums">{t.value}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className={cn("grid gap-6", !setupComplete && "lg:grid-cols-[1fr_20rem]")}>
        {/* Sales chart */}
        <Card>
          <CardHeader>
            <CardTitle>Sales</CardTitle>
            <CardDescription>Daily sales, excluding cancelled and returned orders.</CardDescription>
          </CardHeader>
          <CardContent>
            <SalesChart data={sales} />
          </CardContent>
        </Card>

        {/* Setup checklist (hidden once everything is done) */}
        {!setupComplete && (
          <Card>
            <CardHeader>
              <CardTitle>Get your store ready</CardTitle>
              <CardDescription>
                {done} of {checklist.length} steps done
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div
                className="h-2 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-label="Setup progress"
                aria-valuenow={done}
                aria-valuemin={0}
                aria-valuemax={checklist.length}
              >
                <div className="h-full rounded-full bg-primary" style={{ width: `${(done / checklist.length) * 100}%` }} />
              </div>
              <ul className="grid gap-1">
                {checklist.map(({ label, done, href }) => {
                  const content = (
                    <>
                      {done ? (
                        <CheckCircle2 className="size-5 shrink-0 text-primary" aria-label="Done" />
                      ) : (
                        <Circle className="size-5 shrink-0 text-muted-foreground" aria-label="Not done" />
                      )}
                      <span className={cn("flex-1", done && "text-muted-foreground line-through")}>{label}</span>
                      {href && !done && <ArrowRight className="size-4 text-muted-foreground" aria-hidden />}
                    </>
                  );
                  return (
                    <li key={label}>
                      {href && !done ? (
                        <Link href={href} className="flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted">
                          {content}
                        </Link>
                      ) : (
                        <div className="flex items-center gap-3 px-2 py-2 text-sm">{content}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Recent orders</CardTitle>
          {orders.recent.length > 0 && (
            <Link
              href={`${base}/orders`}
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View all <ArrowRight className="size-4" aria-hidden />
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {orders.recent.length === 0 ? (
            <div className="grid justify-items-center gap-2 py-8 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ShoppingCart className="size-5" aria-hidden />
              </span>
              <p className="text-sm text-muted-foreground">No orders yet. Share your store link to get started.</p>
            </div>
          ) : (
            <ul className="divide-y text-sm">
              {orders.recent.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`${base}/orders/${o.orderNumber}`}
                    className="-mx-2 flex flex-wrap items-center justify-between gap-3 rounded-md px-2 py-3 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                        {o.customerName.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <div className="font-medium">
                          #{o.orderNumber} <span className="font-normal text-muted-foreground">· {o.customerName}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{formatDateTime(o.createdAt)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <OrderStatusBadge status={o.status} />
                      <span className="w-20 text-right font-medium tabular-nums">{formatMoney(o.total)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Visibility + shortcuts */}
      <div className="grid gap-6 md:grid-cols-2">
        {can("store:publish") && store.status !== "SUSPENDED" && (
          <Card>
            <CardHeader>
              <CardTitle>Store visibility</CardTitle>
              <CardDescription>
                {store.status === "ACTIVE"
                  ? "Your store is live. Customers can browse products and place orders."
                  : "Your store is a draft and hidden from customers."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PublishToggle storeId={store.id} published={store.status === "ACTIVE"} />
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Make it yours</CardTitle>
            <CardDescription>Your logo, brand color and homepage banner.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link href={`${base}/design`}>
                <Palette /> Open store design
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
