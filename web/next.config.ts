import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const monorepoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

const nextConfig: NextConfig = {
  transpilePackages: ["ouways-sdk"],
  outputFileTracingRoot: monorepoRoot,
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": false,
    };
    return config;
  },
};

export default nextConfig;
