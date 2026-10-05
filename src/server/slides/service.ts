import "server-only";

import { randomBytes } from "node:crypto";

import { db } from "@/lib/db";
import { recordAudit } from "@/server/audit/log";
import { AppError } from "@/server/errors";
import { storage } from "@/server/storage";
import { checkImage } from "@/server/storage/images";
import type { StoreContext } from "@/server/tenant/context";

import { MAX_SLIDES, type SlideInput } from "./schemas";

/** All slides of a store, in display order (dashboard). */
export async function listSlides(storeId: string) {
  return db.heroSlide.findMany({
    where: { storeId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

async function requireSlideInStore(storeId: string, slideId: string) {
  const slide = await db.heroSlide.findFirst({ where: { id: slideId, storeId } });
  if (!slide) throw new AppError("NOT_FOUND", "Slide not found.");
  return slide;
}

/** Validate and store an uploaded slide image; returns its key and URL. */
async function uploadSlideImage(storeId: string, file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const check = checkImage(bytes);
  if (!check.ok) throw new AppError("INVALID", check.error, "image");

  // Keys never include user input, so they can't be used for path tricks.
  const key = `stores/${storeId}/slides/${randomBytes(12).toString("hex")}.${check.extension}`;
  await storage().put(key, bytes, check.type);
  return { storageKey: key, imageUrl: storage().publicUrl(key) };
}

export async function createSlide(ctx: StoreContext, file: File, input: SlideInput) {
  const count = await db.heroSlide.count({ where: { storeId: ctx.store.id } });
  if (count >= MAX_SLIDES) {
    throw new AppError("LIMIT_REACHED", `A store can have up to ${MAX_SLIDES} slides.`);
  }

  const image = await uploadSlideImage(ctx.store.id, file);
  try {
    const last = await db.heroSlide.findFirst({
      where: { storeId: ctx.store.id },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    return await db.$transaction(async (tx) => {
      const slide = await tx.heroSlide.create({
        data: { storeId: ctx.store.id, ...image, ...input, sortOrder: (last?.sortOrder ?? -1) + 1 },
      });
      await recordAudit(
        {
          storeId: ctx.store.id,
          actorId: ctx.user.id,
          action: "store.slide_added",
          entityType: "HeroSlide",
          entityId: slide.id,
        },
        tx,
      );
      return slide;
    });
  } catch (error) {
    await storage().delete(image.storageKey).catch(() => {});
    throw error;
  }
}

/** Update a slide's text and link; `file`, if given, replaces its image. */
export async function updateSlide(ctx: StoreContext, slideId: string, input: SlideInput, file?: File) {
  const slide = await requireSlideInStore(ctx.store.id, slideId);
  const image = file ? await uploadSlideImage(ctx.store.id, file) : null;

  try {
    await db.$transaction(async (tx) => {
      await tx.heroSlide.update({ where: { id: slide.id }, data: { ...input, ...image } });
      await recordAudit(
        {
          storeId: ctx.store.id,
          actorId: ctx.user.id,
          action: "store.slide_updated",
          entityType: "HeroSlide",
          entityId: slide.id,
          metadata: { imageReplaced: Boolean(image) },
        },
        tx,
      );
    });
  } catch (error) {
    if (image) await storage().delete(image.storageKey).catch(() => {});
    throw error;
  }
  if (image) await storage().delete(slide.storageKey).catch(() => {});
}

export async function setSlideActive(ctx: StoreContext, slideId: string, isActive: boolean) {
  const slide = await requireSlideInStore(ctx.store.id, slideId);
  await db.$transaction(async (tx) => {
    await tx.heroSlide.update({ where: { id: slide.id }, data: { isActive } });
    await recordAudit(
      {
        storeId: ctx.store.id,
        actorId: ctx.user.id,
        action: isActive ? "store.slide_shown" : "store.slide_hidden",
        entityType: "HeroSlide",
        entityId: slide.id,
      },
      tx,
    );
  });
}

/** Swap a slide with its neighbour above or below. */
export async function moveSlide(ctx: StoreContext, slideId: string, direction: "up" | "down") {
  await requireSlideInStore(ctx.store.id, slideId);
  const slides = await listSlides(ctx.store.id);
  const index = slides.findIndex((s) => s.id === slideId);
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= slides.length) return;

  // Renumber everything so equal sortOrders (or gaps) can't stall a move.
  const order = slides.map((s) => s.id);
  [order[index], order[target]] = [order[target]!, order[index]!];
  await db.$transaction(async (tx) => {
    for (const [sortOrder, id] of order.entries()) {
      await tx.heroSlide.update({ where: { id }, data: { sortOrder } });
    }
    await recordAudit(
      {
        storeId: ctx.store.id,
        actorId: ctx.user.id,
        action: "store.slides_reordered",
        entityType: "HeroSlide",
        entityId: slideId,
      },
      tx,
    );
  });
}

export async function deleteSlide(ctx: StoreContext, slideId: string) {
  const slide = await requireSlideInStore(ctx.store.id, slideId);
  await db.$transaction(async (tx) => {
    await tx.heroSlide.delete({ where: { id: slide.id } });
    await recordAudit(
      {
        storeId: ctx.store.id,
        actorId: ctx.user.id,
        action: "store.slide_removed",
        entityType: "HeroSlide",
        entityId: slide.id,
      },
      tx,
    );
  });
  await storage().delete(slide.storageKey).catch(() => {});
}
