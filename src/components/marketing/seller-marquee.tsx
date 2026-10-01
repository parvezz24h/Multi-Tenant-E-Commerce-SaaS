import {
  Baby,
  BookOpen,
  Gem,
  Laptop,
  Leaf,
  Palette,
  Shirt,
  ShoppingBasket,
  Sofa,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

const SELLERS: { icon: LucideIcon; label: string }[] = [
  { icon: Shirt, label: "Fashion & clothing" },
  { icon: Sparkles, label: "Cosmetics & beauty" },
  { icon: ShoppingBasket, label: "Grocery" },
  { icon: Laptop, label: "Electronics & gadgets" },
  { icon: Sofa, label: "Home & living" },
  { icon: Gem, label: "Jewellery" },
  { icon: Palette, label: "Handicrafts" },
  { icon: Baby, label: "Baby & kids" },
  { icon: BookOpen, label: "Books & stationery" },
  { icon: Leaf, label: "Organic food" },
];

/**
 * Kinds of businesses the platform is built for (not customer logos).
 * Scrolls slowly; static and wrapped for reduced-motion users.
 */
export function SellerMarquee() {
  const item = ({ icon: Icon, label }: (typeof SELLERS)[number], key: string) => (
    <li
      key={key}
      className="flex shrink-0 items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm text-muted-foreground"
    >
      <Icon className="size-4 text-primary" aria-hidden />
      {label}
    </li>
  );

  return (
    <div className="marquee-host relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      {/* Two copies so the loop is seamless; the second is hidden from screen readers. */}
      <div className="marquee flex w-max gap-3 motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:justify-center">
        <ul className="flex gap-3 motion-reduce:flex-wrap motion-reduce:justify-center" aria-label="Built for">
          {SELLERS.map((s) => item(s, s.label))}
        </ul>
        <ul className="flex gap-3 motion-reduce:hidden" aria-hidden>
          {SELLERS.map((s) => item(s, `${s.label}-copy`))}
        </ul>
      </div>
    </div>
  );
}
