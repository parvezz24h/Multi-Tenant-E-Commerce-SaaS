"use client";

import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { StockAdjustForm } from "./stock-adjust-form";

type Props = { storeId: string; productId: string; productName: string; stock: number };

export function AdjustStockDialog({ storeId, productId, productName, stock }: Props) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" aria-label={`Adjust stock for ${productName}`}>
          Adjust
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Adjust stock</DialogTitle>
          <DialogDescription>{productName}</DialogDescription>
        </DialogHeader>
        <StockAdjustForm
          storeId={storeId}
          productId={productId}
          currentStock={stock}
          idPrefix={`adj-${productId}`}
          onDone={close}
        />
      </DialogContent>
    </Dialog>
  );
}
