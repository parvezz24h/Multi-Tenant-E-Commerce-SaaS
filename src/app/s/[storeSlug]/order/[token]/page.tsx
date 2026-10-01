import { CheckCircle2, Circle, XCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import type { OrderStatus } from "@/generated/prisma/enums";
import { formatDateTime } from "@/lib/datetime";
import { formatMoney } from "@/lib/money";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { getOrderByToken } from "@/server/checkout/service";
import { requireOpenStore } from "@/server/storefront/context";

export const metadata: Metadata = {
  title: "Your order",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

const PROGRESS: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

const CUSTOMER_STATUS: Record<OrderStatus, string> = {
  PENDING: "Order received — the seller will call you to confirm.",
  CONFIRMED: "Confirmed — your order is being prepared.",
  PROCESSING: "Being packed for delivery.",
  SHIPPED: "On the way to you.",
  DELIVERED: "Delivered. Thank you for shopping with us!",
  CANCELLED: "This order was cancelled.",
  RETURNED: "This order was returned.",
};

export default async function OrderConfirmationPage({
  params,
}: PageProps<"/s/[storeSlug]/order/[token]">) {
  const { storeSlug, token } = await params;
  const { store } = await requireOpenStore(storeSlug);
  const order = await getOrderByToken(store.id, token);
  if (!order) notFound();

  const closed = order.status === "CANCELLED" || order.status === "RETURNED";
  const reached = (s: OrderStatus) => order.events.some((e) => e.toStatus === s);
  const address = [order.addressLine, order.area, order.upazila, order.district, order.postalCode]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="mx-auto grid max-w-2xl gap-8">
      <div className="grid justify-items-center gap-2 text-center">
        {closed ? (
          <XCircle className="size-12 text-muted-foreground" aria-hidden />
        ) : (
          <CheckCircle2 className="size-12 text-primary" aria-hidden />
        )}
        <h1 className="text-2xl font-semibold tracking-tight">
          {order.status === "PENDING" ? "Thank you! Your order is placed." : `Order #${order.orderNumber}`}
        </h1>
        <p className="text-muted-foreground">{CUSTOMER_STATUS[order.status]}</p>
        <p className="text-sm">
          Order number <span className="font-semibold">#{order.orderNumber}</span> · placed{" "}
          {formatDateTime(order.createdAt)}
        </p>
      </div>

      {!closed && (
        <ol className="grid grid-cols-5 gap-2 text-center text-xs" aria-label="Order progress">
          {PROGRESS.map((s) => {
            const done = reached(s) || s === "PENDING";
            return (
              <li key={s} className="grid justify-items-center gap-1">
                {done ? (
                  <CheckCircle2 className="size-5 text-primary" aria-hidden />
                ) : (
                  <Circle className="size-5 text-muted-foreground" aria-hidden />
                )}
                <span className={done ? "font-medium" : "text-muted-foreground"}>
                  {s === "PENDING" ? "Placed" : ORDER_STATUS_LABELS[s]}
                </span>
                <span className="sr-only">{done ? "done" : "not yet"}</span>
              </li>
            );
          })}
        </ol>
      )}

      <section className="grid gap-4 rounded-xl border p-5" aria-labelledby="items-heading">
        <h2 id="items-heading" className="font-semibold">
          Items
        </h2>
        <ul className="grid gap-2 text-sm">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-3">
              <span>
                {i.name} <span className="text-muted-foreground">× {i.quantity}</span>
              </span>
              <span className="tabular-nums">{formatMoney(i.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="grid gap-1 border-t pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="tabular-nums">{formatMoney(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Delivery</dt>
            <dd className="tabular-nums">{formatMoney(order.deliveryCharge)}</dd>
          </div>
          <div className="flex justify-between pt-1 text-base font-semibold">
            <dt>{order.paymentStatus === "PAID" ? "Paid" : "To pay on delivery"}</dt>
            <dd className="tabular-nums">{formatMoney(order.total)}</dd>
          </div>
        </dl>
      </section>

      <section className="grid gap-1 rounded-xl border p-5 text-sm" aria-labelledby="delivery-heading">
        <h2 id="delivery-heading" className="mb-1 font-semibold">
          Delivery to
        </h2>
        <p>{order.customerName}</p>
        <p>{order.phone}</p>
        <p className="text-muted-foreground">{address}</p>
      </section>

      <div className="grid justify-items-center gap-2 text-center text-sm text-muted-foreground">
        <p>Bookmark this page to check your order status later.</p>
        {store.contactPhone && (
          <p>
            Questions? Call{" "}
            <a href={`tel:${store.contactPhone}`} className="font-medium text-foreground hover:underline">
              {store.contactPhone}
            </a>
          </p>
        )}
        <Button asChild variant="outline" className="mt-2">
          <Link href="/products">Continue shopping</Link>
        </Button>
      </div>
    </div>
  );
}
