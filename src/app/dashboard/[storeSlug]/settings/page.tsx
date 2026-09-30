import type { Metadata } from "next";

import { StoreSettingsForm } from "@/components/stores/store-settings-form";
import { BD_DISTRICTS } from "@/lib/bd-districts";
import { getStoreContext } from "@/server/tenant/context";

export const metadata: Metadata = { title: "Store settings" };

export default async function StoreSettingsPage({
  params,
}: PageProps<"/dashboard/[storeSlug]/settings">) {
  const { storeSlug } = await params;
  const { store } = await getStoreContext(storeSlug, "store:update");

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Your store&apos;s name, address and contact details.
        </p>
      </div>
      <StoreSettingsForm
        storeId={store.id}
        districts={BD_DISTRICTS}
        defaults={{
          name: store.name,
          slug: store.slug,
          description: store.description ?? "",
          logoUrl: store.logoUrl ?? "",
          contactEmail: store.contactEmail ?? "",
          contactPhone: store.contactPhone ?? "",
          addressLine: store.addressLine ?? "",
          district: store.district ?? "",
        }}
      />
    </div>
  );
}
