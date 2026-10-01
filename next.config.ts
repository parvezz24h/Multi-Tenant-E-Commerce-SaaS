import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Product images are uploaded one per action call (max 5 MB each).
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
