import { Clock } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PaymentForm } from "@/components/billing/payment-form";
import { PlanCards } from "@/components/billing/plan-cards";
import { RenewalToggle } from "@/components/billing/renewal-toggle";
import { SubscriptionBadge } from "@/components/billing/subscription-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatDateTime } from "@/lib/datetime";
import { formatMoney } from "@/lib/money";
import { formatInvoiceNumber, periodEndsAt, suspendsAt } from "@/lib/subscription";
import { BILLING_METHOD_LABELS } from "@/server/billing/schemas";
import {
  countBillableProducts,
  getSubscription,
  listPlans,
  listStoreInvoices,
  paymentInstructions,
} from "@/server/billing/service";
import { getStoreContext } from "@/server/tenant/context";

export const metadata: Metadata = { title: "Subscription" };

export default async function BillingPage({ params }: PageProps<"/dashboard/[storeSlug]/billing">) {
  const { storeSlug } = await params;
  const { store } = await getStoreContext(storeSlug, "billing:manage");
  const [subscription, plans, invoices, productCount] = await Promise.all([
    getSubscription(store.id),
    listPlans(),
    listStoreInvoices(store.id),
    countBillableProducts(store.id),
  ]);
  if (!subscription) notFound();

  const openInvoice = invoices.find((i) => i.status === "OPEN");
  const awaitingReview = Boolean(openInvoice?.submittedAt);
  const endsAt = periodEndsAt(subscription);
  const offlineAt = suspendsAt(subscription);
  const limit = subscription.plan.maxProducts;
  const usage = limit ? Math.min(100, Math.round((productCount / limit) * 100)) : 0;

  const dateLine = (() => {
    switch (subscription.status) {
      case "TRIAL":
        return endsAt && `Free trial ends ${formatDate(endsAt)}`;
      case "ACTIVE":
        return endsAt && `${subscription.cancelAtPeriodEnd ? "Ends" : "Paid until"} ${formatDate(endsAt)}`;
      case "PAST_DUE":
        return offlineAt && `Payment overdue — store goes offline ${formatDate(offlineAt)}`;
      case "SUSPENDED":
        return "Store offline — pay to reactivate";
      case "CANCELLED":
        return "Subscription cancelled — pay to reactivate";
    }
  })();

  return (
    <div className="grid gap-6">
      <PageHeader title="Subscription" description="Your plan, payments and billing history." />

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            {subscription.plan.name} plan <SubscriptionBadge status={subscription.status} />
          </CardTitle>
          <CardDescription>{dateLine}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-1.5 sm:max-w-sm">
            <div className="flex justify-between text-sm">
              <span>Products</span>
              <span className="tabular-nums text-muted-foreground">
                {productCount.toLocaleString("en-US")} / {limit === null ? "Unlimited" : limit.toLocaleString("en-US")}
              </span>
            </div>
            {limit !== null && (
              <div
                className="h-2 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-label="Products used"
                aria-valuenow={usage}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className={usage >= 90 ? "h-full bg-destructive" : "h-full bg-primary"}
                  style={{ width: `${usage}%` }}
                />
              </div>
            )}
          </div>
          {(subscription.status === "TRIAL" || subscription.status === "ACTIVE") && (
            <div>
              <RenewalToggle storeId={store.id} cancelling={subscription.cancelAtPeriodEnd} />
            </div>
          )}
        </CardContent>
      </Card>

      {openInvoice && (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              Invoice {formatInvoiceNumber(openInvoice.number)}
              {awaitingReview ? (
                <Badge variant="secondary">
                  <Clock /> Verifying payment
                </Badge>
              ) : (
                <Badge variant="outline">Awaiting payment</Badge>
              )}
            </CardTitle>
            <CardDescription>
              {openInvoice.plan.name} · {openInvoice.periodMonths}{" "}
              {openInvoice.periodMonths === 1 ? "month" : "months"} · {formatMoney(openInvoice.amount)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {awaitingReview ? (
              <Alert>
                <Clock />
                <AlertTitle>We&apos;re checking your payment</AlertTitle>
                <AlertDescription>
                  {openInvoice.method && BILLING_METHOD_LABELS[openInvoice.method]} transaction{" "}
                  <span className="font-mono">{openInvoice.reference}</span> submitted{" "}
                  {openInvoice.submittedAt && formatDateTime(openInvoice.submittedAt)}. Your plan activates as soon
                  as it&apos;s confirmed, usually within a few hours.
                </AlertDescription>
              </Alert>
            ) : (
              <PaymentForm
                storeId={store.id}
                invoice={{
                  id: openInvoice.id,
                  number: formatInvoiceNumber(openInvoice.number),
                  amount: openInvoice.amount,
                  planName: openInvoice.plan.name,
                  periodMonths: openInvoice.periodMonths,
                }}
                instructions={paymentInstructions()}
              />
            )}
          </CardContent>
        </Card>
      )}

      <section className="grid gap-3" aria-labelledby="plans-heading">
        <div>
          <h2 id="plans-heading" className="text-lg font-semibold">
            {plans.length > 1 ? "Plans" : "Pay for your plan"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {plans.length > 1
              ? subscription.status === "TRIAL"
                ? "Try any plan for free during your trial, then pay for the one you want to keep."
                : "Paying for a different plan switches you to it as soon as the payment is confirmed."
              : subscription.status === "TRIAL"
                ? "Pay before your trial ends to keep your store online. Paying for several months at once means fewer renewals."
                : "Pay for one or more months at a time. Renewals extend your current period."}
          </p>
        </div>
        <PlanCards
          storeId={store.id}
          plans={plans.map(({ key, name, description, priceMonthly, maxProducts, maxStaff, customDomain }) => ({
            key,
            name,
            description,
            priceMonthly,
            maxProducts,
            maxStaff,
            customDomain,
          }))}
          currentPlanKey={subscription.plan.key}
          inTrial={subscription.status === "TRIAL"}
          awaitingReview={awaitingReview}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Billing history</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invoices yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-mono text-xs">{formatInvoiceNumber(i.number)}</TableCell>
                      <TableCell>
                        {i.plan.name} · {i.periodMonths} mo
                      </TableCell>
                      <TableCell>{formatDate(i.paidAt ?? i.createdAt)}</TableCell>
                      <TableCell>
                        {i.status === "PAID" ? (
                          <Badge className="bg-emerald-600 text-white">Paid</Badge>
                        ) : i.status === "VOID" ? (
                          <span className="text-muted-foreground" title={i.adminNote ?? undefined}>
                            Cancelled
                          </span>
                        ) : i.submittedAt ? (
                          "Verifying"
                        ) : (
                          "Unpaid"
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatMoney(i.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
