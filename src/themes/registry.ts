import { HEX_COLOR, readableForeground } from "@/lib/color";
import type { StorefrontStore } from "@/server/storefront/service";

import { ModernCategoryList } from "./modern/category-list";
import { ModernFooter } from "./modern/footer";
import { ModernHeader } from "./modern/header";
import { ModernHero } from "./modern/hero";
import { ModernProductCard } from "./modern/product-card";
import { ModernTrustBar } from "./modern/trust-bar";
import type { ResolvedTheme, ThemeDefinition } from "./types";

const modern: ThemeDefinition = {
  key: "modern",
  name: "Modern",
  description: "Clean and bold, with a colored hero. Works for any kind of shop.",
  defaults: {
    primaryColor: "#0f766e",
    heroSubtitle: "Quality products, delivered to your door. Cash on delivery available.",
  },
  components: {
    Header: ModernHeader,
    Footer: ModernFooter,
    Hero: ModernHero,
    ProductCard: ModernProductCard,
    CategoryList: ModernCategoryList,
    TrustBar: ModernTrustBar,
  },
};

export const THEMES: Record<string, ThemeDefinition> = { [modern.key]: modern };

export const DEFAULT_THEME_KEY = modern.key;

export function getTheme(key: string | null | undefined): ThemeDefinition {
  return (key && THEMES[key]) || THEMES[DEFAULT_THEME_KEY]!;
}

/** Merge a store's theme overrides onto the theme's defaults. */
export function resolveTheme(store: Pick<StorefrontStore, "name" | "description" | "theme">): ResolvedTheme {
  const settings = store.theme;
  const definition = getTheme(settings?.themeKey);
  const primaryColor =
    settings?.primaryColor && HEX_COLOR.test(settings.primaryColor)
      ? settings.primaryColor
      : definition.defaults.primaryColor;

  return {
    key: definition.key,
    primaryColor,
    primaryForeground: readableForeground(primaryColor),
    heroTitle: settings?.heroTitle || `Welcome to ${store.name}`,
    heroSubtitle: settings?.heroSubtitle || store.description || definition.defaults.heroSubtitle,
    heroImageUrl: settings?.heroImageUrl || null,
    announcement: settings?.announcement || null,
    footerText: settings?.footerText || null,
  };
}
