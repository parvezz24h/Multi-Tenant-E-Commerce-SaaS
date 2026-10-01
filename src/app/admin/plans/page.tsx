import type { Metadata } from "next";

import { PlanForm } from "@/components/admin/plan-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toTakaInput } from "@/lib/validation";
import { requireSuperAdmin } from "@/server/auth/session";
import { listPlans } from "@/server/billing/service";

export const metadata: Metadata = { title: "Plans" };

export default async function AdminPlansPage() {
  await requireSuperAdmin();
  const plans = await listPlans({ activeOnly: false });

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Plans"
        description="Price and limit changes apply immediately. Existing invoices keep the price they were created with."
      />
      {plans.map((plan) => (
        <Card key={plan.id}>
          <CardHeader>
            <CardTitle>{plan.name}</CardTitle>
            <CardDescription className="font-mono text-xs">{plan.key}</CardDescription>
          </CardHeader>
          <CardContent>
            <PlanForm
              plan={{
                id: plan.id,
                key: plan.key,
                name: plan.name,
                description: plan.description ?? "",
                price: toTakaInput(plan.priceMonthly),
                maxProducts: plan.maxProducts === null ? "" : String(plan.maxProducts),
                maxStaff: plan.maxStaff === null ? "" : String(plan.maxStaff),
                customDomain: plan.customDomain,
                isActive: plan.isActive,
              }}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
