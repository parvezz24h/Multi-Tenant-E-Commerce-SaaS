import type { Metadata } from "next";
import Link from "next/link";

import { firstParam, hrefWith, Pagination, parsePage, SearchBox } from "@/components/dashboard/list-controls";
import { EmptyState, PageHeader } from "@/components/dashboard/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/datetime";
import { formatMoney } from "@/lib/money";
import { listCustomers } from "@/server/customers/service";
import { getStoreContext } from "@/server/tenant/context";

export const metadata: Metadata = { title: "Customers" };

export default async function CustomersPage({
  params,
  searchParams,
}: PageProps<"/dashboard/[storeSlug]/customers">) {
  const { storeSlug } = await params;
  const { store } = await getStoreContext(storeSlug, "customers:read");
  const sp = await searchParams;
  const q = firstParam(sp.q);
  const result = await listCustomers(store.id, { q, page: parsePage(sp.page) });
  const base = `/dashboard/${store.slug}/customers`;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Customers"
        description="People who ordered from your store, identified by phone number."
        actions={<SearchBox action={base} defaultValue={q} placeholder="Name, phone or email" />}
      />

      {result.items.length === 0 ? (
        <EmptyState title={q ? "No customers match" : "No customers yet"}>
          {!q && <p>Customers are added automatically when they place an order.</p>}
        </EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Total spent</TableHead>
                <TableHead>Last order</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`${base}/${c.id}`} className="font-medium hover:underline">
                      {c.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">{c.phone}</div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{c.orderCount}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatMoney(c.totalSpent)}</TableCell>
                  <TableCell>{c.lastOrderAt ? formatDate(c.lastOrderAt) : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Pagination
        page={result.page}
        pageCount={result.pageCount}
        hrefFor={(page) => hrefWith(base, { q, page })}
      />
    </div>
  );
}
