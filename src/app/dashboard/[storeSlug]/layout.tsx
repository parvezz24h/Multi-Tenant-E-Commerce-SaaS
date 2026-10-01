import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";
import { SidebarShell } from "@/components/dashboard/sidebar-shell";
import { StoreSidebar } from "@/components/dashboard/store-sidebar";
import { SubscriptionBanner } from "@/components/billing/subscription-banner";
import { StoreStatusBadge } from "@/components/stores/store-status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { storeUrl } from "@/lib/hosts";
import { getSubscription } from "@/server/billing/service";
import { getActiveDomain } from "@/server/domains/service";
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
  const [pendingOrders, memberships, owned, customDomain, subscription] = await Promise.all([
    can("orders:read") ? countPendingOrders(store.id) : 0,
    listStoresForUser(user.id),
    countOwnedStores(user.id),
    getActiveDomain(store.id),
    getSubscription(store.id),
  ]);

  return (
    <SidebarShell
      sidebar={
        <StoreSidebar
          store={{ name: store.name, slug: store.slug, status: store.status, url: storeUrl(store.slug, { customDomain }) }}
          stores={memberships.map((m) => ({ name: m.store.name, slug: m.store.slug }))}
          canCreateStore={owned < MAX_OWNED_STORES_PER_USER}
          pendingOrders={pendingOrders}
          canManageDomain={can("domains:manage")}
          canManageBilling={can("billing:manage")}
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
      {subscription && (
        <SubscriptionBanner
          subscription={subscription}
          billingHref={can("billing:manage") ? `/dashboard/${store.slug}/billing` : null}
        />
      )}
      {children}
    </SidebarShell>
  );
}
