import type { Metadata } from "next";
import Link from "next/link";

import { AdjustStockDialog } from "@/components/catalog/adjust-stock-dialog";
import {
  FilterTabs,
  firstParam,
  hrefWith,
  Pagination,
  parsePage,
  SearchBox,
} from "@/components/dashboard/list-controls";
import { EmptyState, PageHeader } from "@/components/dashboard/page-header";
import { StockLevel } from "@/components/dashboard/status-badges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/datetime";
import { REASON_LABELS } from "@/lib/inventory-reasons";
import {
  countStockAlerts,
  type InventoryFilter,
  listInventory,
  listRecentAdjustments,
} from "@/server/catalog/inventory";
import { LOW_STOCK_THRESHOLD } from "@/server/catalog/schemas";
import { getStoreContext } from "@/server/tenant/context";

export const metadata: Metadata = { title: "Inventory" };

export default async function InventoryPage({
  params,
  searchParams,
}: PageProps<"/dashboard/[storeSlug]/inventory">) {
  const { storeSlug } = await params;
  const { store } = await getStoreContext(storeSlug, "products:write");
  const sp = await searchParams;
  const q = firstParam(sp.q);
  const filterParam = firstParam(sp.filter);
  const filter: InventoryFilter = filterParam === "low" || filterParam === "out" ? filterParam : "all";

  const [result, alerts, recent] = await Promise.all([
    listInventory(store.id, { q, filter, page: parsePage(sp.page) }),
    countStockAlerts(store.id),
    listRecentAdjustments(store.id, { take: 10 }),
  ]);
  const base = `/dashboard/${store.slug}/inventory`;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Inventory"
        description={`Low stock means ${LOW_STOCK_THRESHOLD} or fewer left. Orders update stock automatically.`}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          items={[
            { label: "All", href: hrefWith(base, { q }), active: filter === "all" },
            { label: "Low stock", href: hrefWith(base, { filter: "low", q }), active: filter === "low", count: alerts.low },
            { label: "Out of stock", href: hrefWith(base, { filter: "out", q }), active: filter === "out", count: alerts.out },
          ]}
        />
        <SearchBox
          action={base}
          defaultValue={q}
          placeholder="Search name or SKU"
          keep={{ filter: filter === "all" ? undefined : filter }}
        />
      </div>

      {result.items.length === 0 ? (
        <EmptyState title="Nothing here">
          {filter !== "all" && <p>No products are {filter === "low" ? "low on stock" : "out of stock"}.</p>}
        </EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">In stock</TableHead>
                <TableHead className="text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link href={`/dashboard/${store.slug}/products/${p.id}`} className="font-medium hover:underline">
                      {p.name}
                    </Link>
                    {p.status === "DRAFT" && <span className="ml-2 text-xs text-muted-foreground">Draft</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.sku ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <StockLevel stock={p.stock} low={LOW_STOCK_THRESHOLD} />
                  </TableCell>
                  <TableCell className="text-right">
                    <AdjustStockDialog storeId={store.id} productId={p.id} productName={p.name} stock={p.stock} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Pagination
        page={result.page}
        pageCount={result.pageCount}
        hrefFor={(page) => hrefWith(base, { filter: filter === "all" ? undefined : filter, q, page })}
      />

      <Card>
        <CardHeader>
          <CardTitle>Recent stock changes</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No stock changes yet.</p>
          ) : (
            <ul className="divide-y text-sm">
              {recent.map((a) => (
                <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
                  <span>
                    <span className={a.delta > 0 ? "text-emerald-600" : "text-destructive"}>
                      {a.delta > 0 ? `+${a.delta}` : a.delta}
                    </span>{" "}
                    {a.product.name} · {REASON_LABELS[a.reason]}
                    {a.order && ` #${a.order.orderNumber}`}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    → {a.stockAfter} · {formatDateTime(a.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
