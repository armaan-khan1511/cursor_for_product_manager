import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: true,
  },
  eslint: {
    // Ignores ESLint errors during the build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignores TypeScript errors during the build
    ignoreBuildErrors: true,
  },
};

export default nextConfig;