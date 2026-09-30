import type { Metadata } from "next";
import Link from "next/link";

import { AppHeader } from "@/components/dashboard/app-header";
import { CreateStoreForm } from "@/components/stores/create-store-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/lib/site";
import { requireUser } from "@/server/auth/session";
import { countOwnedStores, MAX_OWNED_STORES_PER_USER } from "@/server/stores/service";

export const metadata: Metadata = { title: "Create your store" };

export default async function OnboardingPage() {
  const user = await requireUser();
  const limitReached = (await countOwnedStores(user.id)) >= MAX_OWNED_STORES_PER_USER;

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-lg px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {limitReached ? "You already have a store" : "Create your store"}
            </CardTitle>
            <CardDescription>
              {limitReached
                ? "Each account can own one store for now."
                : `Pick a name and web address. Your store will be available at your-address.${siteConfig.rootDomain}.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {limitReached ? (
              <Button asChild>
                <Link href="/dashboard">Go to my store</Link>
              </Button>
            ) : (
              <CreateStoreForm />
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
