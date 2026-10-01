import { AppHeader } from "@/components/dashboard/app-header";
import { StoreNav } from "@/components/dashboard/store-nav";
import { StoreStatusBadge } from "@/components/stores/store-status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { countPendingOrders } from "@/server/orders/service";
import { getStoreContext } from "@/server/tenant/context";

export default async function StoreDashboardLayout({
  children,
  params,
}: LayoutProps<"/dashboard/[storeSlug]">) {
  const { storeSlug } = await params;
  const { store, can } = await getStoreContext(storeSlug);
  const pendingOrders = can("orders:read") ? await countPendingOrders(store.id) : 0;

  return (
    <>
      <AppHeader>
        <span className="text-muted-foreground" aria-hidden>
          /
        </span>
        <span className="truncate font-medium">{store.name}</span>
        <StoreStatusBadge status={store.status} />
      </AppHeader>
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 md:flex-row">
        <aside className="md:w-56 md:shrink-0">
          <StoreNav storeSlug={store.slug} pendingOrders={pendingOrders} />
        </aside>
        <main className="min-w-0 flex-1">
          {store.status === "SUSPENDED" && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>This store is suspended</AlertTitle>
              <AlertDescription>
                Your storefront is offline. Please contact support to restore it.
              </AlertDescription>
            </Alert>
          )}
          {children}
        </main>
      </div>
    </>
  );
}
