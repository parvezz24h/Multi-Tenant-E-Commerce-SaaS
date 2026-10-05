import type { Metadata } from "next";

import { SlidesManager } from "@/components/stores/slides-manager";
import { StoreDesignForm } from "@/components/stores/store-design-form";
import { MAX_SLIDES } from "@/server/slides/schemas";
import { listSlides } from "@/server/slides/service";
import { getStoreTheme } from "@/server/stores/service";
import { getStoreContext } from "@/server/tenant/context";
import { getTheme, THEMES } from "@/themes/registry";

export const metadata: Metadata = { title: "Store design" };

export default async function StoreDesignPage({
  params,
}: PageProps<"/dashboard/[storeSlug]/design">) {
  const { storeSlug } = await params;
  const { store } = await getStoreContext(storeSlug, "theme:update");
  const [settings, slides] = await Promise.all([getStoreTheme(store.id), listSlides(store.id)]);
  const theme = getTheme(settings?.themeKey);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Store design</h1>
        <p className="text-sm text-muted-foreground">Choose a theme and make it yours.</p>
      </div>
      <SlidesManager storeId={store.id} slides={slides} maxSlides={MAX_SLIDES} />
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
