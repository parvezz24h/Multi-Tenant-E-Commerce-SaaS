import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";
import { SidebarShell } from "@/components/dashboard/sidebar-shell";
import { StoreSidebar } from "@/components/dashboard/store-sidebar";
import { StoreStatusBadge } from "@/components/stores/store-status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { storeUrl } from "@/lib/hosts";
import { countPendingOrders } from "@/server/orders/service";
import {
  countOwnedStores,
  listStoresForUser,
  MAX_OWNED_STORES_PER_USER,
} from "@/server/stores/service";
import { getStoreContext } from "@/server/tenant/context";

export default async function StoreDashboardLayout({
  children,
  params,
}: LayoutProps<"/dashboard/[storeSlug]">) {
  const { storeSlug } = await params;
  const { store, user, can } = await getStoreContext(storeSlug);
  const [pendingOrders, memberships, owned] = await Promise.all([
    can("orders:read") ? countPendingOrders(store.id) : 0,
    listStoresForUser(user.id),
    countOwnedStores(user.id),
  ]);

  return (
    <SidebarShell
      sidebar={
        <StoreSidebar
          store={{ name: store.name, slug: store.slug, status: store.status, url: storeUrl(store.slug) }}
          stores={memberships.map((m) => ({ name: m.store.name, slug: m.store.slug }))}
          canCreateStore={owned < MAX_OWNED_STORES_PER_USER}
          pendingOrders={pendingOrders}
          user={{
            name: user.name,
            email: user.email,
            isSuperAdmin: user.platformRole === "SUPER_ADMIN",
          }}
        />
      }
      topbar={<Breadcrumbs base={`/dashboard/${store.slug}`} rootLabel={store.name} />}
      topbarEnd={<StoreStatusBadge status={store.status} />}
    >
      {store.status === "SUSPENDED" && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>This store is suspended</AlertTitle>
          <AlertDescription>
            Your storefront is offline. Please contact support to restore it.
          </AlertDescription>
        </Alert>
      )}
      {children}
    </SidebarShell>
  );
}
