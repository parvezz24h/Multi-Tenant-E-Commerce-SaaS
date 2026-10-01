/**
 * S3 / S3-compatible (Cloudflare R2, etc.) settings from the environment.
 * Shared by the storage driver and `pnpm storage:check`; no server-only
 * import so the script can use it too.
 *
 *   S3_BUCKET             bucket name (required)
 *   S3_REGION             AWS region, e.g. ap-southeast-1 (required for AWS)
 *   S3_ACCESS_KEY_ID      IAM access key (required)
 *   S3_SECRET_ACCESS_KEY  IAM secret (required)
 *   S3_ENDPOINT           only for S3-compatible services such as R2
 *   S3_PUBLIC_URL         base URL images are served from; defaults to the
 *                         bucket's AWS URL. Set it for CloudFront, a custom
 *                         CDN domain or R2.
 */
export type S3Settings = {
  bucket: string;
  region: string;
  endpoint?: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl: string;
};

export function readS3Settings(env: Record<string, string | undefined> = process.env): S3Settings {
  const missing: string[] = [];
  const need = (name: string) => {
    const value = env[name]?.trim();
    if (!value) missing.push(name);
    return value ?? "";
  };

  const bucket = need("S3_BUCKET");
  const accessKeyId = need("S3_ACCESS_KEY_ID");
  const secretAccessKey = need("S3_SECRET_ACCESS_KEY");
  const endpoint = env.S3_ENDPOINT?.trim() || undefined;
  // R2 and friends use "auto"; AWS needs the bucket's real region.
  const region = env.S3_REGION?.trim() || (endpoint ? "auto" : need("S3_REGION"));
  const explicitPublicUrl = env.S3_PUBLIC_URL?.trim();
  if (endpoint && !explicitPublicUrl) missing.push("S3_PUBLIC_URL");

  if (missing.length) {
    throw new Error(`Missing ${missing.join(", ")} (required when STORAGE_DRIVER=s3).`);
  }

  const publicBaseUrl = (explicitPublicUrl || `https://${bucket}.s3.${region}.amazonaws.com`).replace(/\/+$/, "");
  return { bucket, region, endpoint, accessKeyId, secretAccessKey, publicBaseUrl };
}
