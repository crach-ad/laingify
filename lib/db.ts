import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

// On serverless hosts (Vercel) the bundled SQLite file is read-only, so the
// seeded demo database is copied to /tmp on cold start. Writes work normally;
// state simply resets to the pristine demo seed when the instance recycles —
// exactly what a public demo wants. Locally, DATABASE_URL from .env is used.
function demoDatabaseUrl(): string | undefined {
  if (!process.env.VERCEL) return undefined;
  const tmp = "/tmp/laingify-demo.db";
  if (!fs.existsSync(tmp)) {
    fs.copyFileSync(path.join(process.cwd(), "prisma", "demo-seed.db"), tmp);
  }
  return `file:${tmp}`;
}

// Reuse a single PrismaClient across hot reloads in dev.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: demoDatabaseUrl(),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
