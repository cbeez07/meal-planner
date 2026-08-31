import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@libsql/client"],
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
