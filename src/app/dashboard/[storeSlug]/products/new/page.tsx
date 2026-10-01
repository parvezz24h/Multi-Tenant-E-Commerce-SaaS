import type { Metadata } from "next";

import { ProductForm } from "@/components/catalog/product-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { storeHostname } from "@/lib/site";
import { listCategoryOptions } from "@/server/catalog/categories";
import { getStoreContext } from "@/server/tenant/context";

export const metadata: Metadata = { title: "Add product" };

export default async function NewProductPage({
  params,
}: PageProps<"/dashboard/[storeSlug]/products/new">) {
  const { storeSlug } = await params;
  const { store } = await getStoreContext(storeSlug, "products:write");
  const categories = await listCategoryOptions(store.id);

  return (
    <div className="grid gap-6">
      <PageHeader title="Add product" description="You can add images after saving." />
      <ProductForm
        storeId={store.id}
        categories={categories}
        urlPrefix={`${storeHostname(store.slug)}/products/`}
        defaults={{
          name: "",
          slug: "",
          description: "",
          price: "",
          compareAtPrice: "",
          sku: "",
          categoryId: "",
          status: "ACTIVE",
          featured: false,
          stock: "0",
        }}
      />
    </div>
  );
}
