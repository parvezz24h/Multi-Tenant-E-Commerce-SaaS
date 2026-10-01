import { describe, expect, it } from "vitest";

import { checkImage, detectImageType, MAX_IMAGE_BYTES } from "@/server/storage/images";

const bytes = (...b: number[]) => new Uint8Array(b);
const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));

describe("detectImageType", () => {
  it("detects JPEG, PNG and WebP by magic bytes", () => {
    expect(detectImageType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
    expect(detectImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe("image/png");
    expect(detectImageType(bytes(...ascii("RIFF"), 0, 0, 0, 0, ...ascii("WEBP")))).toBe("image/webp");
  });

  it("rejects other files, including SVG and HTML", () => {
    expect(detectImageType(bytes(...ascii("<svg xmlns")))).toBeNull();
    expect(detectImageType(bytes(...ascii("<html>")))).toBeNull();
    expect(detectImageType(bytes(...ascii("GIF89a")))).toBeNull();
    expect(detectImageType(bytes())).toBeNull();
  });
});

describe("checkImage", () => {
  it("rejects empty and oversized files", () => {
    expect(checkImage(bytes()).ok).toBe(false);
    const big = new Uint8Array(MAX_IMAGE_BYTES + 1);
    big.set([0xff, 0xd8, 0xff]);
    expect(checkImage(big)).toMatchObject({ ok: false });
  });

  it("returns a safe extension", () => {
    expect(checkImage(bytes(0xff, 0xd8, 0xff, 0xdb))).toEqual({ ok: true, type: "image/jpeg", extension: "jpg" });
  });
});
