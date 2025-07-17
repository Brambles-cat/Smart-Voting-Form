import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  // using https://nextjs.org/docs/app/api-reference/config/next-config-js/authInterrupts
  experimental: {
    authInterrupts: true,
  }
};

export default nextConfig;
