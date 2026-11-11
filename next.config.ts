import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  experimental: { serverActions: { bodySizeLimit: "1mb" } }
};
export default nextConfig;
