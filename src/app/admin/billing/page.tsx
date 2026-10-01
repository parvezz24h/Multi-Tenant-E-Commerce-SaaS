import type { Metadata } from "next";

import { InvoiceReview } from "@/components/admin/invoice-review";
import { FilterTabs, firstParam } from "@/components/dashboard/list-controls";
import { EmptyState, PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/datetime";
import { formatMoney } from "@/lib/money";
import { formatInvoiceNumber } from "@/lib/subscription";
import { requireSuperAdmin } from "@/server/auth/session";
import { type InvoiceFilter, listInvoicesForAdmin } from "@/server/billing/admin";
import { BILLING_METHOD_LABELS } from "@/server/billing/schemas";

export const metadata: Metadata = { title: "Billing" };

const TABS: { value: InvoiceFilter; label: string }[] = [
  { value: "review", label: "To verify" },
  { value: "open", label: "Unpaid" },
  { value: "paid", label: "Paid" },
  { value: "void", label: "Rejected / cancelled" },
];

export default async function AdminBillingPage({ searchParams }: PageProps<"/admin/billing">) {
  await requireSuperAdmin();
  const param = firstParam((await searchParams).filter);
  const filter: InvoiceFilter = TABS.find((t) => t.value === param)?.value ?? "review";
  const invoices = await listInvoicesForAdmin(filter);

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Billing"
        description="Check each payment in your bKash / Nagad / bank statement before marking it paid."
      />
      <FilterTabs
        items={TABS.map((t) => ({
          label: t.label,
          href: t.value === "review" ? "/admin/billing" : `/admin/billing?filter=${t.value}`,
          active: t.value === filter,
        }))}
      />

      {invoices.length === 0 ? (
        <EmptyState title={filter === "review" ? "Nothing to verify" : "No invoices"} />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>
                    <div className="font-mono text-xs">{formatInvoiceNumber(i.number)}</div>
                    <div className="text-xs text-muted-foreground">
                      {i.plan.name} · {i.periodMonths} mo · {formatDateTime(i.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{i.store.name}</div>
                    <div className="text-xs text-muted-foreground">{i.store.slug}</div>
                  </TableCell>
                  <TableCell>
                    {i.method ? (
                      <>
                        <div>
                          {BILLING_METHOD_LABELS[i.method]} · <span className="font-mono">{i.reference}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          from {i.payerAccount}
                          {i.submittedAt && ` · ${formatDateTime(i.submittedAt)}`}
                        </div>
                      </>
                    ) : (
                      <span className="text-muted-foreground">Not submitted</span>
                    )}
                    {i.adminNote && <div className="text-xs text-muted-foreground">Note: {i.adminNote}</div>}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{formatMoney(i.amount)}</TableCell>
                  <TableCell className="text-right">
                    {i.status === "OPEN" ? (
                      <InvoiceReview invoiceId={i.id} label={formatInvoiceNumber(i.number)} />
                    ) : i.status === "PAID" ? (
                      <Badge className="bg-emerald-600 text-white">
                        Paid {i.paidAt && formatDateTime(i.paidAt)}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Closed</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
