// Termly per-learner report (ANALYTICS.md Phase C2): one self-contained HTML
// per learner — strand coverage, badge timeline, writing growth, time on task.
//
//   npm run report:term -- --class KCSB-3 --from 2026-09-01 --to 2026-12-11
//   npm run report:term -- --class FUTURE            # whole history
//
// Output: reports/term-<class-code>-<to|now>/<learner>.html (+ index.md).
// Read-only against the DB; media stays out (links point at the app).

import { PrismaClient } from "@prisma/client";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { strandCoverage } from "../lib/insights.ts";

const prisma = new PrismaClient();
const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? null : args[i + 1];
};
const CODE = flag("--class");
if (!CODE) throw new Error('Usage: npm run report:term -- --class <CLASS-CODE> [--from YYYY-MM-DD] [--to YYYY-MM-DD]');
const FROM = flag("--from") ? new Date(flag("--from")) : null;
const TO = flag("--to") ? new Date(flag("--to")) : null;
const range = { ...(FROM ? { gte: FROM } : {}), ...(TO ? { lte: TO } : {}) };
const hasRange = FROM !== null || TO !== null;

const klass = await prisma.class.findFirst({ where: { classCode: CODE }, include: { org: true, roster: { include: { learner: true } } } });
if (!klass) throw new Error(`No class with code ${CODE}`);

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const slugify = (s) => s.normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").toLowerCase() || "learner";
const DATE = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" });
const fmtHours = (sec) => (sec >= 3600 ? `${Math.round((sec / 3600) * 10) / 10} h` : `${Math.round(sec / 60)} min`);

const coverage = await strandCoverage(klass.id);
const outDir = path.resolve("reports", `term-${CODE.toLowerCase()}-${(TO ?? new Date()).toISOString().slice(0, 10)}`);
await mkdir(outDir, { recursive: true });

const index = [];
for (const entry of klass.roster) {
  const learner = entry.learner;
  const [progress, submissions, projects] = await Promise.all([
    prisma.moduleProgress.findMany({ where: { learnerId: learner.id }, select: { moduleId: true, status: true, completedAt: true, timeOnTaskSeconds: true } }),
    prisma.submission.findMany({
      where: { learnerId: learner.id, ...(hasRange ? { createdAt: range } : {}) },
      orderBy: { createdAt: "asc" },
      select: { content: true, createdAt: true },
    }),
    prisma.project.findMany({ where: { learnerId: learner.id, ...(hasRange ? { createdAt: range } : {}) }, select: { moduleId: true, createdAt: true } }),
  ]);
  if (projects.length === 0 && submissions.length === 0) continue; // nothing to report

  const badgeModules = new Map(
    (
      await prisma.module.findMany({
        where: { id: { in: projects.map((p) => p.moduleId) } },
        select: { id: true, title: true, topic: true, badgeName: true, badgeIcon: true },
      })
    ).map((m) => [m.id, m]),
  );
  const totalSeconds = progress.reduce((n, p) => n + p.timeOnTaskSeconds, 0);
  const words = submissions.map((s) => s.content.split(/\s+/).filter(Boolean).length);
  const cov = coverage.rows.find((r) => r.learnerId === learner.id);

  const sparkline = (values) => {
    if (values.length === 0) return "";
    const max = Math.max(1, ...values);
    const pts = values.map((v, i) => `${values.length === 1 ? 50 : (i / (values.length - 1)) * 100},${30 - (v / max) * 26}`).join(" ");
    return `<svg viewBox="0 0 100 32" preserveAspectRatio="none" style="width:220px;height:44px"><polyline points="${pts}" fill="none" stroke="#6ea8ff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  };

  const timeline = projects
    .slice()
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((p) => {
      const m = badgeModules.get(p.moduleId);
      return `<div class="badge-row"><span class="icon">${m?.badgeIcon ?? "🏅"}</span><div><b>${esc(m?.badgeName ?? "Badge")}</b> — ${esc(m?.title ?? "")}<div class="muted">${esc(m?.topic ?? "")} · ${DATE.format(p.createdAt)}</div></div></div>`;
    })
    .join("");

  const covCells = cov
    ? coverage.topics
        .map((t, i) => `<div class="cov ${cov.byTopic[i] > 0 ? "hit" : ""}"><div class="n">${cov.byTopic[i] || "·"}</div><div class="t">${esc(t)}</div></div>`)
        .join("")
    : "";

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(learner.displayName)} — ${esc(klass.name)} term report</title>
<style>
* { box-sizing: border-box; margin: 0; }
body { background:#0a0b0e; color:#e7e9ee; font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; line-height:1.55; padding:32px 16px 64px; }
.wrap { max-width:720px; margin:0 auto; }
.label { font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:#6b7280; font-family:ui-monospace,Menlo,monospace; }
.overline { color:#b6f24d; }
h1 { font-size:32px; margin:4px 0 2px; } h2 { font-size:18px; margin:32px 0 12px; }
.muted { color:#8a909b; font-size:13px; }
.card { background:#101216; border:1px solid rgba(255,255,255,.08); border-radius:14px; padding:18px 20px; margin-top:10px; }
.stats { display:flex; flex-wrap:wrap; gap:24px; }
.stats b { color:#b6f24d; font-size:22px; margin-right:6px; }
.badge-row { display:flex; gap:12px; align-items:center; padding:8px 0; border-bottom:1px solid rgba(255,255,255,.05); }
.badge-row:last-child { border-bottom:0; } .icon { font-size:26px; }
.covgrid { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:8px; }
.cov { border:1px solid rgba(255,255,255,.08); border-radius:10px; padding:10px; text-align:center; }
.cov.hit { border-color:rgba(182,242,77,.35); background:rgba(182,242,77,.07); }
.cov .n { font-size:20px; font-weight:700; color:#b6f24d; } .cov .t { font-size:11px; color:#8a909b; margin-top:2px; }
@media print { body { background:#fff; color:#1c1c1c; } .card { background:#fff; border-color:#ddd; } h1,h2{color:#111} .cov.hit{background:#f3f8e8} .stats b,.overline,.cov .n{color:#4a7c00} }
</style></head><body><div class="wrap">
<div class="label overline">${esc(klass.org.name)} · ${esc(klass.name)} · Term report${FROM || TO ? ` · ${FROM ? DATE.format(FROM) : "start"} – ${TO ? DATE.format(TO) : "now"}` : ""}</div>
<h1>${esc(learner.displayName)}</h1>
<p class="muted">Generated ${DATE.format(new Date())}</p>
<div class="card stats">
  <span><b>${projects.length}</b><span class="label">badge${projects.length === 1 ? "" : "s"}</span></span>
  <span><b>${submissions.length}</b><span class="label">wrap-ups</span></span>
  <span><b>${words.reduce((a, b) => a + b, 0)}</b><span class="label">words written</span></span>
  ${totalSeconds > 0 ? `<span><b>${fmtHours(totalSeconds)}</b><span class="label">on task</span></span>` : ""}
</div>
<h2>Strand coverage</h2>
<div class="covgrid">${covCells}</div>
<h2>Badges earned</h2>
<div class="card">${timeline || '<p class="muted">No badges in this period.</p>'}</div>
${words.length >= 2 ? `<h2>Writing growth</h2><div class="card">${sparkline(words)}<p class="muted">Words per written wrap-up, oldest → newest (${words[0]} → ${words[words.length - 1]}).</p></div>` : ""}
<p class="muted" style="margin-top:36px">Portfolios with photos and voice notes: open ${esc(learner.displayName)}'s profile in the instructor console.</p>
</div></body></html>`;

  const file = `${slugify(learner.displayName)}.html`;
  await writeFile(path.join(outDir, file), html);
  index.push({ name: learner.displayName, file, badges: projects.length, words: words.reduce((a, b) => a + b, 0) });
}

index.sort((a, b) => b.badges - a.badges || a.name.localeCompare(b.name));
await writeFile(
  path.join(outDir, "index.md"),
  [
    `# ${klass.name} — term report`,
    "",
    `${klass.org.name} · ${index.length} learner${index.length === 1 ? "" : "s"} with work${hasRange ? ` · ${FROM?.toISOString().slice(0, 10) ?? ""} → ${TO?.toISOString().slice(0, 10) ?? "now"}` : ""}`,
    "",
    ...index.map((i) => `- [${i.name}](./${i.file}) — ${i.badges} badge${i.badges === 1 ? "" : "s"}, ${i.words} words`),
    "",
  ].join("\n"),
);
console.log(`${index.length} learner reports → ${path.relative(process.cwd(), outDir)}/`);
await prisma.$disconnect();
