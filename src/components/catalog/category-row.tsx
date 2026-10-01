"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { ConfirmButton } from "@/components/dashboard/confirm-button";
import { Button } from "@/components/ui/button";
import { deleteCategoryAction } from "@/server/catalog/actions";

import { CategoryForm } from "./category-form";

type Props = {
  storeId: string;
  productsHref: string;
  category: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    sortOrder: number;
    productCount: number;
  };
};

export function CategoryRow({ storeId, productsHref, category }: Props) {
  const [editing, setEditing] = useState(false);
  const close = useCallback(() => setEditing(false), []);

  if (editing) {
    return (
      <li className="p-4">
        <CategoryForm
          storeId={storeId}
          categoryId={category.id}
          defaults={{
            name: category.name,
            slug: category.slug,
            description: category.description ?? "",
            sortOrder: String(category.sortOrder),
          }}
          onDone={close}
          onCancel={close}
        />
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center gap-3 p-4">
      <div className="min-w-0 flex-1">
        <div className="font-medium">{category.name}</div>
        <div className="text-xs text-muted-foreground">
          /{category.slug} ·{" "}
          <Link href={`${productsHref}?category=${category.id}`} className="hover:underline">
            {category.productCount} {category.productCount === 1 ? "product" : "products"}
          </Link>
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
        Edit
      </Button>
      <ConfirmButton
        label="Delete"
        confirmLabel={category.productCount > 0 ? "Delete (products stay)" : "Delete"}
        pendingLabel="Deleting…"
        variant="ghost"
        action={() => deleteCategoryAction(storeId, category.id)}
        aria-label={`Delete ${category.name}`}
      />
    </li>
  );
}
