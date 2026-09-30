import "server-only";

import { notFound } from "next/navigation";

import { getTheme, resolveTheme } from "@/themes/registry";

import { getOpenStore } from "./service";

/** Resolve the open store for a storefront page, or 404. Cached per request. */
export async function requireOpenStore(storeSlug: string) {
  const store = await getOpenStore(storeSlug);
  if (!store) notFound();
  const theme = resolveTheme(store);
  return { store, theme, components: getTheme(theme.key).components };
}
