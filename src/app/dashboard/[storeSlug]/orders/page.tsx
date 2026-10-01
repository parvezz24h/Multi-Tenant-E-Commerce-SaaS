import type { Metadata } from "next";
import Link from "next/link";

import {
  FilterTabs,
  firstParam,
  hrefWith,
  Pagination,
  parsePage,
  SearchBox,
} from "@/components/dashboard/list-controls";
import { EmptyState, PageHeader } from "@/components/dashboard/page-header";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/dashboard/status-badges";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { OrderStatus } from "@/generated/prisma/enums";
import { formatDateTime } from "@/lib/datetime";
import { formatMoney } from "@/lib/money";
import { ORDER_STATUS_LABELS, ORDER_STATUSES } from "@/lib/order-status";
import { countOrdersByStatus, listOrders } from "@/server/orders/service";
import { getStoreContext } from "@/server/tenant/context";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage({
  params,
  searchParams,
}: PageProps<"/dashboard/[storeSlug]/orders">) {
  const { storeSlug } = await params;
  const { store } = await getStoreContext(storeSlug, "orders:read");
  const sp = await searchParams;
  const q = firstParam(sp.q);
  const statusParam = firstParam(sp.status);
  const status = ORDER_STATUSES.find((s) => s === statusParam) as OrderStatus | undefined;

  const [result, counts] = await Promise.all([
    listOrders(store.id, { status, q, page: parsePage(sp.page) }),
    countOrdersByStatus(store.id),
  ]);
  const base = `/dashboard/${store.slug}/orders`;
  const allCount = Object.values(counts).reduce((a, b) => a + (b ?? 0), 0);

  return (
    <div className="grid gap-6">
      <PageHeader title="Orders" description="Confirm new orders quickly — customers are waiting for a call." />

      <div className="grid gap-3">
        <FilterTabs
          items={[
            { label: "All", href: hrefWith(base, { q }), active: !status, count: allCount },
            ...ORDER_STATUSES.map((s) => ({
              label: ORDER_STATUS_LABELS[s],
              href: hrefWith(base, { status: s, q }),
              active: status === s,
              count: counts[s] ?? 0,
            })),
          ]}
        />
        <SearchBox action={base} defaultValue={q} placeholder="Order #, phone or name" keep={{ status }} />
      </div>

      {result.items.length === 0 ? (
        <EmptyState title={q || status ? "No orders match" : "No orders yet"}>
          {!q && !status && <p>Orders from your store will show up here.</p>}
        </EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <Link href={`${base}/${o.orderNumber}`} className="font-medium hover:underline">
                      #{o.orderNumber}
                    </Link>
                    <div className="text-xs text-muted-foreground">{formatDateTime(o.createdAt)}</div>
                  </TableCell>
                  <TableCell>
                    <div>{o.customerName}</div>
                    <div className="text-xs text-muted-foreground">
                      {o.phone} · {o.district}
                    </div>
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={o.status} />
                  </TableCell>
                  <TableCell>
                    <PaymentStatusBadge status={o.paymentStatus} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(o.total)}
                    <div className="text-xs text-muted-foreground">
                      {o._count.items} {o._count.items === 1 ? "item" : "items"}
                    </div>
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
        hrefFor={(page) => hrefWith(base, { status, q, page })}
      />
    </div>
  );
}
