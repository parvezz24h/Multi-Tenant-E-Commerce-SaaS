"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { toActionState, type ActionState } from "@/server/errors";

import { addToCart, MAX_QUANTITY_PER_ITEM, setCartQuantity } from "./service";

const input = z.object({
  storeId: z.string().min(1).max(64),
  productId: z.string().min(1).max(64),
  quantity: z.number().int().min(0).max(MAX_QUANTITY_PER_ITEM),
});

function refreshStorefront() {
  // Re-render the storefront so the header count and cart page update.
  revalidatePath("/s/[storeSlug]", "layout");
}

export async function addToCartAction(
  storeId: string,
  productId: string,
  quantity: number,
): Promise<ActionState> {
  const parsed = input.safeParse({ storeId, productId, quantity });
  if (!parsed.success || parsed.data.quantity < 1) return { ok: false, message: "Invalid request." };

  try {
    const result = await addToCart(parsed.data.storeId, parsed.data.productId, parsed.data.quantity);
    refreshStorefront();
    return {
      ok: true,
      message: result.capped
        ? `Added to cart. You can buy up to ${result.quantity} of this item.`
        : "Added to cart.",
    };
  } catch (error) {
    return toActionState(error);
  }
}

export async function setCartQuantityAction(
  storeId: string,
  productId: string,
  quantity: number,
): Promise<ActionState> {
  const parsed = input.safeParse({ storeId, productId, quantity });
  if (!parsed.success) return { ok: false, message: "Invalid request." };

  try {
    await setCartQuantity(parsed.data.storeId, parsed.data.productId, parsed.data.quantity);
    refreshStorefront();
    return { ok: true };
  } catch (error) {
    return toActionState(error);
  }
}
