"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { FormField } from "@/components/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createProductAction, updateProductAction } from "@/server/catalog/actions";
import type { ActionState } from "@/server/errors";
import { slugify } from "@/server/stores/schemas";

export type ProductFormValues = {
  name: string;
  slug: string;
  description: string;
  price: string;
  compareAtPrice: string;
  sku: string;
  categoryId: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  featured: boolean;
  stock: string;
};

type Props = {
  storeId: string;
  /** Omit to create a new product. */
  productId?: string;
  defaults: ProductFormValues;
  categories: { id: string; name: string }[];
  /** Shown next to the URL field, e.g. "rahim.shopcreatorbd.vercel.app/products/". */
  urlPrefix: string;
};

const NO_CATEGORY = "__none";

export function ProductForm({ storeId, productId, defaults, categories, urlPrefix }: Props) {
  const isNew = !productId;
  const action = isNew
    ? createProductAction.bind(null, storeId)
    : updateProductAction.bind(null, storeId, productId);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});
  const [name, setName] = useState(defaults.name);
  const [slug, setSlug] = useState(defaults.slug);
  const [slugEdited, setSlugEdited] = useState(!isNew);
  const [categoryId, setCategoryId] = useState(defaults.categoryId || NO_CATEGORY);
  const [status, setStatus] = useState(defaults.status);
  const errors = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.ok && state.message) toast.success(state.message);
  }, [state]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  const describe = (field: string) => ({
    "aria-invalid": !!errors[field],
    "aria-describedby": `${field}-desc`,
  });

  return (
    <form method="post" onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="grid content-start gap-6">
        {state.ok === false && state.message && (
          <Alert variant="destructive">
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <FormField id="name" label="Product name" errors={errors.name}>
              <Input
                id="name"
                name="name"
                value={name}
                required
                maxLength={120}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slugEdited) setSlug(slugify(e.target.value, 80));
                }}
                {...describe("name")}
              />
            </FormField>
            <FormField
              id="slug"
              label="URL"
              errors={errors.slug}
              hint={`${urlPrefix}${slug || "product-name"}`}
            >
              <Input
                id="slug"
                name="slug"
                value={slug}
                required
                maxLength={80}
                autoCapitalize="none"
                spellCheck={false}
                onChange={(e) => {
                  setSlugEdited(true);
                  setSlug(e.target.value.toLowerCase());
                }}
                {...describe("slug")}
              />
            </FormField>
            <FormField id="description" label="Description" errors={errors.description}>
              <Textarea
                id="description"
                name="description"
                rows={6}
                maxLength={5000}
                defaultValue={defaults.description}
                {...describe("description")}
              />
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
            <CardDescription>In taka. Leave “Compare at” empty unless the product is on sale.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField id="price" label="Price (৳)" errors={errors.price}>
              <Input
                id="price"
                name="price"
                inputMode="decimal"
                required
                defaultValue={defaults.price}
                placeholder="1250"
                {...describe("price")}
              />
            </FormField>
            <FormField
              id="compareAtPrice"
              label="Compare at price (৳)"
              errors={errors.compareAtPrice}
            >
              <Input
                id="compareAtPrice"
                name="compareAtPrice"
                inputMode="decimal"
                defaultValue={defaults.compareAtPrice}
                placeholder="1500"
                {...describe("compareAtPrice")}
              />
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField id="sku" label="SKU" errors={errors.sku} hint="Optional code for your own records.">
              <Input id="sku" name="sku" maxLength={64} defaultValue={defaults.sku} {...describe("sku")} />
            </FormField>
            {isNew ? (
              <FormField id="stock" label="Stock quantity" errors={errors.stock}>
                <Input
                  id="stock"
                  name="stock"
                  inputMode="numeric"
                  required
                  defaultValue={defaults.stock}
                  {...describe("stock")}
                />
              </FormField>
            ) : (
              <div className="grid gap-2">
                <Label>Stock quantity</Label>
                <p className="text-sm">
                  <span className="font-medium tabular-nums">{defaults.stock}</span>{" "}
                  <span className="text-muted-foreground">— change it from the stock panel.</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid content-start gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Visibility</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <FormField
              id="status"
              label="Status"
              errors={errors.status}
              hint={
                status === "ACTIVE"
                  ? "Visible in your store."
                  : status === "DRAFT"
                    ? "Hidden until you make it active."
                    : "Hidden and kept for your records."
              }
            >
              <input type="hidden" name="status" value={status} />
              <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                <SelectTrigger id="status" className="w-full" {...describe("status")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField id="categoryId" label="Category" errors={errors.categoryId}>
              <input type="hidden" name="categoryId" value={categoryId === NO_CATEGORY ? "" : categoryId} />
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="categoryId" className="w-full" {...describe("categoryId")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CATEGORY}>No category</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <div className="flex items-start gap-3">
              <Checkbox id="featured" name="featured" defaultChecked={defaults.featured} />
              <div className="grid gap-1">
                <Label htmlFor="featured">Feature on homepage</Label>
                <p className="text-xs text-muted-foreground">Featured products appear first.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={pending} size="lg">
          {pending ? "Saving…" : isNew ? "Create product" : "Save product"}
        </Button>
      </div>
    </form>
  );
}
