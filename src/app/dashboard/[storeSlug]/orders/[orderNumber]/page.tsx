import { Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/dashboard/status-badges";
import { MerchantNoteForm } from "@/components/orders/merchant-note-form";
import { OrderStatusActions } from "@/components/orders/order-status-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/datetime";
import { formatMoney } from "@/lib/money";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { getOrder } from "@/server/orders/service";
import { getStoreContext } from "@/server/tenant/context";

type Props = PageProps<"/dashboard/[storeSlug]/orders/[orderNumber]">;

function parseOrderNumber(value: string) {
  return /^\d{1,9}$/.test(value) ? Number(value) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Order #${(await params).orderNumber}` };
}

export default async function OrderPage({ params }: Props) {
  const { storeSlug, orderNumber: raw } = await params;
  const { store, can } = await getStoreContext(storeSlug, "orders:read");
  const orderNumber = parseOrderNumber(raw);
  const order = orderNumber ? await getOrder(store.id, orderNumber) : null;
  if (!order) notFound();

  const base = `/dashboard/${store.slug}`;
  const address = [order.addressLine, order.area, order.upazila, order.district, order.postalCode]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="grid gap-6">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            Order #{order.orderNumber} <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </span>
        }
        description={`Placed ${formatDateTime(order.createdAt)} · Cash on delivery`}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="grid content-start gap-6">
          {can("orders:write") && (
            <Card>
              <CardHeader>
                <CardTitle>Next step</CardTitle>
              </CardHeader>
              <CardContent>
                <OrderStatusActions storeId={store.id} orderId={order.id} status={order.status} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <ul className="divide-y">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-4 py-3 text-sm">
                    <div>
                      {item.productId ? (
                        <Link href={`${base}/products/${item.productId}`} className="font-medium hover:underline">
                          {item.name}
                        </Link>
                      ) : (
                        <span className="font-medium">{item.name}</span>
                      )}
                      <div className="text-muted-foreground tabular-nums">
                        {formatMoney(item.unitPrice)} × {item.quantity}
                        {item.sku && ` · ${item.sku}`}
                      </div>
                    </div>
                    <span className="font-medium tabular-nums">{formatMoney(item.lineTotal)}</span>
                  </li>
                ))}
              </ul>
              <dl className="grid gap-1 border-t pt-3 text-sm">
                <Row label="Subtotal" value={formatMoney(order.subtotal)} />
                <Row label="Delivery" value={formatMoney(order.deliveryCharge)} />
                {order.discount > 0 && <Row label="Discount" value={`−${formatMoney(order.discount)}`} />}
                <Row label="Total" value={formatMoney(order.total)} strong />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="grid gap-3 border-l pl-4 text-sm">
                <li>
                  <div className="font-medium">Order placed</div>
                  <div className="text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</div>
                </li>
                {order.events
                  .filter((e) => e.fromStatus !== null)
                  .map((e) => (
                    <li key={e.id}>
                      <div className="font-medium">{ORDER_STATUS_LABELS[e.toStatus]}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDateTime(e.createdAt)}
                        {e.actorName && ` · ${e.actorName}`}
                      </div>
                      {e.note && <div className="mt-1 text-muted-foreground">“{e.note}”</div>}
                    </li>
                  ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        <div className="grid content-start gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div>
                {order.customer ? (
                  <Link href={`${base}/customers/${order.customer.id}`} className="font-medium hover:underline">
                    {order.customerName}
                  </Link>
                ) : (
                  <span className="font-medium">{order.customerName}</span>
                )}
                {order.customer && (
                  <div className="text-xs text-muted-foreground">
                    {order.customer._count.orders} {order.customer._count.orders === 1 ? "order" : "orders"}
                  </div>
                )}
              </div>
              <a href={`tel:${order.phone}`} className="inline-flex items-center gap-2 hover:underline">
                <Phone className="size-4 text-muted-foreground" aria-hidden />
                {order.phone}
              </a>
              {order.email && <div>{order.email}</div>}
              <div>
                <div className="text-xs font-medium text-muted-foreground uppercase">Delivery address</div>
                <p>{address}</p>
              </div>
              {order.customerNote && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase">Customer note</div>
                  <p>{order.customerNote}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {can("orders:write") && (
            <Card>
              <CardHeader>
                <CardTitle>Internal note</CardTitle>
              </CardHeader>
              <CardContent>
                <MerchantNoteForm storeId={store.id} orderId={order.id} defaultValue={order.merchantNote ?? ""} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={strong ? "flex justify-between pt-1 text-base font-semibold" : "flex justify-between"}>
      <dt className={strong ? undefined : "text-muted-foreground"}>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
