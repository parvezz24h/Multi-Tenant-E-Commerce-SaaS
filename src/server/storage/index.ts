import "server-only";

import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { readS3Settings } from "./s3-config";

/**
 * File storage behind a tiny interface so product images can live on local
 * disk in development and in S3 / Cloudflare R2 in production.
 */
export interface StorageDriver {
  put(key: string, body: Uint8Array, contentType: string): Promise<void>;
  delete(key: string): Promise<void>;
  publicUrl(key: string): string;
}

/** Keys look like `stores/<storeId>/products/<productId>/<random>.webp`. */
export const STORAGE_KEY = /^stores\/[a-z0-9]+\/[a-z0-9/_-]+\.(?:jpg|png|webp)$/;

export const LOCAL_UPLOAD_ROOT = path.join(process.cwd(), ".uploads");

function localPath(key: string) {
  if (!STORAGE_KEY.test(key) || key.includes("..")) throw new Error("Invalid storage key");
  return path.join(LOCAL_UPLOAD_ROOT, key);
}

const localDriver: StorageDriver = {
  async put(key, body) {
    const file = localPath(key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, body);
  },
  async delete(key) {
    await rm(localPath(key), { force: true });
  },
  // Served by src/app/api/files/[...key]/route.ts. Relative, so it works on
  // the platform host and on every store subdomain.
  publicUrl: (key) => `/api/files/${key}`,
};

function s3Driver(): StorageDriver {
  const config = readS3Settings();
  const bucket = config.bucket;
  const publicBase = config.publicBaseUrl;
  const client = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
  });

  return {
    async put(key, body, contentType) {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
          CacheControl: "public, max-age=31536000, immutable",
        }),
      );
    },
    async delete(key) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
    publicUrl: (key) => `${publicBase}/${key}`,
  };
}

let driver: StorageDriver | undefined;

export function storage(): StorageDriver {
  driver ??= process.env.STORAGE_DRIVER === "s3" ? s3Driver() : localDriver;
  return driver;
}

export const isLocalStorage = () => process.env.STORAGE_DRIVER !== "s3";
