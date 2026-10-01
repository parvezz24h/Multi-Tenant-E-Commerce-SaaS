"use client";

import { ImagePlus, Star, Trash2 } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { ProductImage } from "@/components/storefront/product-image";
import { Button } from "@/components/ui/button";
import {
  deleteProductImageAction,
  setCoverImageAction,
  uploadProductImageAction,
} from "@/server/catalog/actions";

type Props = {
  storeId: string;
  productId: string;
  productName: string;
  images: { id: string; url: string }[];
  maxImages: number;
};

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp";

export function ImageManager({ storeId, productId, productName, images, maxImages }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [pending, startTransition] = useTransition();
  const remaining = maxImages - images.length;

  async function upload(files: FileList) {
    const list = Array.from(files).slice(0, remaining);
    if (files.length > remaining) {
      toast.error(`You can add ${remaining} more image${remaining === 1 ? "" : "s"}.`);
    }
    setUploading({ done: 0, total: list.length });
    // One request per image keeps each upload under the server body limit.
    for (const [i, file] of list.entries()) {
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name} is larger than 5 MB.`);
        continue;
      }
      const formData = new FormData();
      formData.set("file", file);
      const result = await uploadProductImageAction(storeId, productId, formData);
      if (!result.ok) toast.error(`${file.name}: ${result.message ?? "Upload failed."}`);
      setUploading({ done: i + 1, total: list.length });
    }
    setUploading(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function run(action: () => Promise<{ ok?: boolean; message?: string }>) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) toast.success(result.message ?? "Done.");
      else toast.error(result.message ?? "Something went wrong.");
    });
  }

  return (
    <div className="grid gap-4">
      {images.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((image, i) => (
            <li key={image.id} className="grid gap-2">
              <div className="relative">
                <ProductImage url={image.url} alt={`${productName} image ${i + 1}`} sizes="200px" />
                {i === 0 && (
                  <span className="absolute top-2 left-2 rounded bg-background/90 px-1.5 py-0.5 text-xs font-medium">
                    Cover
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                {i > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => run(() => setCoverImageAction(storeId, image.id))}
                    aria-label={`Make image ${i + 1} the cover`}
                  >
                    <Star /> Cover
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => run(() => deleteProductImageAction(storeId, image.id))}
                  aria-label={`Remove image ${i + 1}`}
                  className="ml-auto text-destructive"
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No images yet. The first image is used as the cover.</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          hidden
          onChange={(e) => e.target.files?.length && upload(e.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          disabled={remaining <= 0 || uploading !== null}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus />
          {uploading ? `Uploading ${uploading.done}/${uploading.total}…` : "Add images"}
        </Button>
        <span className="text-xs text-muted-foreground">
          JPG, PNG or WebP, up to 5 MB each · {images.length}/{maxImages}
        </span>
      </div>
    </div>
  );
}
