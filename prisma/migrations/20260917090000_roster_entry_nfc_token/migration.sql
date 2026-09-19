-- AlterTable
ALTER TABLE "RosterEntry" ADD COLUMN     "nfcToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "RosterEntry_nfcToken_key" ON "RosterEntry"("nfcToken");
