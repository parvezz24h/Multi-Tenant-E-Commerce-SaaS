/**
 * Check the S3 setup end to end: upload a tiny test image, load it through
 * the public URL (what shoppers' browsers do), then delete it.
 *
 *   pnpm storage:check
 */
import "dotenv/config";

import { randomBytes } from "node:crypto";

import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { readS3Settings } from "../src/server/storage/s3-config";

// 1×1 transparent PNG.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

function explain(error: unknown) {
  const e = error as { name?: string; Code?: string; message?: string; $metadata?: { httpStatusCode?: number } };
  const code = e.name ?? e.Code ?? "";
  if (code === "InvalidAccessKeyId") return "The access key ID is wrong (S3_ACCESS_KEY_ID).";
  if (code === "SignatureDoesNotMatch") return "The secret access key is wrong (S3_SECRET_ACCESS_KEY).";
  if (code === "NoSuchBucket") return "That bucket doesn't exist (check S3_BUCKET and S3_REGION).";
  if (code === "PermanentRedirect" || code === "AuthorizationHeaderMalformed") {
    return "The bucket is in a different region. Set S3_REGION to the bucket's region.";
  }
  if (code === "AccessDenied") return "The IAM user isn't allowed to write here. Give it s3:PutObject and s3:DeleteObject on <bucket>/stores/*.";
  return `${code || "Error"}: ${e.message ?? String(error)}`;
}

async function main() {
  if (process.env.STORAGE_DRIVER !== "s3") {
    console.warn('Note: STORAGE_DRIVER is not "s3", so the app still saves uploads to local disk.\n');
  }

  let config;
  try {
    config = readS3Settings();
  } catch (error) {
    console.error("✗", (error as Error).message);
    process.exit(1);
  }
  console.log(`Bucket:     ${config.bucket} (${config.region})`);
  console.log(`Public URL: ${config.publicBaseUrl}\n`);

  const client = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
  });
  const key = `stores/healthcheck/${randomBytes(8).toString("hex")}.png`;

  try {
    await client.send(
      new PutObjectCommand({ Bucket: config.bucket, Key: key, Body: PNG, ContentType: "image/png" }),
    );
    console.log("✓ Upload works");
  } catch (error) {
    console.error("✗ Upload failed —", explain(error));
    process.exit(1);
  }

  let ok = true;
  try {
    const res = await fetch(`${config.publicBaseUrl}/${key}`, { cache: "no-store" });
    if (res.ok) {
      console.log(`✓ Public URL works (${res.status}, ${res.headers.get("content-type")})`);
    } else {
      ok = false;
      console.error(
        `✗ Public URL returned ${res.status}.` +
          (res.status === 403
            ? " Images aren't publicly readable yet: allow s3:GetObject on <bucket>/stores/* in the bucket policy (and turn off 'Block public access' for bucket policies), or put CloudFront in front and set S3_PUBLIC_URL."
            : ""),
      );
    }
  } catch (error) {
    ok = false;
    console.error("✗ Couldn't reach the public URL —", (error as Error).message);
  }

  try {
    await client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }));
    console.log("✓ Delete works");
  } catch (error) {
    ok = false;
    console.error("✗ Delete failed —", explain(error));
  }

  console.log(ok ? "\nS3 is ready. Set STORAGE_DRIVER=s3 to use it." : "\nFix the problems above and run this again.");
  process.exit(ok ? 0 : 1);
}

main();
