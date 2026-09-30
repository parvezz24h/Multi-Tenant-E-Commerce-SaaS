import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/dashboard/app-header";
import { StoreStatusBadge } from "@/components/stores/store-status-badge";
import { Button } from "@/components/ui/button";
import { STORE_ROLE_LABELS } from "@/server/rbac/permissions";
import { requireUser } from "@/server/auth/session";
import { countOwnedStores, listStoresForUser, MAX_OWNED_STORES_PER_USER } from "@/server/stores/service";

export const metadata: Metadata = { title: "My stores" };

export default async function DashboardIndexPage() {
  const user = await requireUser();
  const [memberships, owned] = await Promise.all([
    listStoresForUser(user.id),
    countOwnedStores(user.id),
  ]);

  if (memberships.length === 0) redirect("/onboarding");
  if (memberships.length === 1) redirect(`/dashboard/${memberships[0]!.store.slug}`);

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-2xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">My stores</h1>
          {owned < MAX_OWNED_STORES_PER_USER && (
            <Button asChild>
              <Link href="/onboarding">Create store</Link>
            </Button>
          )}
        </div>
        <ul className="divide-y rounded-xl border">
          {memberships.map(({ store, role }) => (
            <li key={store.id}>
              <Link
                href={`/dashboard/${store.slug}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{store.name}</div>
                  <div className="text-sm text-muted-foreground">{STORE_ROLE_LABELS[role]}</div>
                </div>
                <StoreStatusBadge status={store.status} />
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
