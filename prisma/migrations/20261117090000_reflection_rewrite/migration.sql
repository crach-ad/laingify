CREATE TABLE "ReflectionRewriteRequest" (
  "id" TEXT NOT NULL,
  "learnerId" TEXT NOT NULL,
  "moduleId" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "instructorId" TEXT NOT NULL,
  "removedSubmissionId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fulfilledAt" TIMESTAMP(3),
  "replacementSubmissionId" TEXT,
  CONSTRAINT "ReflectionRewriteRequest_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ReflectionRewriteRequest_removedSubmissionId_key" ON "ReflectionRewriteRequest"("removedSubmissionId");
CREATE INDEX "ReflectionRewriteRequest_learnerId_moduleId_fulfilledAt_idx" ON "ReflectionRewriteRequest"("learnerId", "moduleId", "fulfilledAt");
-- Only one active request per learner/module, including concurrent requests.
CREATE UNIQUE INDEX "ReflectionRewriteRequest_pending_key" ON "ReflectionRewriteRequest"("learnerId", "moduleId") WHERE "fulfilledAt" IS NULL;
