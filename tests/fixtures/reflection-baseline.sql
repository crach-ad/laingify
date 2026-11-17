-- AlterTable
ALTER TABLE "Module" ADD COLUMN     "topic" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Sprite" ADD COLUMN     "avatarColors" TEXT NOT NULL DEFAULT '{}',
ADD COLUMN     "avatarSeed" TEXT,
ADD COLUMN     "avatarStyle" TEXT,
ADD COLUMN     "avatarTraits" TEXT NOT NULL DEFAULT '{}';

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearnerEvent" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "moduleId" TEXT,
    "type" TEXT NOT NULL,
    "meta" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearnerEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_InstructorAccess" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_InstructorAccess_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_classId_learnerId_date_key" ON "AttendanceRecord"("classId", "learnerId", "date");

-- CreateIndex
CREATE INDEX "LearnerEvent_learnerId_createdAt_idx" ON "LearnerEvent"("learnerId", "createdAt");

-- CreateIndex
CREATE INDEX "LearnerEvent_moduleId_type_createdAt_idx" ON "LearnerEvent"("moduleId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "_InstructorAccess_B_index" ON "_InstructorAccess"("B");

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "Instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearnerEvent" ADD CONSTRAINT "LearnerEvent_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InstructorAccess" ADD CONSTRAINT "_InstructorAccess_A_fkey" FOREIGN KEY ("A") REFERENCES "Instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InstructorAccess" ADD CONSTRAINT "_InstructorAccess_B_fkey" FOREIGN KEY ("B") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

