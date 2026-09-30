"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { QuantityStepper } from "@/components/storefront/add-to-cart";
import { Button } from "@/components/ui/button";
import { setCartQuantityAction } from "@/server/cart/actions";

type Props = {
  storeId: string;
  productId: string;
  productName: string;
  quantity: number;
  maxQuantity: number;
  available: boolean;
};

export function CartLineControls({
  storeId,
  productId,
  productName,
  quantity,
  maxQuantity,
  available,
}: Props) {
  const [pending, startTransition] = useTransition();

  function update(next: number) {
    startTransition(async () => {
      const result = await setCartQuantityAction(storeId, productId, next);
      if (!result.ok) toast.error(result.message ?? "Couldn't update your cart.");
    });
  }

  return (
    <div className="flex items-center gap-2" aria-busy={pending}>
      {available && (
        <QuantityStepper
          value={quantity}
          max={maxQuantity}
          onChange={update}
          disabled={pending}
          label={`Quantity of ${productName}`}
        />
      )}
      <Button
        variant="ghost"
        size="icon-lg"
        onClick={() => update(0)}
        disabled={pending}
        aria-label={`Remove ${productName}`}
      >
        <Trash2 />
      </Button>
    </div>
  );
}
