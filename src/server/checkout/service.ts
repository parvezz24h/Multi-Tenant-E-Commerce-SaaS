import "server-only";

import { randomBytes } from "node:crypto";

import { cache } from "react";

import type { Prisma } from "@/generated/prisma/client";
import { deliveryChargeFor } from "@/lib/delivery";
import { db } from "@/lib/db";
import { normalizeBdPhone } from "@/lib/phone";
import { recordAudit } from "@/server/audit/log";
import { getCartId } from "@/server/cart/service";
import { adjustStock } from "@/server/catalog/inventory";
import { AppError } from "@/server/errors";
import { isStoreOpen } from "@/server/storefront/service";

import type { CheckoutInput } from "./schemas";

/** Anti-abuse: COD orders a single phone number can place per store per hour. */
export const MAX_ORDERS_PER_PHONE_PER_HOUR = 5;

/**
 * Turn the visitor's cart into a COD order. Everything happens in one
 * transaction: if any item is out of stock, nothing is written.
 *
 * Prices, names and availability are re-read from the database here; the
 * cart only contributes product ids and quantities.
 */
export async function placeOrder(storeId: string, input: CheckoutInput) {
  const store = await db.store.findUnique({
    where: { id: storeId },
    select: { id: true, status: true, deliveryChargeInsideDhaka: true, deliveryChargeOutsideDhaka: true },
  });
  if (!store || !(await isStoreOpen(store))) {
    throw new AppError("NOT_FOUND", "This store is not taking orders right now.");
  }

  const cartId = await getCartId(storeId);
  if (!cartId) throw new AppError("INVALID", "Your cart is empty.");

  const recentOrders = await db.order.count({
    where: { storeId, phone: input.phone, createdAt: { gte: new Date(Date.now() - 3_600_000) } },
  });
  if (recentOrders >= MAX_ORDERS_PER_PHONE_PER_HOUR) {
    throw new AppError("LIMIT_REACHED", "Too many orders from this phone number. Please try again later.");
  }

  const order = await db.$transaction(async (tx) => {
    const items = await tx.cartItem.findMany({
      where: { cartId, cart: { storeId } },
      select: {
        quantity: true,
        product: {
          select: { id: true, storeId: true, name: true, sku: true, price: true, stock: true, status: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    if (items.length === 0) throw new AppError("INVALID", "Your cart is empty.");

    for (const { product, quantity } of items) {
      if (product.storeId !== storeId || product.status !== "ACTIVE") {
        throw new AppError("INVALID", `${product.name} is no longer available. Remove it from your cart.`);
      }
      if (quantity > product.stock) {
        throw new AppError(
          "INVALID",
          product.stock > 0
            ? `Only ${product.stock} of ${product.name} left. Update your cart and try again.`
            : `${product.name} just sold out. Remove it from your cart.`,
        );
      }
    }

    const lines = items.map(({ product, quantity }) => ({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      unitPrice: product.price,
      quantity,
      lineTotal: product.price * quantity,
    }));
    const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
    const deliveryCharge = deliveryChargeFor(input.district, store);

    // Row-locks the store, so concurrent checkouts get distinct numbers.
    const { nextOrderNumber } = await tx.store.update({
      where: { id: storeId },
      data: { nextOrderNumber: { increment: 1 } },
      select: { nextOrderNumber: true },
    });

    const customer = await tx.customer.upsert({
      where: { storeId_phone: { storeId, phone: input.phone } },
      create: { storeId, phone: input.phone, name: input.name, email: input.email },
      update: { name: input.name, ...(input.email && { email: input.email }) },
      select: { id: true },
    });
    await saveAddress(tx, storeId, customer.id, input);

    const created = await tx.order.create({
      data: {
        storeId,
        orderNumber: nextOrderNumber - 1,
        publicToken: randomBytes(24).toString("base64url"),
        customerId: customer.id,
        subtotal,
        deliveryCharge,
        total: subtotal + deliveryCharge,
        customerName: input.name,
        phone: input.phone,
        email: input.email,
        district: input.district,
        upazila: input.upazila,
        area: input.area,
        addressLine: input.addressLine,
        postalCode: input.postalCode,
        customerNote: input.note,
        items: { create: lines },
        events: { create: { toStatus: "PENDING" } },
      },
      select: { id: true, orderNumber: true, publicToken: true },
    });

    // Fails (and rolls everything back) if stock changed since the check above.
    for (const line of lines) {
      await adjustStock(tx, {
        storeId,
        productId: line.productId,
        delta: -line.quantity,
        reason: "ORDER_PLACED",
        orderId: created.id,
      });
    }

    await tx.cart.delete({ where: { id: cartId } });
    await recordAudit(
      {
        storeId,
        action: "order.placed",
        entityType: "Order",
        entityId: created.id,
        metadata: { orderNumber: created.orderNumber, total: subtotal + deliveryCharge },
      },
      tx,
    );
    return created;
  });

  return order;
}

/** Remember the address on the customer unless they already have it saved. */
async function saveAddress(
  tx: Prisma.TransactionClient,
  storeId: string,
  customerId: string,
  input: CheckoutInput,
) {
  const existing = await tx.customerAddress.findMany({
    where: { customerId },
    select: { district: true, upazila: true, addressLine: true },
  });
  const same = existing.some(
    (a) =>
      a.district === input.district &&
      a.upazila.toLowerCase() === input.upazila.toLowerCase() &&
      a.addressLine.toLowerCase() === input.addressLine.toLowerCase(),
  );
  if (same) return;
  await tx.customerAddress.create({
    data: {
      storeId,
      customerId,
      name: input.name,
      phone: input.phone,
      district: input.district,
      upazila: input.upazila,
      area: input.area,
      addressLine: input.addressLine,
      postalCode: input.postalCode,
      isDefault: existing.length === 0,
    },
  });
}

/** Order for the customer-facing confirmation page. Token must match the store. */
export const getOrderByToken = cache(async (storeId: string, token: string) => {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  return db.order.findFirst({
    where: { storeId, publicToken: token },
    select: {
      orderNumber: true,
      status: true,
      paymentMethod: true,
      paymentStatus: true,
      subtotal: true,
      deliveryCharge: true,
      discount: true,
      total: true,
      customerName: true,
      phone: true,
      district: true,
      upazila: true,
      area: true,
      addressLine: true,
      postalCode: true,
      createdAt: true,
      items: { select: { id: true, name: true, unitPrice: true, quantity: true, lineTotal: true } },
      events: { orderBy: { createdAt: "asc" }, select: { toStatus: true, createdAt: true } },
    },
  });
});

/**
 * Tracking lookup: both the order number and the phone it was placed with
 * must match, so order numbers alone don't reveal anything.
 */
export async function findOrderTokenForTracking(storeId: string, orderNumber: number, phone: string) {
  const normalized = normalizeBdPhone(phone);
  if (!normalized) return null;
  const order = await db.order.findUnique({
    where: { storeId_orderNumber: { storeId, orderNumber } },
    select: { phone: true, publicToken: true },
  });
  return order && order.phone === normalized ? order.publicToken : null;
}
