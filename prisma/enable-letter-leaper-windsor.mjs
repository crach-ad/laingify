// Add only this module and its class assignments. No roster changes or full seed.
// Dry run: node --env-file=.env prisma/enable-letter-leaper-windsor.mjs
// Apply:   node --env-file=.env prisma/enable-letter-leaper-windsor.mjs --apply
import { PrismaClient } from "@prisma/client";
import { moduleWriter, checkCheckpoints } from "./seed-lib.mjs";
import { createLetterLeaperModule, LETTER_LEAPER_TITLE } from "./letter-leaper-module.mjs";
const prisma = new PrismaClient();
try {
  const orgs = await prisma.org.findMany({ where: { name: "Windsor School" }, select: { id: true } });
  if (orgs.length !== 1) throw new Error("Expected exactly one Windsor School organization.");
  const org = orgs[0];
  const pam = await prisma.instructor.findFirst({ where: { orgId: org.id, email: "pamelakristinasmith@gmail.com" }, select: { id: true } });
  if (!pam) throw new Error("Pamela Smith's Windsor organization could not be verified.");
  const classes = await prisma.class.findMany({ where: { orgId: org.id, classCode: { startsWith: "WSR-" } }, select: { id: true, name: true, classCode: true } });
  if (!classes.length) throw new Error("No Windsor classes found.");
  console.log(JSON.stringify({ module: LETTER_LEAPER_TITLE, classes: classes.map(c => ({ name: c.name, code: c.classCode })), apply: process.argv.includes("--apply") }));
  if (process.argv.includes("--apply")) {
    await prisma.$transaction(async tx => {
      const write = moduleWriter(tx, org, true);
      const mod = await createLetterLeaperModule(({ blocks, criteria, ...data }) => write({ ...data, contentJson: JSON.stringify(blocks), criteria: { create: criteria } }));
      await checkCheckpoints(tx, [mod]);
      for (const klass of classes) {
        const last = await tx.classModule.aggregate({ where: { classId: klass.id }, _max: { order: true } });
        await tx.classModule.upsert({ where: { classId_moduleId: { classId: klass.id, moduleId: mod.id } }, update: {}, create: { classId: klass.id, moduleId: mod.id, order: (last._max.order ?? -1) + 1 } });
      }
      console.log(JSON.stringify({ moduleId: mod.id, assignedClasses: classes.length }));
    }, { timeout: 30000 });
  }
} finally { await prisma.$disconnect(); }
