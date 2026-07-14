import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every route reads the demo SQLite seed at cold start (see lib/db.ts), so
  // it must ship inside each serverless function bundle.
  outputFileTracingIncludes: {
    "/": ["./prisma/demo-seed.db"],
    "/**": ["./prisma/demo-seed.db"],
  },
};

export default nextConfig;
