import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import {
  FilterTabs,
  firstParam,
  hrefWith,
  Pagination,
  parsePage,
  SearchBox,
} from "@/components/dashboard/list-controls";
import { EmptyState, PageHeader } from "@/components/dashboard/page-header";
import { ProductStatusBadge, StockLevel } from "@/components/dashboard/status-badges";
import { ProductImage } from "@/components/storefront/product-image";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ProductStatus } from "@/generated/prisma/enums";
import { formatMoney } from "@/lib/money";
import { listAdminProducts } from "@/server/catalog/products";
import { LOW_STOCK_THRESHOLD } from "@/server/catalog/schemas";
import { getStoreContext } from "@/server/tenant/context";

export const metadata: Metadata = { title: "Products" };

const STATUS_FILTERS: { label: string; value?: ProductStatus }[] = [
  { label: "All" },
  { label: "Active", value: "ACTIVE" },
  { label: "Draft", value: "DRAFT" },
  { label: "Archived", value: "ARCHIVED" },
];

export default async function ProductsPage({
  params,
  searchParams,
}: PageProps<"/dashboard/[storeSlug]/products">) {
  const { storeSlug } = await params;
  const { store, can } = await getStoreContext(storeSlug, "products:read");
  const sp = await searchParams;
  const q = firstParam(sp.q);
  const statusParam = firstParam(sp.status);
  const status = STATUS_FILTERS.find((f) => f.value === statusParam)?.value;
  const categoryId = firstParam(sp.category);

  const result = await listAdminProducts(store.id, {
    q,
    status,
    categoryId,
    page: parsePage(sp.page),
  });
  const base = `/dashboard/${store.slug}/products`;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Products"
        description={`${result.total} ${result.total === 1 ? "product" : "products"}`}
        actions={
          can("products:write") && (
            <Button asChild>
              <Link href={`${base}/new`}>
                <Plus /> Add product
              </Link>
            </Button>
          )
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          items={STATUS_FILTERS.map((f) => ({
            label: f.label,
            href: hrefWith(base, { status: f.value, q, category: categoryId }),
            active: f.value === status,
          }))}
        />
        <SearchBox action={base} defaultValue={q} placeholder="Search name or SKU" keep={{ status, category: categoryId }} />
      </div>

      {result.items.length === 0 ? (
        <EmptyState title={q || status || categoryId ? "No products match" : "No products yet"}>
          {!q && !status && !categoryId && can("products:write") && (
            <Button asChild>
              <Link href={`${base}/new`}>Add your first product</Link>
            </Button>
          )}
        </EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">
                  <span className="sr-only">Image</span>
                </TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <ProductImage url={p.images[0]?.url} alt={p.name} className="size-10 rounded-md" sizes="40px" />
                  </TableCell>
                  <TableCell>
                    <Link href={`${base}/${p.id}`} className="font-medium hover:underline">
                      {p.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {p.category?.name ?? "No category"}
                      {p.featured && " · Featured"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <ProductStatusBadge status={p.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatMoney(p.price)}</TableCell>
                  <TableCell className="text-right">
                    <StockLevel stock={p.stock} low={LOW_STOCK_THRESHOLD} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Pagination
        page={result.page}
        pageCount={result.pageCount}
        hrefFor={(page) => hrefWith(base, { status, q, category: categoryId, page })}
      />
    </div>
  );
}
