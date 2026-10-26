-- CreateTable
CREATE TABLE "TypingAssignment" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "letterSet" TEXT NOT NULL DEFAULT 'all',
    "pace" TEXT NOT NULL DEFAULT 'relaxed',
    "scope" TEXT NOT NULL DEFAULT 'full',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TypingAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TypingSession" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "letterSet" TEXT NOT NULL,
    "pace" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "hints" BOOLEAN NOT NULL,
    "inputMethod" TEXT NOT NULL DEFAULT 'unknown',
    "gameVersion" TEXT NOT NULL,
    "measurementVersion" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "lastActivityAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "endReason" TEXT,
    "startLeap" INTEGER NOT NULL DEFAULT 0,
    "furthestLeap" INTEGER NOT NULL DEFAULT 0,
    "lastSeq" INTEGER NOT NULL DEFAULT -1,
    "activeMs" INTEGER NOT NULL DEFAULT 0,
    "pauseMs" INTEGER NOT NULL DEFAULT 0,
    "animationMs" INTEGER NOT NULL DEFAULT 0,
    "hiddenMs" INTEGER NOT NULL DEFAULT 0,
    "responseMs" INTEGER NOT NULL DEFAULT 0,
    "idleMs" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "correct" INTEGER NOT NULL DEFAULT 0,
    "timeouts" INTEGER NOT NULL DEFAULT 0,
    "wordsCompleted" INTEGER NOT NULL DEFAULT 0,
    "summaryJson" TEXT NOT NULL DEFAULT '{}',
    "eventsPurgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TypingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TypingEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "t" INTEGER NOT NULL,
    "data" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TypingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignInFailure" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SignInFailure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TypingAssignment_classId_key" ON "TypingAssignment"("classId");

-- CreateIndex
CREATE INDEX "TypingSession_classId_startedAt_idx" ON "TypingSession"("classId", "startedAt");

-- CreateIndex
CREATE INDEX "TypingSession_learnerId_startedAt_idx" ON "TypingSession"("learnerId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TypingEvent_sessionId_seq_key" ON "TypingEvent"("sessionId", "seq");

-- CreateIndex
CREATE INDEX "SignInFailure_learnerId_createdAt_idx" ON "SignInFailure"("learnerId", "createdAt");

-- AddForeignKey
ALTER TABLE "TypingAssignment" ADD CONSTRAINT "TypingAssignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TypingSession" ADD CONSTRAINT "TypingSession_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TypingSession" ADD CONSTRAINT "TypingSession_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TypingEvent" ADD CONSTRAINT "TypingEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TypingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

