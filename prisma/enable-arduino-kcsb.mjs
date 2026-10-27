// KCSB Computing Years 5–8: add the Arduino track (IgniteHer's eight
// Programmable Electronics projects, prisma/arduino-modules.mjs) after each
// class's current modules. Nothing else changes: no roster, work, or existing
// module is touched. Sketches are compiled via hexi.wokwi.com on --apply.
// Safe to re-run.
// Dry run: node --env-file=.env prisma/enable-arduino-kcsb.mjs
// Apply:   node --env-file=.env prisma/enable-arduino-kcsb.mjs --apply
import { PrismaClient } from "@prisma/client";
import { moduleWriter, checkCheckpoints } from "./seed-lib.mjs";
import { createArduinoModules } from "./arduino-modules.mjs";
import { YEARS, ARDUINO_YEARS } from "./kcsb/strands.mjs";

const TITLES = ["First Blink", "Wire a Real LED", "Push-Button Light", "Traffic Light", "Temperature Logger", "Police Flasher", "Toggle Flashlight", "Heat Alarm"];
const apply = process.argv.includes("--apply");
const prisma = new PrismaClient();
try {
  const orgs = await prisma.org.findMany({ where: { name: "KCSB Computing" }, select: { id: true } });
  if (orgs.length !== 1) throw new Error(`Expected exactly one KCSB Computing organization, found ${orgs.length}.`);
  const org = orgs[0];
  const codes = YEARS.filter((y) => ARDUINO_YEARS.includes(y.key)).map((y) => y.code);
  const classes = await prisma.class.findMany({
    where: { orgId: org.id, classCode: { in: codes } },
    orderBy: { classCode: "asc" },
    select: { id: true, name: true, classCode: true, modules: { select: { module: { select: { title: true } } } } },
  });
  if (classes.length !== codes.length) throw new Error(`Expected ${codes.length} classes (${codes.join(", ")}), found ${classes.length}.`);
  const existing = await prisma.module.findMany({ where: { orgId: org.id, title: { in: TITLES } }, select: { title: true } });
  console.log(JSON.stringify({
    apply,
    arduinoModulesAlreadyInOrg: existing.map((m) => m.title),
    classes: classes.map((c) => ({ code: c.classCode, name: c.name, modules: c.modules.length, arduinoAssigned: c.modules.filter((m) => TITLES.includes(m.module.title)).length })),
  }, null, 1));
  if (apply) {
    const write = moduleWriter(prisma, org, true);
    const mods = await createArduinoModules(({ blocks, criteria, ...data }) => write({ ...data, contentJson: JSON.stringify(blocks), criteria: { create: criteria } }));
    if (mods.map((m) => m.title).join("|") !== TITLES.join("|")) throw new Error("Unexpected Arduino module titles: " + mods.map((m) => m.title).join(", "));
    await checkCheckpoints(prisma, mods);
    const added = await prisma.$transaction(async (tx) => {
      let n = 0;
      for (const klass of classes) {
        let next = ((await tx.classModule.aggregate({ where: { classId: klass.id }, _max: { order: true } }))._max.order ?? -1) + 1;
        for (const mod of mods) {
          const has = await tx.classModule.findUnique({ where: { classId_moduleId: { classId: klass.id, moduleId: mod.id } } });
          if (has) continue;
          await tx.classModule.create({ data: { classId: klass.id, moduleId: mod.id, order: next++ } });
          n++;
        }
      }
      return n;
    }, { timeout: 60000 });
    console.log(JSON.stringify({ modules: mods.map((m) => m.id), classAssignmentsAdded: added }));
  }
} finally {
  await prisma.$disconnect();
}
