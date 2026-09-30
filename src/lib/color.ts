export const HEX_COLOR = /^#[0-9a-f]{6}$/i;

/** WCAG relative luminance of a #rrggbb color. */
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: number, b: number) {
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** Black or white, whichever reads better on `hex`. */
export function readableForeground(hex: string) {
  const l = luminance(hex);
  return contrast(l, 1) >= contrast(l, 0) ? "#ffffff" : "#0a0a0a";
}
