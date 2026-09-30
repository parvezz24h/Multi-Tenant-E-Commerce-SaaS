import { CheckCircle2, Circle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PublishToggle } from "@/components/stores/publish-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { storeHostname } from "@/lib/site";
import { STORE_ROLE_LABELS } from "@/server/rbac/permissions";
import { getStoreContext } from "@/server/tenant/context";

export async function generateMetadata({
  params,
}: PageProps<"/dashboard/[storeSlug]">): Promise<Metadata> {
  const { store } = await getStoreContext((await params).storeSlug);
  return { title: store.name };
}

export default async function StoreOverviewPage({ params }: PageProps<"/dashboard/[storeSlug]">) {
  const { storeSlug } = await params;
  const { store, role, can } = await getStoreContext(storeSlug);

  const checklist = [
    {
      label: "Add your store details",
      done: Boolean(store.contactPhone && store.district),
      href: `/dashboard/${store.slug}/settings`,
    },
    { label: "Choose a theme", done: false },
    { label: "Add your first product", done: false },
    { label: "Publish your store", done: store.status === "ACTIVE" },
  ];

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{store.name}</h1>
        <p className="text-sm text-muted-foreground">
          {storeHostname(store.slug)} · You are {STORE_ROLE_LABELS[role].toLowerCase()}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Get your store ready</CardTitle>
          <CardDescription>
            {checklist.filter((i) => i.done).length} of {checklist.length} steps done
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3">
            {checklist.map(({ label, done, href }) => (
              <li key={label} className="flex items-center gap-3 text-sm">
                {done ? (
                  <CheckCircle2 className="size-5 text-primary" aria-label="Done" />
                ) : (
                  <Circle className="size-5 text-muted-foreground" aria-label="Not done" />
                )}
                {href && !done ? (
                  <Link href={href} className="underline-offset-4 hover:underline">
                    {label}
                  </Link>
                ) : (
                  <span className={done ? "text-muted-foreground line-through" : undefined}>
                    {label}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {can("store:publish") && store.status !== "SUSPENDED" && (
        <Card>
          <CardHeader>
            <CardTitle>Store visibility</CardTitle>
            <CardDescription>
              {store.status === "ACTIVE"
                ? "Your store is live. Customers can visit it once storefronts launch."
                : "Your store is a draft and hidden from customers."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PublishToggle storeId={store.id} published={store.status === "ACTIVE"} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
