// KCSB Computing: add Letter Leaper as every class's first module, and give
// the crachad@lainglaing.com instructor account access to the org. Nothing
// else changes: no roster, work, or other module is touched (later modules
// just move down one place). Safe to re-run.
// Dry run: node --env-file=.env prisma/enable-letter-leaper-kcsb.mjs
// Apply:   node --env-file=.env prisma/enable-letter-leaper-kcsb.mjs --apply
import { PrismaClient } from "@prisma/client";
import { moduleWriter, checkCheckpoints } from "./seed-lib.mjs";
import { createLetterLeaperModule, LETTER_LEAPER_TITLE } from "./letter-leaper-module.mjs";
import { YEARS } from "./kcsb/strands.mjs";

const ACCESS_EMAIL = "crachad@lainglaing.com";
const apply = process.argv.includes("--apply");
const prisma = new PrismaClient();
try {
  const orgs = await prisma.org.findMany({ where: { name: "KCSB Computing" }, select: { id: true } });
  if (orgs.length !== 1) throw new Error(`Expected exactly one KCSB Computing organization, found ${orgs.length}.`);
  const org = orgs[0];
  const codes = YEARS.map((y) => y.code);
  const classes = await prisma.class.findMany({
    where: { orgId: org.id, classCode: { in: codes } },
    select: { id: true, name: true, classCode: true, modules: { select: { order: true, module: { select: { title: true } } }, orderBy: { order: "asc" } } },
  });
  if (!classes.length) throw new Error("No KCSB classes found.");
  const account = await prisma.instructor.findUnique({ where: { email: ACCESS_EMAIL }, select: { id: true, orgId: true, accessOrgs: { select: { id: true } } } });
  if (!account) throw new Error(`Instructor ${ACCESS_EMAIL} not found.`);
  const hasAccess = account.orgId === org.id || account.accessOrgs.some((o) => o.id === org.id);
  console.log(JSON.stringify({
    apply,
    access: { email: ACCESS_EMAIL, alreadyHasAccess: hasAccess },
    classes: classes.map((c) => ({
      code: c.classCode, name: c.name, modules: c.modules.length,
      hasLetterLeaper: c.modules.some((m) => m.module.title === LETTER_LEAPER_TITLE),
      firstModule: c.modules[0]?.module.title ?? null,
    })),
  }, null, 1));
  if (apply) {
    await prisma.$transaction(async (tx) => {
      const write = moduleWriter(tx, org, true);
      const mod = await createLetterLeaperModule(
        ({ blocks, criteria, ...data }) => write({ ...data, contentJson: JSON.stringify(blocks), criteria: { create: criteria } }),
        { teacher: "Coach Crachad" },
      );
      await checkCheckpoints(tx, [mod]);
      let added = 0;
      for (const klass of classes) {
        const existing = await tx.classModule.findUnique({ where: { classId_moduleId: { classId: klass.id, moduleId: mod.id } } });
        if (existing) continue;
        // First in the list: move the class's current modules down one place.
        await tx.classModule.updateMany({ where: { classId: klass.id }, data: { order: { increment: 1 } } });
        await tx.classModule.create({ data: { classId: klass.id, moduleId: mod.id, order: 0 } });
        added++;
      }
      if (!hasAccess) await tx.instructor.update({ where: { id: account.id }, data: { accessOrgs: { connect: { id: org.id } } } });
      console.log(JSON.stringify({ moduleId: mod.id, classesAdded: added, accessGranted: !hasAccess }));
    }, { timeout: 60000 });
  }
} finally {
  await prisma.$disconnect();
}
