import "server-only";

import { randomBytes } from "node:crypto";

import { cookies } from "next/headers";
import { cache } from "react";

import { db } from "@/lib/db";
import { AppError } from "@/server/errors";

/** Per-line cap so a single cart can't reserve a store's whole inventory. */
export const MAX_QUANTITY_PER_ITEM = 20;

const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** One cookie per store, so carts never leak across tenants sharing a host. */
function cartCookieName(storeId: string) {
  return `cart_${storeId}`;
}

async function readCartToken(storeId: string) {
  return (await cookies()).get(cartCookieName(storeId))?.value ?? null;
}

async function writeCartToken(storeId: string, token: string) {
  (await cookies()).set(cartCookieName(storeId), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CART_COOKIE_MAX_AGE,
  });
}

export type CartLine = {
  productId: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  stock: number;
  imageUrl: string | null;
  /** False when the product was unpublished or sold out after being added. */
  available: boolean;
  lineTotal: number;
};

export type CartView = {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
};

const EMPTY_CART: CartView = { lines: [], itemCount: 0, subtotal: 0 };

/** The current visitor's cart for a store. Read-only; safe to call while rendering. */
export const getCart = cache(async (storeId: string): Promise<CartView> => {
  const token = await readCartToken(storeId);
  if (!token) return EMPTY_CART;

  // The token alone is not enough: the cart must also belong to this store.
  const cart = await db.cart.findFirst({
    where: { token, storeId },
    select: {
      items: {
        orderBy: { createdAt: "asc" },
        select: {
          quantity: true,
          product: {
            select: {
              id: true,
              storeId: true,
              name: true,
              slug: true,
              price: true,
              stock: true,
              status: true,
              images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
            },
          },
        },
      },
    },
  });
  if (!cart) return EMPTY_CART;

  const lines = cart.items
    .filter((item) => item.product.storeId === storeId)
    .map(({ quantity, product }): CartLine => {
      const available = product.status === "ACTIVE" && product.stock > 0;
      const qty = Math.min(quantity, Math.max(product.stock, 0));
      return {
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        quantity: available ? qty : quantity,
        stock: product.stock,
        imageUrl: product.images[0]?.url ?? null,
        available,
        lineTotal: available ? product.price * qty : 0,
      };
    });

  const counted = lines.filter((l) => l.available);
  return {
    lines,
    itemCount: counted.reduce((n, l) => n + l.quantity, 0),
    subtotal: counted.reduce((n, l) => n + l.lineTotal, 0),
  };
});

/** The visitor's cart id for a store, if they have one. Used by checkout. */
export async function getCartId(storeId: string) {
  const token = await readCartToken(storeId);
  if (!token) return null;
  const cart = await db.cart.findFirst({ where: { token, storeId }, select: { id: true } });
  return cart?.id ?? null;
}

async function requireOpenStore(storeId: string) {
  const store = await db.store.findUnique({ where: { id: storeId }, select: { status: true } });
  if (store?.status !== "ACTIVE") throw new AppError("NOT_FOUND", "This store is not available.");
}

async function requireBuyableProduct(storeId: string, productId: string) {
  const product = await db.product.findFirst({
    where: { id: productId, storeId, status: "ACTIVE" },
    select: { id: true, stock: true },
  });
  if (!product) throw new AppError("NOT_FOUND", "This product is not available.");
  if (product.stock <= 0) throw new AppError("INVALID", "This product is out of stock.");
  return product;
}

async function getOrCreateCartId(storeId: string) {
  const token = await readCartToken(storeId);
  if (token) {
    const cart = await db.cart.findFirst({ where: { token, storeId }, select: { id: true } });
    if (cart) return cart.id;
  }
  const newToken = randomBytes(32).toString("base64url");
  const cart = await db.cart.create({ data: { storeId, token: newToken }, select: { id: true } });
  await writeCartToken(storeId, newToken);
  return cart.id;
}

function clampQuantity(quantity: number, stock: number) {
  return Math.max(0, Math.min(quantity, stock, MAX_QUANTITY_PER_ITEM));
}

/** Add `quantity` of a product; the total is clamped to stock and the per-item cap. */
export async function addToCart(storeId: string, productId: string, quantity: number) {
  await requireOpenStore(storeId);
  const product = await requireBuyableProduct(storeId, productId);
  const cartId = await getOrCreateCartId(storeId);

  const existing = await db.cartItem.findUnique({
    where: { cartId_productId: { cartId, productId } },
    select: { quantity: true },
  });
  const next = clampQuantity((existing?.quantity ?? 0) + quantity, product.stock);

  await db.cartItem.upsert({
    where: { cartId_productId: { cartId, productId } },
    create: { cartId, productId, quantity: next },
    update: { quantity: next },
  });
  return { quantity: next, capped: next < (existing?.quantity ?? 0) + quantity };
}

/** Set a line's quantity; 0 removes it. */
export async function setCartQuantity(storeId: string, productId: string, quantity: number) {
  const token = await readCartToken(storeId);
  if (!token) return;
  const cart = await db.cart.findFirst({ where: { token, storeId }, select: { id: true } });
  if (!cart) return;

  if (quantity <= 0) {
    await db.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
    return;
  }

  await requireOpenStore(storeId);
  const product = await requireBuyableProduct(storeId, productId);
  await db.cartItem.updateMany({
    where: { cartId: cart.id, productId },
    data: { quantity: clampQuantity(quantity, product.stock) },
  });
}
