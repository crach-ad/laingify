// Windsor School — Pamela Smith's Digital Literacy classes (2026-27 schedule).
// Own org (never touches Abaco/KCSB data). Eleven classes, one per timetable
// group, each assigned the full K'NEX Engineering topic (15 project modules,
// shared source: prisma/knex-modules.mjs).
//
//   npm run seed:windsor             — full reset of the Windsor org only.
//                                      ⚠️  DELETES all Windsor student work.
//   npm run content:update:windsor   — SAFE: upsert modules in place,
//                                      learners and their work untouched.

import { PrismaClient } from "@prisma/client";
import { wipeOrg } from "./org-wipe.mjs";
import { moduleWriter, syncClassModules, checkCheckpoints } from "./seed-lib.mjs";
import { createKnexModules } from "./knex-modules.mjs";

const prisma = new PrismaClient();
const ORG_NAME = "Windsor School";
const UPDATE = process.argv.includes("--update");

// ⚠️ Placeholder email — swap for Pamela's real address before she signs in
// (login is email + PIN at /instruct/login).
const INSTRUCTOR = { displayName: "Ms. Pamela Smith", email: "pamela.smith@windsor.school", pin: "2468" };
// The platform owner keeps oversight of this org too.
const OWNER_EMAIL = "crachad.laing@gmail.com";

// From the weekly schedule (Digital Literacy 2026-27). Lunch duty isn't a class.
const CLASSES = [
  { name: "Yr 1D/1K", code: "WSR-1DK", band: "EARLY" },
  { name: "Yr 2A", code: "WSR-2A", band: "EARLY" },
  { name: "Yr 2D", code: "WSR-2D", band: "EARLY" },
  { name: "Yr 3L/3S", code: "WSR-3LS", band: "YOUTH" },
  { name: "Yr 4K", code: "WSR-4K", band: "YOUTH" },
  { name: "Yr 4E", code: "WSR-4E", band: "YOUTH" },
  { name: "Yr 5C", code: "WSR-5C", band: "YOUTH" },
  { name: "Yr 5S", code: "WSR-5S", band: "YOUTH" },
  { name: "Yr 6L", code: "WSR-6L", band: "YOUTH" },
  { name: "Yr 6A", code: "WSR-6A", band: "YOUTH" },
  { name: "Yr 5&6 Elective", code: "WSR-56E", band: "YOUTH" },
];

async function main() {
  let org;
  if (UPDATE) {
    org = await prisma.org.findFirst({ where: { name: ORG_NAME } });
    if (!org) throw new Error("Org not found — run the full seed once first: npm run seed:windsor");
    console.log("Content-update mode: modules upserted in place — learners and their work untouched.");
  } else {
    console.log("Seeding Windsor School (org-scoped — other orgs untouched)…");
    await wipeOrg(prisma, ORG_NAME);
    org = await prisma.org.create({ data: { name: ORG_NAME, context: "community" } });
  }

  const createModule = moduleWriter(prisma, org, UPDATE);
  const projectModule = ({ topic, title, summary, badgeName, badgeIcon, badgeDescription, blocks, criteria }) =>
    createModule({
      orgId: org.id,
      topic,
      title,
      summary,
      badgeName,
      badgeIcon,
      badgeDescription,
      contentJson: JSON.stringify(blocks),
      criteria: { create: criteria },
    });

  const modules = await createKnexModules(projectModule);
  await checkCheckpoints(prisma, modules);

  const base = Date.now() - CLASSES.length * 1000;
  for (let i = 0; i < CLASSES.length; i++) {
    const def = CLASSES[i];
    let klass = await prisma.class.findFirst({ where: { orgId: org.id, classCode: def.code } });
    if (!klass) {
      klass = await prisma.class.create({
        data: {
          orgId: org.id,
          name: def.name,
          classCode: def.code,
          band: def.band,
          minAuthTier: 0, // open self-registration: name + selfie
          createdAt: new Date(base + i * 1000), // console lists classes in year order
        },
      });
    }
    await syncClassModules(prisma, klass.id, modules);
  }

  // Pamela: home org Windsor (create or repoint on re-seed).
  const pamela = await prisma.instructor.findUnique({ where: { email: INSTRUCTOR.email } });
  if (!pamela) await prisma.instructor.create({ data: { ...INSTRUCTOR, orgId: org.id } });
  else if (pamela.orgId !== org.id) await prisma.instructor.update({ where: { id: pamela.id }, data: { orgId: org.id } });

  // Owner oversight via accessOrgs.
  const owner = await prisma.instructor.findUnique({ where: { email: OWNER_EMAIL } });
  if (owner) await prisma.instructor.update({ where: { id: owner.id }, data: { accessOrgs: { connect: { id: org.id } } } });

  console.log(`Windsor School ready: ${CLASSES.length} classes, ${modules.length} K'NEX modules each.`);
  console.log(`  Classes: ${CLASSES.map((c) => `${c.name} (${c.code})`).join(", ")}`);
  console.log(`  Instructor: ${INSTRUCTOR.email} / PIN ${INSTRUCTOR.pin}  ⚠️ placeholder email — update before real use`);
  if (owner) console.log(`  Oversight: ${OWNER_EMAIL} also sees this org.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
