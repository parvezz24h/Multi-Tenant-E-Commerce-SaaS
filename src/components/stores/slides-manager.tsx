"use client";

import { ArrowDown, ArrowUp, Eye, EyeOff, ImagePlus, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import { startTransition, useActionState, useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { ConfirmButton } from "@/components/dashboard/confirm-button";
import { FormField } from "@/components/form-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState } from "@/server/errors";
import {
  deleteSlideAction,
  moveSlideAction,
  saveSlideAction,
  setSlideActiveAction,
} from "@/server/slides/actions";

export type SlideRow = {
  id: string;
  imageUrl: string;
  title: string | null;
  subtitle: string | null;
  buttonLabel: string | null;
  linkUrl: string | null;
  isActive: boolean;
};

type Props = { storeId: string; slides: SlideRow[]; maxSlides: number };

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp";

export function SlidesManager({ storeId, slides, maxSlides }: Props) {
  /** `null` = closed, `"new"` = adding, otherwise the slide being edited. */
  const [editing, setEditing] = useState<SlideRow | "new" | null>(null);
  const [pending, startAction] = useTransition();
  const close = useCallback(() => setEditing(null), []);

  function run(action: () => Promise<ActionState>) {
    startAction(async () => {
      const result = await action();
      if (result.ok && result.message) toast.success(result.message);
      else if (!result.ok) toast.error(result.message ?? "Something went wrong.");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Homepage slider</CardTitle>
        <CardDescription>
          Banners that rotate at the top of your homepage. Without visible slides, the hero below is shown
          instead.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {slides.length > 0 ? (
          <ol className="grid gap-3">
            {slides.map((slide, i) => (
              <li key={slide.id} className="flex flex-wrap items-center gap-4 rounded-lg border p-3">
                <div className="relative aspect-[16/7] w-40 shrink-0 overflow-hidden rounded-md bg-muted">
                  <Image src={slide.imageUrl} alt="" fill unoptimized sizes="160px" className="object-cover" />
                </div>
                <div className="grid min-w-0 flex-1 gap-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{slide.title || `Slide ${i + 1}`}</span>
                    {!slide.isActive && <Badge variant="secondary">Hidden</Badge>}
                  </div>
                  {slide.subtitle && <p className="truncate text-sm text-muted-foreground">{slide.subtitle}</p>}
                  {slide.linkUrl && (
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {slide.buttonLabel ? `${slide.buttonLabel} → ` : "→ "}
                      {slide.linkUrl}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={pending || i === 0}
                    onClick={() => run(() => moveSlideAction(storeId, slide.id, "up"))}
                    aria-label={`Move slide ${i + 1} up`}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={pending || i === slides.length - 1}
                    onClick={() => run(() => moveSlideAction(storeId, slide.id, "down"))}
                    aria-label={`Move slide ${i + 1} down`}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={pending}
                    onClick={() => run(() => setSlideActiveAction(storeId, slide.id, !slide.isActive))}
                    aria-label={slide.isActive ? `Hide slide ${i + 1}` : `Show slide ${i + 1}`}
                  >
                    {slide.isActive ? <EyeOff /> : <Eye />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditing(slide)}
                    aria-label={`Edit slide ${i + 1}`}
                  >
                    <Pencil />
                  </Button>
                  <ConfirmButton
                    variant="ghost"
                    label={<Trash2 className="text-destructive" />}
                    confirmLabel="Remove"
                    pendingLabel="Removing…"
                    action={() => deleteSlideAction(storeId, slide.id)}
                    aria-label={`Remove slide ${i + 1}`}
                  />
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No slides yet. Add a banner for a sale, a new collection or free delivery.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" disabled={slides.length >= maxSlides} onClick={() => setEditing("new")}>
            <ImagePlus /> Add slide
          </Button>
          <span className="text-xs text-muted-foreground">
            Wide images work best (about 1600 × 700). JPG, PNG or WebP, up to 5 MB · {slides.length}/{maxSlides}
          </span>
        </div>
      </CardContent>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "Add slide" : "Edit slide"}</DialogTitle>
            <DialogDescription>Text is optional. Leave it empty for an image-only banner.</DialogDescription>
          </DialogHeader>
          {editing !== null && (
            <SlideForm
              key={editing === "new" ? "new" : editing.id}
              storeId={storeId}
              slide={editing === "new" ? null : editing}
              onDone={close}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function SlideForm({
  storeId,
  slide,
  onDone,
}: {
  storeId: string;
  slide: SlideRow | null;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    saveSlideAction.bind(null, storeId, slide?.id ?? null),
    {},
  );
  const [preview, setPreview] = useState<string | null>(slide?.imageUrl ?? null);
  const [fileError, setFileError] = useState<string | null>(null);
  const errors = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Saved.");
      onDone();
    }
  }, [state, onDone]);

  // Free the object URL made for a newly chosen file.
  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setFileError(null);
    if (!file) return setPreview(slide?.imageUrl ?? null);
    if (file.size > MAX_BYTES) {
      setFileError("Images must be 5 MB or smaller.");
      event.target.value = "";
      return setPreview(slide?.imageUrl ?? null);
    }
    setPreview(URL.createObjectURL(file));
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  const imageError = fileError ?? errors.image?.[0];

  return (
    <form method="post" encType="multipart/form-data" onSubmit={onSubmit} className="grid gap-4">
      {state.ok === false && state.message && <p className="text-sm text-destructive">{state.message}</p>}

      <div className="grid gap-2">
        <Label htmlFor="slide-image">Image</Label>
        {preview && (
          <div className="relative aspect-[16/7] overflow-hidden rounded-md bg-muted">
            <Image src={preview} alt="" fill unoptimized sizes="512px" className="object-cover" />
          </div>
        )}
        <Input
          id="slide-image"
          name="image"
          type="file"
          accept={ACCEPT}
          onChange={onFileChange}
          aria-invalid={!!imageError}
          aria-describedby="slide-image-desc"
        />
        <p id="slide-image-desc" className={imageError ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
          {imageError ?? (slide ? "Choose a file only to replace the current image." : "About 1600 × 700 works best.")}
        </p>
      </div>

      <FormField id="slide-title" label="Title" errors={errors.title}>
        <Input
          id="slide-title"
          name="title"
          defaultValue={slide?.title ?? ""}
          maxLength={80}
          placeholder="Eid collection is here"
          aria-describedby="slide-title-desc"
        />
      </FormField>
      <FormField id="slide-subtitle" label="Subtitle" errors={errors.subtitle}>
        <Textarea
          id="slide-subtitle"
          name="subtitle"
          defaultValue={slide?.subtitle ?? ""}
          rows={2}
          maxLength={200}
          placeholder="Up to 30% off panjabis and sarees this week"
          aria-describedby="slide-subtitle-desc"
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
        <FormField id="slide-button" label="Button text" errors={errors.buttonLabel}>
          <Input
            id="slide-button"
            name="buttonLabel"
            defaultValue={slide?.buttonLabel ?? ""}
            maxLength={30}
            placeholder="Shop now"
            aria-describedby="slide-button-desc"
          />
        </FormField>
        <FormField
          id="slide-link"
          label="Link"
          errors={errors.linkUrl}
          hint="A page on your store like /products, or an https:// link."
        >
          <Input
            id="slide-link"
            name="linkUrl"
            defaultValue={slide?.linkUrl ?? ""}
            maxLength={300}
            placeholder="/products"
            spellCheck={false}
            aria-invalid={!!errors.linkUrl}
            aria-describedby="slide-link-desc"
          />
        </FormField>
      </div>
      <div className="flex items-center gap-3">
        <Checkbox id="slide-active" name="isActive" defaultChecked={slide?.isActive ?? true} />
        <Label htmlFor="slide-active">Show on the storefront</Label>
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending || !!fileError}>
          {pending ? "Saving…" : slide ? "Save slide" : "Add slide"}
        </Button>
      </DialogFooter>
    </form>
  );
}
