import type { ComponentType } from "react";

import type { StorefrontCategory, StorefrontProductCard, StorefrontStore } from "@/server/storefront/service";

/** Theme settings after merging store overrides onto theme defaults. */
export type ResolvedTheme = {
  key: string;
  primaryColor: string;
  primaryForeground: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl: string | null;
  announcement: string | null;
  footerText: string | null;
};

export type ThemeHeaderProps = {
  store: StorefrontStore;
  theme: ResolvedTheme;
  categories: StorefrontCategory[];
  cartCount: number;
};

export type ThemeFooterProps = { store: StorefrontStore; theme: ResolvedTheme };

export type ThemeHeroProps = { store: StorefrontStore; theme: ResolvedTheme };

export type ThemeProductCardProps = { product: StorefrontProductCard };

export type ThemeCategoryListProps = { categories: StorefrontCategory[] };

/**
 * A ready-made theme: a set of reusable components plus defaults. Stores
 * pick a theme and override its settings; they never edit its markup.
 */
export type ThemeDefinition = {
  key: string;
  name: string;
  description: string;
  defaults: {
    primaryColor: string;
    heroSubtitle: string;
  };
  components: {
    Header: ComponentType<ThemeHeaderProps>;
    Footer: ComponentType<ThemeFooterProps>;
    Hero: ComponentType<ThemeHeroProps>;
    ProductCard: ComponentType<ThemeProductCardProps>;
    CategoryList: ComponentType<ThemeCategoryListProps>;
  };
};
