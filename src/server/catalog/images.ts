import "server-only";

import { randomBytes } from "node:crypto";

import { db } from "@/lib/db";
import { recordAudit } from "@/server/audit/log";
import { AppError } from "@/server/errors";
import { storage } from "@/server/storage";
import { checkImage } from "@/server/storage/images";
import type { StoreContext } from "@/server/tenant/context";

import { MAX_IMAGES_PER_PRODUCT } from "./schemas";

async function requireProductInStore(storeId: string, productId: string) {
  const product = await db.product.findFirst({
    where: { id: productId, storeId },
    select: { id: true, name: true, _count: { select: { images: true } } },
  });
  if (!product) throw new AppError("NOT_FOUND", "Product not found.");
  return product;
}

export async function addProductImage(ctx: StoreContext, productId: string, file: File) {
  const product = await requireProductInStore(ctx.store.id, productId);
  if (product._count.images >= MAX_IMAGES_PER_PRODUCT) {
    throw new AppError("LIMIT_REACHED", `A product can have up to ${MAX_IMAGES_PER_PRODUCT} images.`);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const check = checkImage(bytes);
  if (!check.ok) throw new AppError("INVALID", check.error);

  // Keys never include user input, so they can't be used for path tricks.
  const key = `stores/${ctx.store.id}/products/${product.id}/${randomBytes(12).toString("hex")}.${check.extension}`;
  await storage().put(key, bytes, check.type);

  try {
    const last = await db.productImage.findFirst({
      where: { productId: product.id },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    return await db.$transaction(async (tx) => {
      const image = await tx.productImage.create({
        data: {
          storeId: ctx.store.id,
          productId: product.id,
          url: storage().publicUrl(key),
          storageKey: key,
          alt: product.name,
          sortOrder: (last?.sortOrder ?? -1) + 1,
        },
      });
      await recordAudit(
        {
          storeId: ctx.store.id,
          actorId: ctx.user.id,
          action: "product.image_added",
          entityType: "ProductImage",
          entityId: image.id,
          metadata: { productId: product.id },
        },
        tx,
      );
      return image;
    });
  } catch (error) {
    await storage().delete(key).catch(() => {});
    throw error;
  }
}

async function requireImageInStore(storeId: string, imageId: string) {
  const image = await db.productImage.findFirst({ where: { id: imageId, storeId } });
  if (!image) throw new AppError("NOT_FOUND", "Image not found.");
  return image;
}

export async function deleteProductImage(ctx: StoreContext, imageId: string) {
  const image = await requireImageInStore(ctx.store.id, imageId);
  await db.$transaction(async (tx) => {
    await tx.productImage.delete({ where: { id: image.id } });
    await recordAudit(
      {
        storeId: ctx.store.id,
        actorId: ctx.user.id,
        action: "product.image_removed",
        entityType: "ProductImage",
        entityId: image.id,
        metadata: { productId: image.productId },
      },
      tx,
    );
  });
  if (image.storageKey) await storage().delete(image.storageKey).catch(() => {});
  return image.productId;
}

/** Make an image the product's cover (first image). */
export async function setCoverImage(ctx: StoreContext, imageId: string) {
  const image = await requireImageInStore(ctx.store.id, imageId);
  const first = await db.productImage.findFirst({
    where: { productId: image.productId },
    orderBy: { sortOrder: "asc" },
    select: { sortOrder: true },
  });
  await db.productImage.update({
    where: { id: image.id },
    data: { sortOrder: (first?.sortOrder ?? 0) - 1 },
  });
  return image.productId;
}
