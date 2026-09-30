import Link from "next/link";

import { requireOpenStore } from "@/server/storefront/context";
import { getFeaturedProducts, listCategories } from "@/server/storefront/service";

export default async function StorefrontHomePage({ params }: PageProps<"/s/[storeSlug]">) {
  const { store, theme, components } = await requireOpenStore((await params).storeSlug);
  const { Hero, CategoryList, ProductCard } = components;
  const [categories, featured] = await Promise.all([
    listCategories(store.id),
    getFeaturedProducts(store.id),
  ]);

  return (
    <div className="grid gap-12">
      <Hero store={store} theme={theme} />

      {categories.length > 0 && (
        <section aria-labelledby="categories-heading" className="grid gap-4">
          <h2 id="categories-heading" className="text-xl font-semibold tracking-tight">
            Shop by category
          </h2>
          <CategoryList categories={categories} />
        </section>
      )}

      <section aria-labelledby="featured-heading" className="grid gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="featured-heading" className="text-xl font-semibold tracking-tight">
            Featured products
          </h2>
          {featured.length > 0 && (
            <Link href="/products" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          )}
        </div>
        {featured.length > 0 ? (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
            New products are coming soon.
          </p>
        )}
      </section>
    </div>
  );
}
