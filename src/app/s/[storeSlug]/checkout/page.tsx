import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CheckoutForm } from "@/components/storefront/checkout-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { BD_DISTRICTS } from "@/lib/bd-districts";
import { getCart } from "@/server/cart/service";
import { requireOpenStore } from "@/server/storefront/context";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage({ params }: PageProps<"/s/[storeSlug]/checkout">) {
  const { store } = await requireOpenStore((await params).storeSlug);
  const cart = await getCart(store.id);
  if (cart.lines.length === 0) redirect("/cart");

  const unavailable = cart.lines.filter((l) => !l.available);
  if (unavailable.length > 0) {
    return (
      <div className="grid max-w-lg gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>
        <Alert variant="destructive">
          <AlertDescription>
            {unavailable.map((l) => l.name).join(", ")} {unavailable.length === 1 ? "is" : "are"} no
            longer available. Remove {unavailable.length === 1 ? "it" : "them"} from your cart to continue.
          </AlertDescription>
        </Alert>
        <Button asChild className="justify-self-start">
          <Link href="/cart">Back to cart</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>
        <Link href="/cart" className="text-sm text-muted-foreground hover:text-foreground">
          Edit cart
        </Link>
      </div>
      <CheckoutForm
        storeId={store.id}
        districts={BD_DISTRICTS}
        rates={{
          deliveryChargeInsideDhaka: store.deliveryChargeInsideDhaka,
          deliveryChargeOutsideDhaka: store.deliveryChargeOutsideDhaka,
        }}
        lines={cart.lines.map(({ productId, name, quantity, lineTotal }) => ({
          productId,
          name,
          quantity,
          lineTotal,
        }))}
        subtotal={cart.subtotal}
      />
    </div>
  );
}
