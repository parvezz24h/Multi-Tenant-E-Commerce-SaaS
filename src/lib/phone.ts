/** Bangladeshi mobile numbers: 01XXXXXXXXX, optionally prefixed by +880/880. */
export const BD_PHONE = /^(?:\+?880|0)1[3-9]\d{8}$/;

/** Strip spaces/hyphens and the country code: "+880 1712-345678" → "01712345678". */
export function normalizeBdPhone(input: string) {
  const compact = input.replace(/[\s-]/g, "");
  if (!BD_PHONE.test(compact)) return null;
  return `0${compact.slice(-10)}`;
}
