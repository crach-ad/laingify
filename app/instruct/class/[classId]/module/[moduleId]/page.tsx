import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireInstructor } from "@/lib/instructor";
import { stepAnalytics } from "@/lib/insights";
import { slugifyTopic } from "@/lib/topics";
import ScratchBlocks from "@/components/ScratchBlocks";
import { ConsoleHeader } from "../../../../ConsoleParts";

// Instructor preview of one module as assigned to one class: every step card
// the learner will see (read-only, all tracks shown), the criteria that earn
// the badge, and which learners on this roster have done it.

type Block = {
  type: string;
  text?: string;
  url?: string;
  urls?: string[];
  kind?: string;
  minutes?: number;
  actions?: string[];
  tip?: string;
  warn?: string;
  track?: string;
  capture?: "photo" | "audio";
  criterionLabel?: string;
  sketch?: string;
  steps?: unknown[];
  builds?: unknown[];
};

const KIND_LABEL: Record<string, string> = { learn: "📖 Learn", build: "🔧 Build", create: "🎨 Create", reflect: "💭 Reflect" };

function StepCard({ b }: { b: Block }) {
  const chip = b.kind ? KIND_LABEL[b.kind] ?? b.kind : null;
  const track = b.track ? <span className="pill pill-idle ml-2 capitalize">{b.track} track</span> : null;
  if (b.type === "checkpoint") {
    return (
      <div className="card border-l-4 p-5" style={{ borderLeftColor: "var(--accent)" }}>
        <div className="mono-label">{b.capture === "audio" ? "🎙️ Voice-note checkpoint" : "📸 Photo checkpoint"} → {b.criterionLabel}</div>
        <p className="mt-2 whitespace-pre-wrap text-sm" style={{ color: "var(--body)" }}>{b.text}</p>
      </div>
    );
  }
  if (b.type === "prompt") {
    return (
      <div className="card border-l-4 p-5" style={{ borderLeftColor: "var(--info)" }}>
        <div className="mono-label">✍️ Written wrap-up</div>
        <p className="mt-2 whitespace-pre-wrap text-sm" style={{ color: "var(--body)" }}>{b.text}</p>
      </div>
    );
  }
  if (b.type === "trackpick") {
    return (
      <div className="card p-5">
        <div className="mono-label">🎚️ Track picker (beginner / intermediate / advanced)</div>
        {b.text && <p className="mt-2 text-sm" style={{ color: "var(--body)" }}>{b.text}</p>}
      </div>
    );
  }
  if (b.type === "code") {
    return (
      <div className="card p-5">
        <div className="mono-label">💻 Code{track}</div>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-[var(--tile)] p-4 font-mono text-[13px] leading-relaxed">{b.text}</pre>
        {b.tip && <p className="muted mt-3 text-[13px]">💡 {b.tip}</p>}
      </div>
    );
  }
  if (b.type === "scratch" && b.text) {
    return (
      <div className="card p-5">
        <div className="mono-label">🧩 Scratch blocks{track}</div>
        <div className="mt-3 overflow-x-auto rounded-lg bg-white p-3">
          <ScratchBlocks code={b.text} />
        </div>
        {b.tip && <p className="muted mt-3 text-[13px]">💡 {b.tip}</p>}
      </div>
    );
  }
  if (b.type === "embed" || b.type === "video") {
    return (
      <div className="card p-5">
        <div className="mono-label">{b.type === "video" ? "🎬 Video" : "🔗 Embedded tool"}</div>
        {b.url && (
          <a href={b.url} target="_blank" rel="noreferrer" className="mt-2 block break-all text-sm underline" style={{ color: "var(--accent)" }}>
            {b.url}
          </a>
        )}
      </div>
    );
  }
  if (b.type === "image" && b.url) {
    return (
      <div className="card p-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={b.url} alt="" className="w-full rounded-lg" />
        {b.text && <p className="muted mt-3 text-[13px]">{b.text}</p>}
      </div>
    );
  }
  if (b.type === "slides") {
    return (
      <div className="card p-5">
        <div className="mono-label">🖼️ Slides · {b.urls?.length ?? 0}</div>
      </div>
    );
  }
  if (b.type === "circuit" || b.type === "knex") {
    const n = b.type === "circuit" ? b.steps?.length : b.builds?.length;
    return (
      <div className="card p-5">
        <div className="mono-label">{b.type === "circuit" ? "⚡ Interactive circuit build" : "🧱 Interactive K'NEX 3D build"}{n ? ` · ${n} guided steps` : ""}</div>
        {b.text && <p className="mt-2 whitespace-pre-wrap text-sm" style={{ color: "var(--body)" }}>{b.text}</p>}
        {b.sketch && <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-[var(--tile)] p-4 font-mono text-[12px] leading-relaxed">{b.sketch}</pre>}
      </div>
    );
  }
  // text (default)
  return (
    <div className="card p-5">
      {(chip || b.minutes || track) && (
        <div className="mono-label flex items-center">
          {chip}
          {b.minutes ? <span className="ml-2">· ~{b.minutes} min</span> : null}
          {track}
        </div>
      )}
      {b.url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={b.url} alt="" className="mt-3 w-full rounded-lg bg-white" />
      )}
      {b.text && <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed" style={{ color: "var(--body)" }}>{b.text}</p>}
      {b.actions && b.actions.length > 0 && (
        <ol className="mt-3 flex flex-col gap-1.5 pl-5 text-sm" style={{ color: "var(--body)", listStyle: "decimal" }}>
          {b.actions.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ol>
      )}
      {b.tip && <p className="muted mt-3 text-[13px]">💡 {b.tip}</p>}
      {b.warn && <p className="mt-3 text-[13px]" style={{ color: "var(--danger)" }}>⚠️ {b.warn}</p>}
    </div>
  );
}

export default async function ModulePreviewPage({ params }: { params: Promise<{ classId: string; moduleId: string }> }) {
  const { classId, moduleId } = await params;
  const { instructor, orgs, orgIds } = await requireInstructor();

  const [klass, mod] = await Promise.all([
    prisma.class.findUnique({ where: { id: classId }, include: { roster: { include: { learner: true } }, modules: { where: { moduleId } } } }),
    prisma.module.findUnique({ where: { id: moduleId }, include: { criteria: { orderBy: { order: "asc" } } } }),
  ]);
  if (!klass || !orgIds.includes(klass.orgId) || !mod || !orgIds.includes(mod.orgId) || klass.modules.length === 0) notFound();

  const learnerIds = klass.roster.map((r) => r.learnerId);
  const [progress, projects, analytics] = await Promise.all([
    prisma.moduleProgress.findMany({ where: { moduleId, learnerId: { in: learnerIds } } }),
    prisma.project.findMany({ where: { moduleId, learnerId: { in: learnerIds } } }),
    stepAnalytics(classId, moduleId),
  ]);
  const doneIds = new Set([...projects.map((p) => p.learnerId), ...progress.filter((p) => p.status === "COMPLETED").map((p) => p.learnerId)]);
  const activeIds = new Set(progress.map((p) => p.learnerId).filter((id) => !doneIds.has(id)));
  const done = klass.roster.filter((r) => doneIds.has(r.learnerId));
  const active = klass.roster.filter((r) => activeIds.has(r.learnerId));

  const blocks = JSON.parse(mod.contentJson) as Block[];
  // Group into steps: each heading opens a new step that collects the blocks after it.
  const steps: { heading: string | null; blocks: Block[] }[] = [];
  for (const b of blocks) {
    if (b.type === "heading") steps.push({ heading: b.text ?? "", blocks: [] });
    else {
      if (steps.length === 0) steps.push({ heading: null, blocks: [] });
      steps[steps.length - 1].blocks.push(b);
    }
  }
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <ConsoleHeader orgLabel={orgs.map((o) => o.name).join(" · ")} instructorName={instructor.displayName} />

      <Link
        href={`/instruct/class/${klass.id}${mod.topic ? `?topic=${slugifyTopic(mod.topic)}` : ""}`}
        className="muted mt-8 inline-block text-sm transition-colors hover:text-[var(--text)]"
      >
        ← {klass.name} · {mod.topic || "projects"}
      </Link>

      <section className="animate-fade-up mt-6 flex items-start gap-5">
        <span className="tile flex h-16 w-16 shrink-0 items-center justify-center text-4xl">{mod.badgeIcon}</span>
        <div className="min-w-0 flex-1">
          <div className="overline mb-2">{mod.topic || "Project"}</div>
          <h1 className="text-3xl font-semibold tracking-tight">{mod.title}</h1>
          <p className="muted mt-2 text-sm">{mod.summary}</p>
          <p className="mono-label mt-3">
            {mod.badgeIcon} {mod.badgeName} badge · {steps.length} step{steps.length === 1 ? "" : "s"} · {mod.criteria.filter((c) => c.required).length} required criteria
          </p>
        </div>
      </section>

      {/* Criteria + who's done it */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <div className="overline mb-3">Earns the badge when</div>
          <ul className="flex flex-col gap-2 text-sm" style={{ color: "var(--body)" }}>
            {mod.criteria.map((c) => (
              <li key={c.id} className="flex items-start gap-2">
                <span>{c.requiresEvidenceType === "PHOTO" ? "📸" : c.requiresEvidenceType === "AUDIO" ? "🎙️" : c.checkType === "RUBRIC" ? "🧑‍🏫" : "✍️"}</span>
                <span>
                  {c.label}
                  {!c.required && <span className="mono-label ml-2">optional</span>}
                  {c.description && <span className="muted block text-[12px]">{c.description}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-5">
          <div className="overline mb-3">This class</div>
          <p className="text-sm" style={{ color: "var(--body)" }}>
            <span className="display text-2xl font-semibold" style={{ color: "var(--accent)" }}>{done.length}</span>
            <span className="mono-label ml-2">done</span>
            <span className="display ml-5 text-2xl font-semibold" style={{ color: "var(--info)" }}>{active.length}</span>
            <span className="mono-label ml-2">active</span>
            <span className="display ml-5 text-2xl font-semibold">{klass.roster.length - done.length - active.length}</span>
            <span className="mono-label ml-2">not started</span>
          </p>
          {(done.length > 0 || active.length > 0) && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {done.map((r) => (
                <Link key={r.id} href={`/instruct/learner/${r.learnerId}/portfolio/${mod.id}`} className="pill pill-done" title="Open portfolio">
                  {r.learner.displayName}
                </Link>
              ))}
              {active.map((r) => (
                <Link key={r.id} href={`/instruct/learner/${r.learnerId}`} className="pill pill-progress">
                  {r.learner.displayName}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Step analytics (event-based; hidden until data exists) */}
      {(analytics.steps.length > 0 || analytics.current.length > 0) && (
        <section className="mt-8">
          <div className="card p-5">
            <div className="overline mb-3">Step analytics · live timing from this class</div>
            {analytics.steps.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="mono-label text-left">
                    <th className="pb-2 font-normal">Step</th>
                    <th className="pb-2 font-normal">Views</th>
                    <th className="pb-2 font-normal">Median</th>
                    <th className="pb-2 font-normal">p90</th>
                    <th className="pb-2 font-normal">Retries</th>
                    <th className="pb-2 font-normal">Time</th>
                  </tr>
                </thead>
                <tbody style={{ color: "var(--body)" }}>
                  {(() => {
                    const maxMed = Math.max(...analytics.steps.map((x) => x.medianMin), 0.1);
                    return analytics.steps.map((x) => (
                      <tr key={x.step}>
                        <td className="py-1 pr-3">Step {x.step + 1}</td>
                        <td className="py-1 pr-3">{x.views}</td>
                        <td className="py-1 pr-3 font-semibold">{x.medianMin}m</td>
                        <td className="muted py-1 pr-3">{x.p90Min}m</td>
                        <td className="py-1 pr-3">{x.retries > 0 ? `↻ ${x.retries}` : "—"}</td>
                        <td className="w-1/3 py-1">
                          <span className="bar block">
                            <span style={{ width: `${(x.medianMin / maxMed) * 100}%`, background: x.medianMin === maxMed ? "var(--danger)" : "var(--info)" }} />
                          </span>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            )}
            {analytics.current.length > 0 && (
              <div className="mt-4 flex flex-col gap-2">
                <div className="mono-label">Currently on each step (not yet finished)</div>
                {analytics.current.map((c) => (
                  <div key={c.step} className="flex items-start gap-3 text-sm">
                    <span className="mono-label w-16 shrink-0 pt-0.5">Step {c.step + 1}</span>
                    <span className="flex flex-wrap gap-1.5">
                      {c.learners.map((l) => (
                        <Link key={l.learnerId} href={`/instruct/learner/${l.learnerId}`} className="pill pill-progress">
                          {l.displayName}
                        </Link>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <p className="muted mt-3 text-[12px]">
              Median visible-screen minutes per step; the red bar is the stall step. Step numbers follow each learner&apos;s chosen track.
            </p>
          </div>
        </section>
      )}

      {/* Steps */}
      <section className="mt-10">
        <div className="overline mb-3">Learner view · all steps</div>
        <h2 className="text-xl font-semibold tracking-tight">What the learner sees</h2>
        <div className="mt-5 flex flex-col gap-6">
          {steps.map((s, i) => (
            <div key={i}>
              <div className="mb-2 flex items-baseline gap-3">
                <span className="mono-label">Step {i + 1}</span>
                {s.heading && <h3 className="display text-base font-semibold">{s.heading}</h3>}
              </div>
              <div className="flex flex-col gap-3">
                {s.blocks.map((b, j) => (
                  <StepCard key={j} b={b} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
