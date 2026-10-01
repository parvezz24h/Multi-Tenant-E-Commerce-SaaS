import { CheckCircle2, ExternalLink, ShoppingBag } from "lucide-react";

import { siteConfig } from "@/lib/site";

const PRODUCTS = [
  { name: "Cotton Three-Piece", price: "৳1,850", was: "৳2,200", tint: "from-rose-200 to-rose-100" },
  { name: "Premium Panjabi", price: "৳1,800", tint: "from-sky-200 to-sky-100" },
  { name: "Jamdani Saree", price: "৳6,500", tint: "from-amber-200 to-amber-100" },
  { name: "Leather Wallet", price: "৳750", tint: "from-emerald-200 to-emerald-100" },
];

/**
 * Illustration of the demo store (siteConfig.demoStore), built from HTML so
 * it's crisp at any size and needs no image assets. The whole preview links
 * to the live demo.
 */
export function StorePreview() {
  const demo = siteConfig.demoStore;
  return (
    <a
      href={demo.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open the live demo store, ${demo.name} (opens in a new tab)`}
      className="group relative block rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-ring/50"
    >
      <span className="absolute -top-3 right-4 z-10 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground shadow-sm">
        Live demo <ExternalLink className="size-3" aria-hidden />
      </span>
      <div className="relative" aria-hidden>
        {/* Browser window */}
        <div className="overflow-hidden rounded-2xl border bg-background shadow-2xl shadow-foreground/10 transition-transform duration-300 group-hover:-translate-y-1 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0">
          <div className="flex items-center gap-2 border-b bg-muted/60 px-4 py-3">
            <span className="size-2.5 rounded-full bg-foreground/15" />
            <span className="size-2.5 rounded-full bg-foreground/15" />
            <span className="size-2.5 rounded-full bg-foreground/15" />
            <span className="ml-3 truncate rounded-md bg-background px-3 py-1 text-[11px] text-muted-foreground">
              {demo.host}
            </span>
          </div>

          {/* Extra bottom padding on sm+ leaves room for the floating order card. */}
          <div className="grid gap-4 p-4 sm:p-5 sm:pb-20">
            {/* Store header */}
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-md bg-[#c2410c] text-xs font-bold text-white">
                {demo.name.charAt(0)}
              </span>
              <span className="text-sm font-semibold">{demo.name}</span>
              <span className="ml-auto flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
                <ShoppingBag className="size-3" /> 2
              </span>
            </div>

            {/* Hero */}
            <div className="rounded-xl bg-[#c2410c] px-5 py-6 text-white">
              <p className="text-lg font-semibold tracking-tight">Welcome to {demo.name}</p>
              <p className="mt-1 text-xs text-white/80">Cash on delivery all over Bangladesh</p>
              <span className="mt-3 inline-block rounded-md bg-white px-2.5 py-1 text-[11px] font-medium text-[#9a3412]">
                Shop now
              </span>
            </div>

            {/* Product grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {PRODUCTS.map((p) => (
                <div key={p.name} className="grid gap-1.5">
                  <div className={`aspect-square rounded-lg bg-gradient-to-br ${p.tint}`} />
                  <p className="truncate text-[11px] font-medium">{p.name}</p>
                  <p className="text-[11px]">
                    <span className="font-semibold">{p.price}</span>
                    {p.was && <span className="ml-1 text-muted-foreground line-through">{p.was}</span>}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Floating order notification */}
        <div className="absolute -bottom-6 -left-4 hidden w-64 rounded-xl border bg-background p-4 shadow-xl shadow-foreground/10 sm:block lg:-left-10">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
            <div className="grid gap-0.5">
              <p className="text-sm font-semibold">New order #1042</p>
              <p className="text-xs text-muted-foreground">Mirpur, Dhaka · Cash on delivery</p>
              <p className="text-sm font-semibold tabular-nums">৳1,860</p>
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}
