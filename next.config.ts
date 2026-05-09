import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["firebase-admin", "swisseph-wasm"],
};

export default nextConfig;
