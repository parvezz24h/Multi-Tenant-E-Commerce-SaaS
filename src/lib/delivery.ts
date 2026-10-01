/** District that gets the store's "inside Dhaka" delivery rate. */
export const INSIDE_DHAKA_DISTRICT = "Dhaka";

export function deliveryChargeFor(
  district: string | null | undefined,
  rates: { deliveryChargeInsideDhaka: number; deliveryChargeOutsideDhaka: number },
) {
  return district === INSIDE_DHAKA_DISTRICT
    ? rates.deliveryChargeInsideDhaka
    : rates.deliveryChargeOutsideDhaka;
}
