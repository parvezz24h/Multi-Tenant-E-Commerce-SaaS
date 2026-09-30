"use client";

import { useActionState, useState } from "react";

import { FormField } from "@/components/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { siteConfig } from "@/lib/site";
import { createStoreAction } from "@/server/stores/actions";
import { SLUG_MAX, slugify } from "@/server/stores/schemas";

export function CreateStoreForm() {
  const [state, formAction, pending] = useActionState(createStoreAction, {});
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);

  return (
    <form action={formAction} className="grid gap-4">
      {state.message && (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      <FormField id="name" label="Store name" errors={state.fieldErrors?.name}>
        <Input
          id="name"
          name="name"
          placeholder="Rahim Fashion"
          required
          maxLength={80}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugEdited) setSlug(slugify(e.target.value));
          }}
          aria-invalid={!!state.fieldErrors?.name}
          aria-describedby="name-desc"
        />
      </FormField>
      <FormField
        id="slug"
        label="Store address"
        errors={state.fieldErrors?.slug}
        hint={`${slug || "your-store"}.${siteConfig.rootDomain}`}
      >
        <Input
          id="slug"
          name="slug"
          placeholder="rahim-fashion"
          required
          maxLength={SLUG_MAX}
          value={slug}
          onChange={(e) => {
            setSlugEdited(true);
            setSlug(e.target.value.toLowerCase());
          }}
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={!!state.fieldErrors?.slug}
          aria-describedby="slug-desc"
        />
      </FormField>
      <Button type="submit" disabled={pending}>
        {pending ? "Creating store…" : "Create store"}
      </Button>
    </form>
  );
}
