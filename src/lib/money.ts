/**
 * Money is stored as integers in minor units (poisha for BDT) to avoid
 * floating-point errors. 125000 → ৳1,250.
 */

// en-IN gives the lakh grouping used in Bangladesh (1,25,000) with Latin digits.
const bdt = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "BDT",
  currencyDisplay: "narrowSymbol",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatMoney(minor: number) {
  return bdt.format(minor / 100);
}

/** Percentage saved vs the compare-at price, or null when there's no discount. */
export function discountPercent(price: number, compareAtPrice: number | null | undefined) {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}
