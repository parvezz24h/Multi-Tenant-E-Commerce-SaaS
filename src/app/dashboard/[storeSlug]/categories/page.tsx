import type { Metadata } from "next";

import { CategoryForm } from "@/components/catalog/category-form";
import { CategoryRow } from "@/components/catalog/category-row";
import { EmptyState, PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAdminCategories } from "@/server/catalog/categories";
import { getStoreContext } from "@/server/tenant/context";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage({
  params,
}: PageProps<"/dashboard/[storeSlug]/categories">) {
  const { storeSlug } = await params;
  const { store } = await getStoreContext(storeSlug, "products:write");
  const categories = await listAdminCategories(store.id);

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Categories"
        description="Group products so customers can browse them. Empty categories are hidden in your store."
      />

      <Card>
        <CardHeader>
          <CardTitle>Add category</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryForm storeId={store.id} />
        </CardContent>
      </Card>

      {categories.length === 0 ? (
        <EmptyState title="No categories yet" />
      ) : (
        <ul className="divide-y rounded-xl border">
          {categories.map((category) => (
            <CategoryRow
              key={category.id}
              storeId={store.id}
              category={category}
              productsHref={`/dashboard/${store.slug}/products`}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
