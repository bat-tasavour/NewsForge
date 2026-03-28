import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/webp"],
    deviceSizes: [480, 768, 1024, 1280, 1600],
    imageSizes: [64, 96, 160, 240, 320]
  },
  experimental: {
    optimizePackageImports: ["@tiptap/react"]
  }
};

export default nextConfig;
