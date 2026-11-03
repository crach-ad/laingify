import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/bebras/explanation": ["./content/bebras/explanations/*.png"],
  },
};

export default nextConfig;
