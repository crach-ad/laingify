// Export completed student work from the database into ./student-work/.
//
//   node --env-file=.env scripts/export-student-work.mjs [--class "STEM & AI Camp"] [--include-in-progress]
//
// For every learner × module in the class whose ModuleProgress is COMPLETED
// (or has any work, with --include-in-progress) this writes:
//
//   student-work/<module>/<learner>/
//     portfolio.html   self-contained portfolio (same renderer as the app's download)
//     submission.md    wrap-up writing, auto-feedback, project summary, criteria
//     photo-N.jpg|png  evidence photos decoded from the DB
//     voice-N.webm|m4a voice notes decoded from the DB
//     work.json        raw metadata (ids, timestamps, captions, transcripts)
//
// plus student-work/README.md as an index. Read-only against the DB.

import { PrismaClient } from "@prisma/client";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { renderPortfolioHtml } from "../lib/portfolio-html.ts";

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? null : args[i + 1];
};
const CLASS_NAME = flag("--class") ?? "STEM & AI Camp";
const INCLUDE_WIP = args.includes("--include-in-progress");
const OUT = path.resolve("student-work");

const prisma = new PrismaClient();
const slug = (s) =>
  s.normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").toLowerCase() || "untitled";
const DATE = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" });
const STAMP = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

function dataUrlToFile(url) {
  const m = /^data:([^;,]+)(;[^,]*)?,(.*)$/s.exec(url ?? "");
  if (!m) return null;
  const mime = m[1];
  const isB64 = (m[2] ?? "").includes("base64");
  const buf = isB64 ? Buffer.from(m[3], "base64") : Buffer.from(decodeURIComponent(m[3]), "utf8");
  const ext =
    { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif",
      "audio/webm": "webm", "audio/mp4": "m4a", "audio/mpeg": "mp3", "audio/ogg": "ogg", "audio/wav": "wav",
      "model/stl": "stl", "application/sla": "stl", "application/octet-stream": "bin" }[mime] ?? mime.split("/")[1]?.replace(/\W.*/, "") ?? "bin";
  return { buf, ext, mime };
}

const cls = await prisma.class.findFirst({ where: { name: CLASS_NAME }, include: { org: true } });
if (!cls) throw new Error(`No class named "${CLASS_NAME}"`);

const roster = await prisma.rosterEntry.findMany({ where: { classId: cls.id }, include: { learner: true } });
const learnerIds = roster.map((r) => r.learnerId);
const learners = new Map(roster.map((r) => [r.learnerId, r.learner]));

const progress = await prisma.moduleProgress.findMany({
  where: { learnerId: { in: learnerIds }, ...(INCLUDE_WIP ? {} : { status: "COMPLETED" }) },
  orderBy: [{ completedAt: "asc" }, { startedAt: "asc" }],
});
const moduleIds = [...new Set(progress.map((p) => p.moduleId))];
const modules = new Map(
  (await prisma.module.findMany({ where: { id: { in: moduleIds } }, include: { criteria: { orderBy: { order: "asc" } } } })).map((m) => [m.id, m]),
);

// Pre-compute unique learner slugs (two "Noah"s would otherwise collide).
const learnerSlug = new Map();
{
  const seen = new Map();
  for (const l of [...learners.values()].sort((a, b) => a.createdAt - b.createdAt)) {
    const base = slug(l.displayName);
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    learnerSlug.set(l.id, n === 1 ? base : `${base}-${l.id.slice(-4)}`);
  }
}

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const exported = []; // index rows
let skipped = 0;

for (const pr of progress) {
  const learner = learners.get(pr.learnerId);
  const mod = modules.get(pr.moduleId);
  if (!learner || !mod) continue;

  const [evidence, submissions, project, statuses] = await Promise.all([
    prisma.evidence.findMany({ where: { learnerId: learner.id, moduleId: mod.id }, orderBy: { createdAt: "asc" } }),
    prisma.submission.findMany({ where: { learnerId: learner.id, moduleId: mod.id }, orderBy: { createdAt: "asc" }, include: { feedback: true } }),
    prisma.project.findUnique({ where: { learnerId_moduleId: { learnerId: learner.id, moduleId: mod.id } } }),
    prisma.criterionStatus.findMany({ where: { learnerId: learner.id, criterionId: { in: mod.criteria.map((c) => c.id) } } }),
  ]);
  if (evidence.length === 0 && submissions.length === 0) { skipped++; continue; }

  const statusByCrit = new Map(statuses.map((s) => [s.criterionId, s]));
  const critLabel = new Map(mod.criteria.map((c) => [c.id, c.label]));
  const labels = (ids) => ids.map((id) => critLabel.get(id) ?? id);
  const crit = mod.criteria.map((c) => ({ label: c.label, required: c.required, status: statusByCrit.get(c.id)?.status ?? "NOT_STARTED" }));
  const required = crit.filter((c) => c.required);
  const met = required.filter((c) => c.status === "MET").length;
  const complete = pr.status === "COMPLETED";

  const dir = path.join(OUT, slug(mod.title), learnerSlug.get(learner.id));
  await mkdir(dir, { recursive: true });

  // --- media files -----------------------------------------------------------
  const counters = {};
  const files = [];
  for (const e of evidence) {
    if (!e.url) continue;
    const f = dataUrlToFile(e.url);
    if (!f) continue;
    const kind = e.type === "PHOTO" ? "photo" : e.type === "AUDIO" ? "voice" : "file";
    counters[kind] = (counters[kind] ?? 0) + 1;
    const name = `${kind}-${counters[kind]}.${f.ext}`;
    await writeFile(path.join(dir, name), f.buf);
    files.push({ evidenceId: e.id, file: name, mime: f.mime, bytes: f.buf.length });
  }

  // --- portfolio.html (same data shape the app builds) -----------------------
  const evItems = evidence.map((e) => ({ id: e.id, kind: "evidence", type: e.type, text: e.text, url: e.url, caption: e.caption, createdAt: e.createdAt }));
  const sections = [];
  for (const c of mod.criteria) {
    const items = evItems.filter((i) => evidence.find((e) => e.id === i.id)?.criterionId === c.id);
    if (items.length) sections.push({ title: c.label, items });
  }
  const untagged = evItems.filter((i) => !evidence.find((e) => e.id === i.id)?.criterionId);
  if (untagged.length) sections.push({ title: "More of my work", items: untagged });
  if (submissions.length)
    sections.push({ title: "My wrap-up", items: submissions.map((s) => ({ id: s.id, kind: "submission", text: s.content, feedbackSummary: s.feedback?.summary ?? null, createdAt: s.createdAt })) });
  const dates = [...evidence.map((e) => e.createdAt), ...submissions.map((s) => s.createdAt)];
  const finishedAt = pr.completedAt ?? (dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))) : null);
  const wordCount = submissions.reduce((n, s) => n + s.content.split(/\s+/).filter(Boolean).length, 0);
  const data = {
    learner: { displayName: learner.displayName, photoUrl: learner.photoUrl },
    module: { title: mod.title, summary: mod.summary, badgeName: mod.badgeName, badgeIcon: mod.badgeIcon },
    orgName: cls.org.name,
    complete,
    progress: { met, required: required.length },
    projectSummary: project?.summary ?? null,
    sections,
    stats: { photoCount: evidence.filter((e) => e.type === "PHOTO").length, audioCount: evidence.filter((e) => e.type === "AUDIO").length, wordCount },
    finishedAt,
  };
  await writeFile(path.join(dir, "portfolio.html"), renderPortfolioHtml(data));

  // --- submission.md ---------------------------------------------------------
  const md = [];
  md.push(`# ${learner.displayName} — ${mod.title}`);
  md.push("");
  md.push(`- **Class:** ${cls.name} (${cls.org.name})`);
  md.push(`- **Topic:** ${mod.topic || "—"}`);
  md.push(`- **Status:** ${complete ? `✅ Completed — ${mod.badgeIcon} ${mod.badgeName} badge` : `🛠️ In progress (${met}/${required.length} required steps)`}`);
  if (finishedAt) md.push(`- **${complete ? "Completed" : "Last worked on"}:** ${DATE.format(finishedAt)}`);
  md.push("");
  if (project?.summary) { md.push("## Project summary"); md.push(""); md.push(project.summary); md.push(""); }
  if (submissions.length) {
    md.push("## Wrap-up writing");
    md.push("");
    for (const s of submissions) {
      md.push(`_${STAMP.format(s.createdAt)}_`);
      md.push("");
      md.push(s.content.split("\n").map((l) => `> ${l}`).join("\n"));
      md.push("");
      if (s.feedback) {
        md.push(`**Auto-feedback:** ${s.feedback.summary}`);
        const metJ = labels(JSON.parse(s.feedback.metJson || "[]")), missJ = labels(JSON.parse(s.feedback.missingJson || "[]"));
        if (metJ.length) md.push(`- Met: ${metJ.join("; ")}`);
        if (missJ.length) md.push(`- Missing: ${missJ.join("; ")}`);
        if (s.feedback.nextSteps) md.push(`- Next steps: ${s.feedback.nextSteps}`);
        md.push("");
      }
    }
  }
  if (evidence.length) {
    md.push("## Evidence");
    md.push("");
    for (const e of evidence) {
      const f = files.find((x) => x.evidenceId === e.id);
      const label = e.type === "PHOTO" ? "📸 Photo" : e.type === "AUDIO" ? "🎙️ Voice note" : e.type === "FILE" ? "📎 File" : "📝 Note";
      md.push(`### ${label} — ${STAMP.format(e.createdAt)}`);
      md.push("");
      if (f && e.type === "PHOTO") md.push(`![${learner.displayName} — ${mod.title}](./${f.file})`);
      else if (f) md.push(`[${f.file}](./${f.file})`);
      // The app stores the (truncated) step prompt as the caption.
      if (e.caption) { md.push(""); md.push(`_Prompt:_ ${e.caption}${e.caption.length >= 120 ? "…" : ""}`); }
      if (e.text) { md.push(""); md.push(e.type === "AUDIO" ? `**Transcript:** ${e.text}` : e.text); }
      md.push("");
    }
  }
  md.push("## Steps");
  md.push("");
  for (const c of crit) md.push(`- ${c.status === "MET" ? "[x]" : "[ ]"} ${c.label}${c.required ? "" : " _(optional)_"}`);
  md.push("");
  await writeFile(path.join(dir, "submission.md"), md.join("\n"));

  // --- work.json -------------------------------------------------------------
  await writeFile(
    path.join(dir, "work.json"),
    JSON.stringify(
      {
        learner: { id: learner.id, displayName: learner.displayName, band: learner.band },
        module: { id: mod.id, title: mod.title, topic: mod.topic, badgeName: mod.badgeName },
        class: { id: cls.id, name: cls.name },
        status: pr.status, startedAt: pr.startedAt, completedAt: pr.completedAt, timeOnTaskSeconds: pr.timeOnTaskSeconds,
        criteria: crit,
        project: project ? { summary: project.summary, createdAt: project.createdAt } : null,
        submissions: submissions.map((s) => ({ id: s.id, content: s.content, createdAt: s.createdAt, feedback: s.feedback ? { summary: s.feedback.summary, met: labels(JSON.parse(s.feedback.metJson || "[]")), missing: labels(JSON.parse(s.feedback.missingJson || "[]")), nextSteps: s.feedback.nextSteps } : null })),
        evidence: evidence.map((e) => ({ id: e.id, type: e.type, caption: e.caption, text: e.text, createdAt: e.createdAt, file: files.find((x) => x.evidenceId === e.id)?.file ?? null })),
      },
      null,
      2,
    ),
  );

  exported.push({ learner: learner.displayName, lslug: learnerSlug.get(learner.id), module: mod.title, mslug: slug(mod.title), topic: mod.topic, complete, met, required: required.length, finishedAt, photos: data.stats.photoCount, voice: data.stats.audioCount, words: wordCount, dir: path.relative(OUT, dir) });
}

// --- README.md index -----------------------------------------------------------
const byModule = new Map();
for (const r of exported) (byModule.get(r.module) ?? byModule.set(r.module, []).get(r.module)).push(r);
const byLearner = new Map();
for (const r of exported) (byLearner.get(r.learner) ?? byLearner.set(r.learner, []).get(r.learner)).push(r);
const done = exported.filter((r) => r.complete);

const rd = [];
rd.push(`# Student work — ${cls.name}`);
rd.push("");
rd.push(`Exported from the ${cls.org.name} database on ${DATE.format(new Date())} by \`scripts/export-student-work.mjs\`.`);
rd.push("");
rd.push(`- **${done.length}** completed module${done.length === 1 ? "" : "s"} (badges earned) across **${new Set(done.map((r) => r.learner)).size}** learners${INCLUDE_WIP ? `, plus ${exported.length - done.length} in-progress` : ""}`);
rd.push(`- Each folder has a self-contained \`portfolio.html\` (open in any browser, print to PDF), a \`submission.md\` write-up, and the original photos / voice notes.`);
rd.push("");
rd.push("## By module");
rd.push("");
for (const [m, rows] of [...byModule].sort((a, b) => b[1].length - a[1].length)) {
  rd.push(`### ${m}${rows[0].topic ? ` · _${rows[0].topic}_` : ""}`);
  rd.push("");
  rd.push("| Learner | Status | Finished | Photos | Voice | Words | Portfolio |");
  rd.push("|---|---|---|---|---|---|---|");
  for (const r of rows.sort((a, b) => Number(b.complete) - Number(a.complete) || (a.finishedAt ?? 0) - (b.finishedAt ?? 0)))
    rd.push(`| ${r.learner} | ${r.complete ? "✅ Completed" : `🛠️ ${r.met}/${r.required}`} | ${r.finishedAt ? DATE.format(r.finishedAt) : "—"} | ${r.photos} | ${r.voice} | ${r.words} | [portfolio.html](./${r.dir}/portfolio.html) · [write-up](./${r.dir}/submission.md) |`);
  rd.push("");
}
rd.push("## By learner");
rd.push("");
for (const [l, rows] of [...byLearner].sort((a, b) => b[1].filter((r) => r.complete).length - a[1].filter((r) => r.complete).length || a[0].localeCompare(b[0]))) {
  rd.push(`- **${l}** — ${rows.map((r) => `[${r.module}](./${r.dir}/portfolio.html)${r.complete ? " ✅" : ` 🛠️ ${r.met}/${r.required}`}`).join(", ")}`);
}
rd.push("");
rd.push("## Re-export");
rd.push("");
rd.push("```sh");
rd.push("npm run export:work                          # completed only");
rd.push("npm run export:work -- --include-in-progress  # also partial work");
rd.push("```");
rd.push("");
await writeFile(path.join(OUT, "README.md"), rd.join("\n"));

console.log(`Exported ${exported.length} learner×module folders (${done.length} completed) to ${OUT}${skipped ? `; skipped ${skipped} with no work` : ""}`);
await prisma.$disconnect();
