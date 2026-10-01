"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveCategoryAction } from "@/server/catalog/actions";
import type { ActionState } from "@/server/errors";
import { slugify } from "@/server/stores/schemas";

type Defaults = { name: string; slug: string; description: string; sortOrder: string };

type Props = {
  storeId: string;
  /** Omit to create. */
  categoryId?: string;
  defaults?: Defaults;
  onDone?: () => void;
  onCancel?: () => void;
};

const EMPTY: Defaults = { name: "", slug: "", description: "", sortOrder: "0" };

export function CategoryForm({ storeId, categoryId, defaults = EMPTY, onDone, onCancel }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<ActionState>({});
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(defaults.name);
  const [slug, setSlug] = useState(defaults.slug);
  const [slugEdited, setSlugEdited] = useState(Boolean(categoryId));
  const errors = state.fieldErrors ?? {};
  const prefix = categoryId ?? "new";

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveCategoryAction(storeId, categoryId ?? null, {}, formData);
      setState(result);
      if (!result.ok) return;
      toast.success(result.message);
      if (!categoryId) {
        formRef.current?.reset();
        setName("");
        setSlug("");
        setSlugEdited(false);
      }
      onDone?.();
    });
  }

  const id = (field: string) => `${prefix}-${field}`;

  return (
    <form ref={formRef} onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      {state.ok === false && state.message && (
        <p className="text-sm text-destructive sm:col-span-2">{state.message}</p>
      )}
      <FormField id={id("name")} label="Name" errors={errors.name}>
        <Input
          id={id("name")}
          name="name"
          value={name}
          required
          maxLength={60}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugEdited) setSlug(slugify(e.target.value, 80));
          }}
          aria-invalid={!!errors.name}
          aria-describedby={`${id("name")}-desc`}
        />
      </FormField>
      <FormField id={id("slug")} label="URL" errors={errors.slug}>
        <Input
          id={id("slug")}
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
          aria-invalid={!!errors.slug}
          aria-describedby={`${id("slug")}-desc`}
        />
      </FormField>
      <FormField id={id("description")} label="Description (optional)" errors={errors.description}>
        <Input id={id("description")} name="description" maxLength={300} defaultValue={defaults.description} />
      </FormField>
      <FormField
        id={id("sortOrder")}
        label="Position"
        errors={errors.sortOrder}
        hint="Lower numbers show first."
      >
        <Input
          id={id("sortOrder")}
          name="sortOrder"
          inputMode="numeric"
          defaultValue={defaults.sortOrder}
          aria-describedby={`${id("sortOrder")}-desc`}
        />
      </FormField>
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : categoryId ? "Save" : "Add category"}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
