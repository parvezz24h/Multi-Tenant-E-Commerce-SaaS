"use client";

import { Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { addToCartAction } from "@/server/cart/actions";

type Props = {
  storeId: string;
  productId: string;
  /** Upper bound for the quantity picker (stock capped by the per-item limit). */
  maxQuantity: number;
};

export function AddToCart({ storeId, productId, maxQuantity }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [pending, startTransition] = useTransition();

  if (maxQuantity <= 0) {
    return (
      <Button size="lg" disabled className="w-full sm:w-auto">
        Sold out
      </Button>
    );
  }

  function add() {
    startTransition(async () => {
      const result = await addToCartAction(storeId, productId, quantity);
      if (result.ok) {
        toast.success(result.message, {
          action: (
            <Link href="/cart" className="ml-auto text-sm font-medium underline underline-offset-4">
              View cart
            </Link>
          ),
        });
        setQuantity(1);
      } else {
        toast.error(result.message ?? "Couldn't add to cart.");
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      <QuantityStepper value={quantity} max={maxQuantity} onChange={setQuantity} disabled={pending} />
      <Button size="lg" onClick={add} disabled={pending} className="flex-1 sm:max-w-xs">
        {pending ? "Adding…" : "Add to cart"}
      </Button>
    </div>
  );
}

export function QuantityStepper({
  value,
  max,
  onChange,
  disabled,
  label = "Quantity",
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex items-center rounded-lg border">
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={disabled || value <= 1}
        aria-label="Decrease quantity"
      >
        <Minus />
      </Button>
      <span className="w-8 text-center text-sm font-medium tabular-nums" aria-live="polite">
        {value}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
      >
        <Plus />
      </Button>
    </div>
  );
}
