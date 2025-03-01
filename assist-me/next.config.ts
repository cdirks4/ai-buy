import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "use-sync-external-store/shim/with-selector": require.resolve(
        "use-sync-external-store/shim/with-selector.js"
      ),
    };
    return config;
  },
};

export default nextConfig;
