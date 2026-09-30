import type { Metadata } from "next";

import { StoreDesignForm } from "@/components/stores/store-design-form";
import { getStoreTheme } from "@/server/stores/service";
import { getStoreContext } from "@/server/tenant/context";
import { getTheme, THEMES } from "@/themes/registry";

export const metadata: Metadata = { title: "Store design" };

export default async function StoreDesignPage({
  params,
}: PageProps<"/dashboard/[storeSlug]/design">) {
  const { storeSlug } = await params;
  const { store } = await getStoreContext(storeSlug, "theme:update");
  const settings = await getStoreTheme(store.id);
  const theme = getTheme(settings?.themeKey);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Store design</h1>
        <p className="text-sm text-muted-foreground">Choose a theme and make it yours.</p>
      </div>
      <StoreDesignForm
        storeId={store.id}
        themes={Object.values(THEMES).map(({ key, name, description }) => ({ key, name, description }))}
        defaults={{
          themeKey: theme.key,
          primaryColor: settings?.primaryColor ?? theme.defaults.primaryColor,
          heroTitle: settings?.heroTitle ?? "",
          heroSubtitle: settings?.heroSubtitle ?? "",
          heroImageUrl: settings?.heroImageUrl ?? "",
          announcement: settings?.announcement ?? "",
          footerText: settings?.footerText ?? "",
        }}
        placeholders={{
          heroTitle: `Welcome to ${store.name}`,
          heroSubtitle: store.description || theme.defaults.heroSubtitle,
        }}
      />
    </div>
  );
}
