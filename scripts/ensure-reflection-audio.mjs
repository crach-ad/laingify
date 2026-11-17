import { PrismaClient } from '@prisma/client';

// This additive compatibility migration must precede deployment of a client
// that selects Submission.audioUrl. Never reset or reseed existing data.
if (process.env.VERCEL === '1') {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) throw new Error('Database connection is required before deploying audio reflections.');
  const db = new PrismaClient({ datasources: { db: { url } } });
  try {
    await db.$transaction(async tx => {
      await tx.$executeRawUnsafe("SET LOCAL lock_timeout = '10s'");
      await tx.$executeRawUnsafe('ALTER TABLE "Submission" ADD COLUMN IF NOT EXISTS "audioUrl" TEXT');
      await tx.$queryRawUnsafe('SELECT "audioUrl" FROM "Submission" LIMIT 0');
    }, { timeout: 20000 });
    console.log('Verified Submission.audioUrl database readiness.');
  } finally {
    await db.$disconnect();
  }
} else {
  console.log('Local build: apply database migrations separately.');
}
