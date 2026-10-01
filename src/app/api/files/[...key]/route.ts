import { readFile } from "node:fs/promises";
import path from "node:path";

import { isLocalStorage, LOCAL_UPLOAD_ROOT, STORAGE_KEY } from "@/server/storage";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

/** Serves uploads from local disk. Only used with STORAGE_DRIVER=local. */
export async function GET(_request: Request, ctx: RouteContext<"/api/files/[...key]">) {
  if (!isLocalStorage()) return new Response(null, { status: 404 });

  const key = (await ctx.params).key.join("/");
  if (!STORAGE_KEY.test(key) || key.includes("..")) return new Response(null, { status: 404 });

  try {
    const body = await readFile(path.join(LOCAL_UPLOAD_ROOT, key));
    return new Response(body, {
      headers: {
        "Content-Type": CONTENT_TYPES[path.extname(key)] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
