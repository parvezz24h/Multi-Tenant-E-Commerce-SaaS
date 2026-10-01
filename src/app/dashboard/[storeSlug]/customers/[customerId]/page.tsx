import { Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CustomerForm } from "@/components/customers/customer-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { OrderStatusBadge } from "@/components/dashboard/status-badges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatDateTime } from "@/lib/datetime";
import { formatMoney } from "@/lib/money";
import { getCustomer } from "@/server/customers/service";
import { getStoreContext } from "@/server/tenant/context";

type Props = PageProps<"/dashboard/[storeSlug]/customers/[customerId]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { storeSlug, customerId } = await params;
  const { store } = await getStoreContext(storeSlug, "customers:read");
  const customer = await getCustomer(store.id, customerId);
  return { title: customer?.name ?? "Customer" };
}

export default async function CustomerPage({ params }: Props) {
  const { storeSlug, customerId } = await params;
  const { store, can } = await getStoreContext(storeSlug, "customers:read");
  const customer = await getCustomer(store.id, customerId);
  if (!customer) notFound();
  const base = `/dashboard/${store.slug}`;

  return (
    <div className="grid gap-6">
      <PageHeader
        title={customer.name}
        description={`Customer since ${formatDate(customer.createdAt)} · ${customer.orders.length} orders · ${formatMoney(customer.totalSpent)} spent`}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {customer.orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              <ul className="divide-y text-sm">
                {customer.orders.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <Link href={`${base}/orders/${o.orderNumber}`} className="font-medium hover:underline">
                        #{o.orderNumber}
                      </Link>
                      <div className="text-xs text-muted-foreground">{formatDateTime(o.createdAt)}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <OrderStatusBadge status={o.status} />
                      <span className="w-24 text-right tabular-nums">{formatMoney(o.total)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="grid content-start gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <a href={`tel:${customer.phone}`} className="inline-flex items-center gap-2 hover:underline">
                <Phone className="size-4 text-muted-foreground" aria-hidden />
                {customer.phone}
              </a>
              {customer.addresses.map((a) => (
                <div key={a.id}>
                  <div className="text-xs font-medium text-muted-foreground uppercase">
                    {a.isDefault ? "Default address" : "Address"}
                  </div>
                  <p>{[a.addressLine, a.area, a.upazila, a.district, a.postalCode].filter(Boolean).join(", ")}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {can("customers:write") && (
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent>
                <CustomerForm
                  storeId={store.id}
                  customerId={customer.id}
                  defaults={{ name: customer.name, email: customer.email ?? "", note: customer.note ?? "" }}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
