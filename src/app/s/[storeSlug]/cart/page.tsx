import type { Metadata } from "next";
import Link from "next/link";

import { CartLineControls } from "@/components/storefront/cart-line-controls";
import { ProductImage } from "@/components/storefront/product-image";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { getCart, MAX_QUANTITY_PER_ITEM } from "@/server/cart/service";
import { requireOpenStore } from "@/server/storefront/context";

export const metadata: Metadata = { title: "Cart" };

type Area = "inside" | "outside";

export default async function CartPage({ params, searchParams }: PageProps<"/s/[storeSlug]/cart">) {
  const { store } = await requireOpenStore((await params).storeSlug);
  const { area: areaParam } = await searchParams;
  const area: Area = areaParam === "outside" ? "outside" : "inside";
  const cart = await getCart(store.id);

  if (cart.lines.length === 0) {
    return (
      <div className="grid justify-items-center gap-3 py-20 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Your cart is empty</h1>
        <p className="text-muted-foreground">Browse the store and add something you like.</p>
        <Button asChild>
          <Link href="/products">Start shopping</Link>
        </Button>
      </div>
    );
  }

  const delivery =
    cart.itemCount > 0
      ? area === "inside"
        ? store.deliveryChargeInsideDhaka
        : store.deliveryChargeOutsideDhaka
      : 0;
  const total = cart.subtotal + delivery;

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Your cart</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <ul className="divide-y rounded-xl border">
          {cart.lines.map((line) => (
            <li key={line.productId} className="flex gap-4 p-4">
              <Link href={`/products/${line.slug}`} className="w-20 shrink-0 sm:w-24">
                <ProductImage url={line.imageUrl} alt={line.name} sizes="96px" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex justify-between gap-3">
                  <Link href={`/products/${line.slug}`} className="line-clamp-2 font-medium hover:underline">
                    {line.name}
                  </Link>
                  <span className="shrink-0 font-medium tabular-nums">
                    {line.available ? formatMoney(line.lineTotal) : "—"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground tabular-nums">
                  {formatMoney(line.price)} each
                </p>
                {!line.available && (
                  <p className="text-sm text-destructive">No longer available — remove it to continue.</p>
                )}
                {line.available && line.stock <= 5 && (
                  <p className="text-xs text-muted-foreground">Only {line.stock} left</p>
                )}
                <CartLineControls
                  storeId={store.id}
                  productId={line.productId}
                  productName={line.name}
                  quantity={line.quantity}
                  maxQuantity={Math.min(line.stock, MAX_QUANTITY_PER_ITEM)}
                  available={line.available}
                />
              </div>
            </li>
          ))}
        </ul>

        <aside className="grid content-start gap-4 rounded-xl border p-5" aria-labelledby="summary-heading">
          <h2 id="summary-heading" className="font-semibold">
            Order summary
          </h2>

          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm font-medium">Delivery area</legend>
            <div className="grid grid-cols-2 gap-2">
              <AreaOption href="/cart" active={area === "inside"} label="Inside Dhaka" fee={store.deliveryChargeInsideDhaka} />
              <AreaOption
                href="/cart?area=outside"
                active={area === "outside"}
                label="Outside Dhaka"
                fee={store.deliveryChargeOutsideDhaka}
              />
            </div>
          </fieldset>

          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                Subtotal ({cart.itemCount} {cart.itemCount === 1 ? "item" : "items"})
              </dt>
              <dd className="tabular-nums">{formatMoney(cart.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd className="tabular-nums">{formatMoney(delivery)}</dd>
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatMoney(total)}</dd>
            </div>
          </dl>

          {cart.lines.every((l) => l.available) ? (
            <Button size="lg" asChild className="w-full">
              <Link href="/checkout">Checkout</Link>
            </Button>
          ) : (
            <Button size="lg" disabled className="w-full">
              Remove unavailable items to check out
            </Button>
          )}
          <p className="text-center text-xs text-muted-foreground">
            Cash on delivery · delivery is set by your district at checkout.
          </p>
        </aside>
      </div>
    </div>
  );
}

function AreaOption({
  href,
  active,
  label,
  fee,
}: {
  href: string;
  active: boolean;
  label: string;
  fee: number;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      replace
      aria-current={active ? "true" : undefined}
      className={cn(
        "grid gap-0.5 rounded-lg border p-3 text-sm transition-colors",
        active ? "border-primary bg-primary/10" : "hover:bg-muted",
      )}
    >
      <span className="font-medium">{label}</span>
      <span className="text-muted-foreground tabular-nums">{formatMoney(fee)}</span>
    </Link>
  );
}
