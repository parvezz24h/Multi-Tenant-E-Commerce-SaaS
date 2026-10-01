import { describe, expect, it } from "vitest";

import { readS3Settings } from "@/server/storage/s3-config";

const aws = {
  S3_BUCKET: "shopcreatorbd-images",
  S3_REGION: "ap-southeast-1",
  S3_ACCESS_KEY_ID: "AKIAEXAMPLE",
  S3_SECRET_ACCESS_KEY: "secret",
};

describe("readS3Settings", () => {
  it("derives the AWS public URL from bucket and region", () => {
    expect(readS3Settings(aws).publicBaseUrl).toBe("https://shopcreatorbd-images.s3.ap-southeast-1.amazonaws.com");
  });

  it("uses S3_PUBLIC_URL (e.g. CloudFront) when set, without a trailing slash", () => {
    expect(readS3Settings({ ...aws, S3_PUBLIC_URL: "https://cdn.example.com/" }).publicBaseUrl).toBe(
      "https://cdn.example.com",
    );
  });

  it("requires the region for AWS", () => {
    expect(() => readS3Settings({ ...aws, S3_REGION: undefined })).toThrow(/S3_REGION/);
  });

  it("supports S3-compatible services with an endpoint and public URL", () => {
    const r2 = readS3Settings({
      ...aws,
      S3_REGION: "",
      S3_ENDPOINT: "https://abc.r2.cloudflarestorage.com",
      S3_PUBLIC_URL: "https://images.example.com",
    });
    expect(r2.region).toBe("auto");
    expect(r2.publicBaseUrl).toBe("https://images.example.com");
  });

  it("lists every missing setting", () => {
    expect(() => readS3Settings({})).toThrow(
      /S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_REGION/,
    );
  });
});
