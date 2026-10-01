import type { Metadata } from "next";

import { TrackOrderForm } from "@/components/storefront/track-order-form";
import { requireOpenStore } from "@/server/storefront/context";

export const metadata: Metadata = { title: "Track your order" };

export default async function TrackOrderPage({ params }: PageProps<"/s/[storeSlug]/track">) {
  const { store } = await requireOpenStore((await params).storeSlug);

  return (
    <div className="mx-auto grid w-full max-w-sm gap-6 py-6">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Track your order</h1>
        <p className="text-sm text-muted-foreground">
          Enter your order number and the mobile number you ordered with.
        </p>
      </div>
      <TrackOrderForm storeId={store.id} />
    </div>
  );
}
