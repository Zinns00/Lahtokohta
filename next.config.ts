import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // @ts-expect-error - Turbopack root is valid but missing from types
    turbopack: {
      root: process.cwd(),
    },
  },
};

export default nextConfig;
