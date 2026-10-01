import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ImageManager } from "@/components/catalog/image-manager";
import { ProductForm } from "@/components/catalog/product-form";
import { StockAdjustForm } from "@/components/catalog/stock-adjust-form";
import { ConfirmButton } from "@/components/dashboard/confirm-button";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProductStatusBadge } from "@/components/dashboard/status-badges";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/datetime";
import { storeUrl } from "@/lib/hosts";
import { REASON_LABELS } from "@/lib/inventory-reasons";
import { storeHostname } from "@/lib/site";
import { toTakaInput } from "@/lib/validation";
import { deleteProductAction } from "@/server/catalog/actions";
import { listCategoryOptions } from "@/server/catalog/categories";
import { listRecentAdjustments } from "@/server/catalog/inventory";
import { getAdminProduct } from "@/server/catalog/products";
import { MAX_IMAGES_PER_PRODUCT } from "@/server/catalog/schemas";
import { getStoreContext } from "@/server/tenant/context";

type Props = PageProps<"/dashboard/[storeSlug]/products/[productId]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { storeSlug, productId } = await params;
  const { store } = await getStoreContext(storeSlug, "products:read");
  const product = await getAdminProduct(store.id, productId);
  return { title: product?.name ?? "Product" };
}

export default async function EditProductPage({ params, searchParams }: Props) {
  const { storeSlug, productId } = await params;
  const { store, can } = await getStoreContext(storeSlug, "products:write");
  const [product, categories, adjustments] = await Promise.all([
    getAdminProduct(store.id, productId),
    listCategoryOptions(store.id),
    listRecentAdjustments(store.id, { productId, take: 8 }),
  ]);
  if (!product) notFound();
  const { created } = await searchParams;

  const deleteAction = deleteProductAction.bind(null, store.id, product.id);
  const liveUrl =
    store.status === "ACTIVE" && product.status === "ACTIVE"
      ? `${storeUrl(store.slug)}/products/${product.slug}`
      : null;

  return (
    <div className="grid gap-6">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            {product.name} <ProductStatusBadge status={product.status} />
          </span>
        }
        description={`Last updated ${formatDateTime(product.updatedAt)}`}
        actions={
          <>
            {liveUrl && (
              <Button variant="outline" asChild>
                <a href={liveUrl} target="_blank" rel="noopener noreferrer">
                  View in store <ExternalLink />
                </a>
              </Button>
            )}
            {can("products:write") && (
              <ConfirmButton
                label="Delete"
                confirmLabel="Delete product"
                pendingLabel="Deleting…"
                action={deleteAction}
              />
            )}
          </>
        }
      />

      {created && (
        <Alert>
          <AlertDescription>Product created. Add some images so customers can see it.</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
          <CardDescription>The first image is the cover shown in your store.</CardDescription>
        </CardHeader>
        <CardContent>
          <ImageManager
            storeId={store.id}
            productId={product.id}
            productName={product.name}
            images={product.images.map((i) => ({ id: i.id, url: i.url }))}
            maxImages={MAX_IMAGES_PER_PRODUCT}
          />
        </CardContent>
      </Card>

      <ProductForm
        storeId={store.id}
        productId={product.id}
        categories={categories}
        urlPrefix={`${storeHostname(store.slug)}/products/`}
        defaults={{
          name: product.name,
          slug: product.slug,
          description: product.description ?? "",
          price: toTakaInput(product.price),
          compareAtPrice: toTakaInput(product.compareAtPrice),
          sku: product.sku ?? "",
          categoryId: product.categoryId ?? "",
          status: product.status,
          featured: product.featured,
          stock: String(product.stock),
        }}
      />

      <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Adjust stock</CardTitle>
          </CardHeader>
          <CardContent>
            <StockAdjustForm storeId={store.id} productId={product.id} currentStock={product.stock} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Stock history</CardTitle>
          </CardHeader>
          <CardContent>
            {adjustments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No stock changes yet.</p>
            ) : (
              <ul className="divide-y text-sm">
                {adjustments.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
                    <span>
                      <span className={a.delta > 0 ? "text-emerald-600" : "text-destructive"}>
                        {a.delta > 0 ? `+${a.delta}` : a.delta}
                      </span>{" "}
                      {REASON_LABELS[a.reason]}
                      {a.order && ` · order #${a.order.orderNumber}`}
                      {a.note && <span className="text-muted-foreground"> — {a.note}</span>}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      → {a.stockAfter} · {formatDateTime(a.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
