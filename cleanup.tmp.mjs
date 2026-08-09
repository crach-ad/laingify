import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const learner = await prisma.learner.findFirst({ where: { displayName: "Wrapup Tester" } });
if (learner) {
  const w = { learnerId: learner.id };
  for (const model of ["evidence", "criterionStatus", "submission", "moduleProgress", "project", "sprite", "rosterEntry"]) {
    try { await prisma[model].deleteMany({ where: w }); } catch {}
  }
  await prisma.learner.delete({ where: { id: learner.id } });
  console.log("test learner deleted");
}
await prisma.$disconnect();
