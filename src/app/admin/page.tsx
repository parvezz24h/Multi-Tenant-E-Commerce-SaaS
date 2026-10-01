import type { Metadata } from "next";

import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSuperAdmin } from "@/server/auth/session";
import { getPlatformStats } from "@/server/admin/service";

export const metadata: Metadata = { title: "Platform admin" };

export default async function AdminOverviewPage() {
  await requireSuperAdmin();
  const stats = await getPlatformStats();

  const tiles = [
    { label: "Users", value: stats.users },
    { label: "Stores", value: stats.stores },
    { label: "Live stores", value: stats.activeStores },
    { label: "Suspended", value: stats.suspendedStores },
  ];

  return (
    <div className="grid gap-6">
      <PageHeader title="Platform overview" description="Stores and merchants across ShopCreatorBD." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(({ label, value }) => (
          <Card key={label}>
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-3xl tabular-nums">{value.toLocaleString("en-US")}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
