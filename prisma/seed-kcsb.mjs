// KCSB Computing — Reception to Year 8, one class per year group, one project
// module per strand per year (see KCSB.md for the plan and the module matrix).
//
// ONLY touches the "KCSB Computing" org. The Abaco camp org is never read or
// written, except that the camp coach's instructor account is granted access
// to this org so one console shows every class.
//
//   npm run seed:kcsb                 — full reset of the KCSB org.
//                                       ⚠️  DELETES all KCSB student work.
//   npm run content:update:kcsb       — SAFE: upsert modules in place (matched
//                                       by title), learners/work untouched.
//   … --year 3  (or reception)        — limit either mode to one year group.

import { PrismaClient } from "@prisma/client";
import { wipeOrg } from "./org-wipe.mjs";
import { moduleWriter, syncClassModules, checkCheckpoints } from "./seed-lib.mjs";
import { YEARS, STRAND_ORDER } from "./kcsb/strands.mjs";

const prisma = new PrismaClient();
const ORG_NAME = "KCSB Computing";
const UPDATE = process.argv.includes("--update");
const yearArg = (() => {
  const i = process.argv.indexOf("--year");
  return i === -1 ? null : String(process.argv[i + 1]).toLowerCase();
})();

// The coach account that should see every KCSB class (home org: Abaco camp).
const COACH = { displayName: "Coach Crachad", email: "crachad.laing@gmail.com", pin: "4321" };

const selected = YEARS.filter(
  (y) => !yearArg || y.key === yearArg || y.key === `year-${yearArg}` || y.name.toLowerCase() === yearArg,
);
if (selected.length === 0) throw new Error(`Unknown --year "${yearArg}"`);
if (yearArg && !UPDATE) throw new Error("--year only makes sense with --update (a full seed always rebuilds the whole org).");

async function main() {
  let org;
  if (UPDATE) {
    org = await prisma.org.findFirst({ where: { name: ORG_NAME } });
    if (!org) throw new Error("Org not found — run the full seed once first: npm run seed:kcsb");
    console.log(`Content-update mode (${selected.map((y) => y.name).join(", ")}): modules upserted in place, learners untouched.`);
  } else {
    console.log("Seeding KCSB Computing (org-scoped — other orgs untouched)…");
    await wipeOrg(prisma, ORG_NAME);
    org = await prisma.org.create({ data: { name: ORG_NAME, context: "community" } });
  }
  const createModule = moduleWriter(prisma, org, UPDATE);

  for (const year of selected) {
    let defs;
    try {
      ({ modules: defs } = await import(`./kcsb/${year.key}.mjs`));
    } catch (e) {
      if (e.code !== "ERR_MODULE_NOT_FOUND") throw e;
      console.log(`\n${year.name}: ⚠️  prisma/kcsb/${year.key}.mjs not authored yet — skipped`);
      continue;
    }
    if (defs.length !== STRAND_ORDER.length)
      throw new Error(`${year.name}: expected ${STRAND_ORDER.length} modules (one per strand), got ${defs.length}`);
    console.log(`\n${year.name} (${year.code}, ${year.band})`);
    const modules = [];
    for (const def of defs) modules.push(await createModule(def));
    await checkCheckpoints(prisma, modules);

    let klass = await prisma.class.findFirst({ where: { orgId: org.id, classCode: year.code } });
    if (!klass) {
      klass = await prisma.class.create({
        data: {
          orgId: org.id,
          name: year.name,
          classCode: year.code,
          band: year.band,
          minAuthTier: 0, // open: pupils self-register with name + selfie
        },
      });
    }
    await syncClassModules(prisma, klass.id, modules);
    for (const m of modules) console.log(`    ${m.badgeIcon} ${m.title} → "${m.badgeName}" badge`);
  }

  // Instructor: reuse the coach's existing account if it lives in another org
  // (grant access to this org); otherwise create it here.
  const coach = await prisma.instructor.findUnique({ where: { email: COACH.email } });
  if (coach) {
    if (coach.orgId !== org.id)
      await prisma.instructor.update({ where: { id: coach.id }, data: { accessOrgs: { connect: { id: org.id } } } });
  } else {
    await prisma.instructor.create({ data: { ...COACH, orgId: org.id } });
  }

  console.log(`\nKCSB Computing ready. Classes: ${selected.map((y) => `${y.name} (code ${y.code})`).join(", ")}`);
  console.log(`Instructor: ${COACH.email} sees these classes alongside any other org they belong to.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
