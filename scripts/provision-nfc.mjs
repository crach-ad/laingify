// Provision NFC tap-to-login tags for a class roster.
//
//   node --env-file=.env scripts/provision-nfc.mjs --class-code IGNITE --names-file <path>
//
// For each name in --names-file (one per line): finds or creates the Learner
// + RosterEntry (same match-by-displayName rule as /api/join's tier-0 flow),
// then generates an nfcToken for that RosterEntry IF IT DOESN'T ALREADY HAVE
// ONE — reruns are safe and never invalidate a tag that's already written.
//
// Prints a name → URL table. Write each URL onto a physical tag with the NFC
// Tools app: Write → Add a record → URL/URI → paste → tap the tag.
//
// Keep the names file OUTSIDE the repo (this codebase's GitHub repo is
// public) — pass a path to a local file, e.g. in your scratchpad or Desktop,
// never commit a roster of real names.
//
//   --base-url  override the domain the tags point at (default below;
//               use http://localhost:3210 to test before writing real tags)
//   --regen "Full Name"   force-regenerate one student's token (lost tag)

import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? null : args[i + 1];
};
const classCode = flag("--class-code");
const namesFile = flag("--names-file");
const baseUrl = (flag("--base-url") ?? "https://laingify.vercel.app").replace(/\/+$/, "");
const regenName = flag("--regen");

if (!classCode || !namesFile) {
  console.error("Usage: node --env-file=.env scripts/provision-nfc.mjs --class-code CODE --names-file <path> [--base-url URL] [--regen \"Full Name\"]");
  process.exit(1);
}

const prisma = new PrismaClient();
const newToken = () => randomBytes(15).toString("base64url"); // 20 chars, URL-safe

async function main() {
  const klass = await prisma.class.findUnique({ where: { classCode } });
  if (!klass) throw new Error(`No class with code "${classCode}"`);

  const raw = await readFile(namesFile, "utf8");
  const names = raw.split("\n").map((n) => n.trim()).filter(Boolean);
  if (names.length === 0) throw new Error(`No names found in ${namesFile}`);

  const rows = [];
  for (const name of names) {
    let entry = await prisma.rosterEntry.findFirst({
      where: { classId: klass.id, learner: { displayName: { equals: name, mode: "insensitive" } } },
      include: { learner: true },
    });
    if (!entry) {
      const learner = await prisma.learner.create({ data: { displayName: name, band: klass.band } });
      entry = await prisma.rosterEntry.create({
        data: { classId: klass.id, learnerId: learner.id },
        include: { learner: true },
      });
      console.log(`  + created learner: ${name}`);
    }

    const forceRegen = regenName && regenName.toLowerCase() === name.toLowerCase();
    if (!entry.nfcToken || forceRegen) {
      entry = await prisma.rosterEntry.update({
        where: { id: entry.id },
        data: { nfcToken: newToken() },
        include: { learner: true },
      });
      console.log(`  ${forceRegen ? "~ regenerated" : "+ new"} token: ${name}`);
    }

    rows.push({ name, url: `${baseUrl}/nfc/${entry.nfcToken}` });
  }

  console.log(`\n${klass.name} (${classCode}) — ${rows.length} tags:\n`);
  for (const r of rows) console.log(`${r.name.padEnd(28)} ${r.url}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
