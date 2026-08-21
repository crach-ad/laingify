// Weekly class digest (ANALYTICS.md Phase C1).
//
//   npm run digest                    # this week so far, every class with activity
//   npm run digest -- --week 2026-W33 # a specific ISO week
//   npm run digest -- --org "KCSB Computing"
//
// Writes reports/<week>/<class-slug>.md (+ index.md) — reports/ is gitignored,
// same stance as student-work/. Read-only against the DB (shares lib/insights.ts
// with the console's Insights tab).

import { PrismaClient } from "@prisma/client";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { isoWeek, loadClassInsights } from "../lib/insights.ts";

const prisma = new PrismaClient();
const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? null : args[i + 1];
};
const ORG = flag("--org");
const WEEK = flag("--week") ?? isoWeek(new Date());

// [start, end) of an ISO week like "2026-W33".
function weekRange(key) {
  const [y, w] = key.split("-W").map(Number);
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() || 7) - 1) + (w - 1) * 7);
  const end = new Date(monday);
  end.setUTCDate(monday.getUTCDate() + 7);
  return [monday, end];
}

const slug = (s) => s.normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").toLowerCase() || "class";
const DATE = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

const [start, end] = weekRange(WEEK);
const classes = await prisma.class.findMany({
  where: ORG ? { org: { name: ORG } } : {},
  include: { org: true, roster: { include: { learner: true } } },
  orderBy: [{ org: { createdAt: "asc" } }, { createdAt: "asc" }],
});

const outDir = path.resolve("reports", WEEK);
await mkdir(outDir, { recursive: true });
const index = [];

for (const klass of classes) {
  const ids = klass.roster.map((r) => r.learnerId);
  if (ids.length === 0) continue;
  const nameOf = new Map(klass.roster.map((r) => [r.learnerId, r.learner.displayName]));

  // This week's raw activity.
  const inWeek = { gte: start, lt: end };
  const [evidence, submissions, completions] = await Promise.all([
    prisma.evidence.findMany({ where: { learnerId: { in: ids }, createdAt: inWeek }, select: { learnerId: true, type: true } }),
    prisma.submission.findMany({ where: { learnerId: { in: ids }, createdAt: inWeek }, select: { learnerId: true, content: true } }),
    prisma.moduleProgress.findMany({
      where: { learnerId: { in: ids }, status: "COMPLETED", completedAt: inWeek },
      select: { learnerId: true, moduleId: true },
    }),
  ]);
  const activeIds = new Set([...evidence.map((e) => e.learnerId), ...submissions.map((s) => s.learnerId)]);
  if (activeIds.size === 0 && completions.length === 0) continue; // quiet week — no report

  const badgeModules = new Map(
    (
      await prisma.module.findMany({
        where: { id: { in: [...new Set(completions.map((c) => c.moduleId))] } },
        select: { id: true, title: true, badgeName: true, badgeIcon: true },
      })
    ).map((m) => [m.id, m]),
  );

  const insights = await loadClassInsights(klass.id);
  const weeks = insights.weekly.weeks;
  const thisIdx = weeks.findIndex((w) => w.week === WEEK);
  const thisWeek = thisIdx >= 0 ? weeks[thisIdx] : { active: activeIds.size, returning: 0 };
  const lastWeek = thisIdx > 0 ? weeks[thisIdx - 1] : null;

  const wordCounts = submissions.map((s) => s.content.split(/\s+/).filter(Boolean).length).sort((a, b) => a - b);
  const medianWords = wordCounts.length ? wordCounts[Math.floor(wordCounts.length / 2)] : 0;

  const md = [];
  md.push(`# ${klass.name} — week ${WEEK}`);
  md.push("");
  md.push(`${klass.org.name} · ${DATE.format(start)}–${DATE.format(new Date(end.getTime() - 1))} · generated ${new Date().toISOString().slice(0, 10)}`);
  md.push("");
  md.push("## Headlines");
  md.push("");
  md.push(`- **${thisWeek.active}** of ${ids.length} learners active${lastWeek ? ` (last week ${lastWeek.active}${lastWeek.active > 0 ? `, ${Math.round((thisWeek.returning / lastWeek.active) * 100)}% returned` : ""})` : ""}`);
  md.push(`- **${completions.length}** badge${completions.length === 1 ? "" : "s"} earned · **${submissions.length}** wrap-up${submissions.length === 1 ? "" : "s"} written${submissions.length ? ` (median ${medianWords} words)` : ""} · **${evidence.length}** pieces of evidence captured`);
  md.push("");
  if (completions.length > 0) {
    md.push("## Badges earned this week");
    md.push("");
    for (const c of completions) {
      const m = badgeModules.get(c.moduleId);
      md.push(`- ${m?.badgeIcon ?? "🏅"} **${nameOf.get(c.learnerId) ?? c.learnerId}** — ${m?.title ?? c.moduleId} (${m?.badgeName ?? "badge"})`);
    }
    md.push("");
  }
  if (insights.attention.length > 0) {
    md.push("## Worth a check-in");
    md.push("");
    for (const a of insights.attention) md.push(`- **${a.displayName}** — ${a.reasons.join("; ")}`);
    md.push("");
  }
  const moving = insights.funnel.filter((f) => f.started > 0 && f.badge < f.started);
  if (moving.length > 0) {
    md.push("## Projects in flight");
    md.push("");
    md.push("| Project | Started | Evidence in | Wrap-up in | Badge |");
    md.push("|---|---|---|---|---|");
    for (const f of moving) md.push(`| ${f.badgeIcon} ${f.title} | ${f.started} | ${f.someEvidence} | ${f.wrapUp} | ${f.badge} |`);
    md.push("");
  }
  const file = `${slug(klass.name)}.md`;
  await writeFile(path.join(outDir, file), md.join("\n"));
  index.push({ klass, file, active: thisWeek.active, badges: completions.length });
  console.log(`  ${klass.name}: ${thisWeek.active} active, ${completions.length} badges → reports/${WEEK}/${file}`);
}

if (index.length === 0) {
  console.log(`No class had activity in ${WEEK} — nothing written.`);
} else {
  const idx = [
    `# Weekly digest — ${WEEK}`,
    "",
    ...index.map((i) => `- [${i.klass.name}](./${i.file}) (${i.klass.org.name}) — ${i.active} active, ${i.badges} badges`),
    "",
  ];
  await writeFile(path.join(outDir, "index.md"), idx.join("\n"));
  console.log(`Index → reports/${WEEK}/index.md`);
}
await prisma.$disconnect();
