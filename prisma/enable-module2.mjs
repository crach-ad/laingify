// Assign Module 2 (Clicky Fidget) to the Winners Camp class WITHOUT touching
// any camper data — safe to run mid-camp, e.g. the morning of Day 2.
//   node prisma/enable-module2.mjs

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.org.findFirst({ where: { name: "Winners Camp" } });
  if (!org) throw new Error("Winners Camp org not found.");
  const klass = await prisma.class.findFirst({ where: { orgId: org.id } });
  const module2 = await prisma.module.findFirst({
    where: { orgId: org.id, title: { contains: "Module 2" } },
  });
  if (!klass || !module2) throw new Error("Class or Module 2 not found.");

  const existing = await prisma.classModule.findUnique({
    where: { classId_moduleId: { classId: klass.id, moduleId: module2.id } },
  });
  if (existing) {
    console.log("Module 2 is already assigned — nothing to do.");
    return;
  }
  await prisma.classModule.create({
    data: { classId: klass.id, moduleId: module2.id, order: 1 },
  });
  console.log(`Module 2 ("${module2.title}") is now live for class ${klass.classCode}.`);
  console.log("No camper data was touched.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
