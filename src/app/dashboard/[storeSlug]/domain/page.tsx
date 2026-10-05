import { ArrowRight, CheckCircle2, Clock, ExternalLink, Lock } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

import { PageHeader } from "@/components/dashboard/page-header";
import { AddDomainForm } from "@/components/domains/add-domain-form";
import { CopyButton, DomainActions } from "@/components/domains/domain-controls";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/datetime";
import { storeUrl } from "@/lib/hosts";
import { storeHostname } from "@/lib/site";
import { getSubscription, listPlans } from "@/server/billing/service";
import { domainProviderName, getStoreDomain } from "@/server/domains/service";
import { getStoreContext } from "@/server/tenant/context";

export const metadata: Metadata = { title: "Domain" };

export default async function DomainPage({ params }: PageProps<"/dashboard/[storeSlug]/domain">) {
  const { storeSlug } = await params;
  const { store } = await getStoreContext(storeSlug, "domains:manage");
  const [domain, subscription, plans] = await Promise.all([
    getStoreDomain(store.id),
    getSubscription(store.id),
    listPlans(),
  ]);
  const planAllows = !subscription || subscription.plan.customDomain;
  const domainPlans = plans.filter((p) => p.customDomain);
  const active = domain?.status === "ACTIVE";

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Domain"
        description="Use your own web address for your store. Your free address keeps working too."
      />

      <Card>
        <CardHeader>
          <CardTitle>Free store address</CardTitle>
          <CardDescription>Always available, even after you connect your own domain.</CardDescription>
        </CardHeader>
        <CardContent>
          <a
            href={storeUrl(store.slug)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-medium hover:underline"
          >
            {storeHostname(store.slug)} <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </CardContent>
      </Card>

      {!domain ? (
        <Card>
          <CardHeader>
            <CardTitle>Connect your own domain</CardTitle>
            <CardDescription>
              Buy a domain from any registrar (for example a .com or .com.bd), then connect it here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {planAllows ? (
              <AddDomainForm storeId={store.id} />
            ) : (
              <div className="grid justify-items-start gap-3">
                <p className="text-sm text-muted-foreground">
                  Custom domains aren&apos;t included in your plan
                  {domainPlans.length > 0 && <> — they come with {domainPlans.map((p) => p.name).join(" and ")}</>}.
                </p>
                {domainPlans.length > 0 && (
                  <Button asChild>
                    <Link href={`/dashboard/${store.slug}/billing`}>Upgrade your plan</Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              {domain.hostname}
              {active ? (
                <Badge className="bg-emerald-600 text-white">
                  <CheckCircle2 /> Connected
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <Clock /> Waiting for DNS
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {domain.lastCheckedAt ? `Last checked ${formatDateTime(domain.lastCheckedAt)}` : "Not checked yet"}
              {domain.verifiedAt && ` · Connected since ${formatDateTime(domain.verifiedAt)}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            {active ? (
              <Alert>
                <Lock />
                <AlertTitle>Your store is live at {domain.hostname}</AlertTitle>
                <AlertDescription>
                  <span>
                    HTTPS is set up automatically. A new certificate can take a few minutes after the first
                    connection.{" "}
                    <a
                      href={`https://${domain.hostname}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-foreground underline underline-offset-4"
                    >
                      Visit your store
                    </a>
                  </span>
                </AlertDescription>
              </Alert>
            ) : (
              domain.lastError && (
                <Alert>
                  <Clock />
                  <AlertTitle>Not connected yet</AlertTitle>
                  <AlertDescription>{domain.lastError}</AlertDescription>
                </Alert>
              )
            )}

            {domain.redirectHostname && (
              <div className="grid gap-1 rounded-lg border p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{domain.redirectHostname}</span>
                  <ArrowRight className="size-3.5 text-muted-foreground" aria-label="forwards to" />
                  <span className="text-muted-foreground">{domain.hostname}</span>
                  {domain.redirectActive ? (
                    <Badge className="bg-emerald-600 text-white">
                      <CheckCircle2 /> Forwarding
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <Clock /> Waiting for DNS
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground">
                  {domain.redirectActive
                    ? `Visitors who type ${domain.redirectHostname} are sent to ${domain.hostname}.`
                    : (domain.redirectError ??
                      `Add the record marked “forwarding” below so ${domain.redirectHostname} works too.`)}
                </p>
              </div>
            )}

            <div className="grid gap-3">
              <div>
                <h3 className="font-medium">DNS records</h3>
                <p className="text-sm text-muted-foreground">
                  {active
                    ? "Keep these records in place at your domain provider."
                    : "Log in where you bought the domain, open its DNS settings and add these records. Then press “Check now”."}
                </p>
              </div>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Name / Host</TableHead>
                      <TableHead>Value / Points to</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {domain.records.map((r) => (
                      <TableRow key={`${r.type}-${r.name}-${r.value}`}>
                        <TableCell className="font-mono text-xs">
                          {r.type}
                          {r.purpose !== "routing" && (
                            <div className="font-sans text-[11px] text-muted-foreground">
                              {r.purpose === "verification" ? "ownership" : "forwarding"}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1 font-mono text-xs">
                            {r.name}
                            <CopyButton value={r.name} label={`${r.type} name`} />
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex max-w-full items-center gap-1 font-mono text-xs break-all">
                            {r.value}
                            <CopyButton value={r.value} label={`${r.type} value`} />
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground">
                “@” means the domain itself. Remove other A or CNAME records for the same name, and turn off
                any proxy (e.g. Cloudflare’s orange cloud) until the domain is connected.
              </p>
            </div>

            <DomainActions storeId={store.id} hostname={domain.hostname} active={active} />
            <p className="text-xs text-muted-foreground">
              To use a different domain, remove this one first, then connect the new one.
            </p>
          </CardContent>
        </Card>
      )}

      {domainProviderName() === "dns" && process.env.NODE_ENV === "production" && (
        <Alert variant="destructive">
          <AlertTitle>Hosting isn&apos;t set up for custom domains</AlertTitle>
          <AlertDescription>
            The platform can check your DNS, but traffic won&apos;t reach your store until the platform
            administrator configures domain hosting. Please contact support.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
