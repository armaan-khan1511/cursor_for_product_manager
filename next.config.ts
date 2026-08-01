import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: true,
  },
  eslint: {
    // This allows production builds to successfully complete 
    // even if there are ESLint configuration issues.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;