"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { FormField } from "@/components/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { HEX_COLOR } from "@/lib/color";
import { cn } from "@/lib/utils";
import { updateStoreThemeAction } from "@/server/stores/actions";

type Defaults = {
  themeKey: string;
  primaryColor: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl: string;
  announcement: string;
  footerText: string;
};

type Props = {
  storeId: string;
  themes: { key: string; name: string; description: string }[];
  defaults: Defaults;
  placeholders: { heroTitle: string; heroSubtitle: string };
};

const SWATCHES = ["#0f766e", "#15803d", "#1d4ed8", "#7c3aed", "#be185d", "#c2410c", "#b91c1c", "#171717"];

export function StoreDesignForm({ storeId, themes, defaults, placeholders }: Props) {
  const [state, formAction, pending] = useActionState(
    updateStoreThemeAction.bind(null, storeId),
    {},
  );
  const [themeKey, setThemeKey] = useState(defaults.themeKey);
  const [color, setColor] = useState(defaults.primaryColor);
  const errors = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.ok && state.message) toast.success(state.message);
  }, [state]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  const field = (name: keyof Defaults) => ({
    id: name,
    name,
    defaultValue: defaults[name],
    "aria-invalid": !!errors[name],
    "aria-describedby": `${name}-desc`,
  });

  return (
    <form method="post" onSubmit={onSubmit} className="grid gap-6">
      {state.ok === false && state.message && (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>A ready-made design for your storefront. More themes are coming.</CardDescription>
        </CardHeader>
        <CardContent>
          <input type="hidden" name="themeKey" value={themeKey} />
          <div role="radiogroup" aria-label="Theme" className="grid gap-3 sm:grid-cols-2">
            {themes.map((t) => (
              <button
                key={t.key}
                type="button"
                role="radio"
                aria-checked={themeKey === t.key}
                onClick={() => setThemeKey(t.key)}
                className={cn(
                  "grid gap-1 rounded-lg border p-4 text-left transition-colors",
                  themeKey === t.key ? "border-primary ring-2 ring-primary/20" : "hover:bg-muted/50",
                )}
              >
                <span className="font-medium">{t.name}</span>
                <span className="text-sm text-muted-foreground">{t.description}</span>
              </button>
            ))}
          </div>
          {errors.themeKey && <p className="mt-2 text-sm text-destructive">{errors.themeKey[0]}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Brand color</CardTitle>
          <CardDescription>Used for buttons, highlights and the hero banner.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Suggested colors">
            {SWATCHES.map((swatch) => (
              <button
                key={swatch}
                type="button"
                onClick={() => setColor(swatch)}
                aria-label={`Use ${swatch}`}
                aria-pressed={color.toLowerCase() === swatch}
                className={cn(
                  "size-8 rounded-full border-2 border-background ring-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  color.toLowerCase() === swatch && "ring-2 ring-foreground",
                )}
                style={{ backgroundColor: swatch }}
              />
            ))}
          </div>
          <FormField id="primaryColor" label="Hex color" errors={errors.primaryColor}>
            <div className="flex items-center gap-3">
              <input
                type="color"
                aria-label="Pick a color"
                value={HEX_COLOR.test(color) ? color : "#000000"}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded-md border bg-transparent p-1"
              />
              <Input
                id="primaryColor"
                name="primaryColor"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-32 font-mono"
                maxLength={7}
                spellCheck={false}
                aria-invalid={!!errors.primaryColor}
                aria-describedby="primaryColor-desc"
              />
            </div>
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Homepage</CardTitle>
          <CardDescription>Leave a field empty to use the default shown.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <FormField id="announcement" label="Announcement bar" errors={errors.announcement}>
            <Input {...field("announcement")} maxLength={120} placeholder="Free delivery inside Dhaka this week!" />
          </FormField>
          <FormField id="heroTitle" label="Hero title" errors={errors.heroTitle}>
            <Input {...field("heroTitle")} maxLength={80} placeholder={placeholders.heroTitle} />
          </FormField>
          <FormField id="heroSubtitle" label="Hero subtitle" errors={errors.heroSubtitle}>
            <Textarea {...field("heroSubtitle")} rows={2} maxLength={200} placeholder={placeholders.heroSubtitle} />
          </FormField>
          <FormField
            id="heroImageUrl"
            label="Hero image URL"
            errors={errors.heroImageUrl}
            hint="Optional. Without an image, the hero uses your brand color."
          >
            <Input {...field("heroImageUrl")} type="url" placeholder="https://" />
          </FormField>
          <FormField id="footerText" label="Footer text" errors={errors.footerText}>
            <Input {...field("footerText")} maxLength={200} placeholder="Open every day, 10am–10pm" />
          </FormField>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save design"}
        </Button>
      </div>
    </form>
  );
}
