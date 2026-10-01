/**
 * Image upload validation. The browser's Content-Type is not trusted: the
 * type is detected from the file's magic bytes, and only these are allowed.
 */

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type ImageType = keyof typeof IMAGE_TYPES;

export function detectImageType(bytes: Uint8Array): ImageType | null {
  const b = bytes;
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (
    b.length >= 8 &&
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, i) => b[i] === byte)
  ) {
    return "image/png";
  }
  if (
    b.length >= 12 &&
    String.fromCharCode(b[0]!, b[1]!, b[2]!, b[3]!) === "RIFF" &&
    String.fromCharCode(b[8]!, b[9]!, b[10]!, b[11]!) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export type ImageCheck =
  | { ok: true; type: ImageType; extension: string }
  | { ok: false; error: string };

export function checkImage(bytes: Uint8Array): ImageCheck {
  if (bytes.length === 0) return { ok: false, error: "The file is empty." };
  if (bytes.length > MAX_IMAGE_BYTES) return { ok: false, error: "Images must be 5 MB or smaller." };
  const type = detectImageType(bytes);
  if (!type) return { ok: false, error: "Use a JPG, PNG or WebP image." };
  return { ok: true, type, extension: IMAGE_TYPES[type] };
}
