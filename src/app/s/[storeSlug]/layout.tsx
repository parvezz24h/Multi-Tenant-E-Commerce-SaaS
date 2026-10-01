import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";

import { getCart } from "@/server/cart/service";
import { getStorefrontStore, isStoreOpen, listCategories } from "@/server/storefront/service";
import { getTheme, resolveTheme } from "@/themes/registry";

export async function generateMetadata({
  params,
}: LayoutProps<"/s/[storeSlug]">): Promise<Metadata> {
  const store = await getStorefrontStore((await params).storeSlug);
  if (!store) return {};
  return {
    title: { default: store.name, template: `%s · ${store.name}` },
    description: store.description ?? undefined,
    robots: (await isStoreOpen(store)) ? undefined : { index: false, follow: false },
  };
}

export default async function StorefrontLayout({
  children,
  params,
}: LayoutProps<"/s/[storeSlug]">) {
  const { storeSlug } = await params;
  const store = await getStorefrontStore(storeSlug);
  if (!store) notFound();

  // Draft, suspended and unpaid stores are not public. Show the same neutral
  // page for all of them so the reason isn't advertised to shoppers.
  if (!(await isStoreOpen(store))) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{store.name}</h1>
        <p className="text-muted-foreground">This store isn&apos;t open right now. Please check back soon.</p>
      </main>
    );
  }

  const theme = resolveTheme(store);
  const { Header, Footer } = getTheme(theme.key).components;
  const [categories, cart] = await Promise.all([listCategories(store.id), getCart(store.id)]);

  // Theme colors override the shadcn tokens for everything inside the storefront.
  const style = {
    "--primary": theme.primaryColor,
    "--primary-foreground": theme.primaryForeground,
    "--ring": theme.primaryColor,
  } as CSSProperties;

  return (
    <div style={style} className="flex flex-1 flex-col">
      <Header store={store} theme={theme} categories={categories} cartCount={cart.itemCount} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
      <Footer store={store} theme={theme} categories={categories} />
    </div>
  );
}
