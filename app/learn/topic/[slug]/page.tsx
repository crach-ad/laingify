import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { bandConfig } from "@/lib/bands";
import { requireLearner } from "@/lib/learner";
import { slugifyTopic } from "@/lib/topics";

// One topic's project list: every module in this content area, in order, with
// the learner's progress. Projects open the normal tutorial player.
export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { learner, klass } = await requireLearner();
  const band = bandConfig(klass.band);

  const [classModules, projects, statuses] = await Promise.all([
    prisma.classModule.findMany({
      where: { classId: klass.id },
      orderBy: { order: "asc" },
      include: {
        module: {
          include: {
            progress: { where: { learnerId: learner.id } },
            criteria: true,
          },
        },
      },
    }),
    prisma.project.findMany({ where: { learnerId: learner.id } }),
    prisma.criterionStatus.findMany({ where: { learnerId: learner.id } }),
  ]);

  const inTopic = classModules.filter(
    (cm) => slugifyTopic(cm.module.topic || cm.module.title) === slug,
  );
  if (inTopic.length === 0) notFound();
  const topicName = inTopic[0].module.topic || inTopic[0].module.title;

  const completedModuleIds = new Set(projects.map((p) => p.moduleId));
  const metCriterionIds = new Set(statuses.filter((s) => s.status === "MET").map((s) => s.criterionId));

  const rows = inTopic.map((cm) => {
    const m = cm.module;
    const done = completedModuleIds.has(m.id) || m.progress[0]?.status === "COMPLETED";
    const started = m.progress.length > 0;
    const required = m.criteria.filter((c) => c.required);
    const met = required.filter((c) => metCriterionIds.has(c.id)).length;
    const pct = done ? 100 : required.length === 0 ? 0 : Math.round((met / required.length) * 100);
    return { cm, m, done, started, pct };
  });
  const doneCount = rows.filter((r) => r.done).length;

  return (
    <main className={`mx-auto w-full max-w-4xl flex-1 px-6 py-10 ${band.textScale}`}>
      <Link href="/learn" className="muted text-sm transition-colors hover:text-[var(--text)]">
        ← All topics
      </Link>

      <header className="animate-fade-up mt-6 flex items-center gap-5">
        <span className="tile flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl">
          {rows[0].m.badgeIcon}
        </span>
        <div>
          <div className="overline mb-1.5">Topic</div>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">{topicName}</h1>
          <p className="muted mt-1.5 text-sm">
            {doneCount} of {rows.length} project{rows.length === 1 ? "" : "s"} completed — each one
            earns its own badge.
          </p>
        </div>
      </header>

      <section className="animate-fade-up mt-8 flex flex-col gap-3" style={{ animationDelay: "0.08s" }}>
        {rows.map(({ cm, m, done, started, pct }, i) => (
          <Link key={cm.id} href={`/learn/${m.id}`} className="block">
            <div className="card card-interactive flex items-center gap-5 p-5">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                style={{
                  background: done ? "var(--accent)" : "var(--tile)",
                  color: done ? "var(--bg)" : "var(--faint)",
                  border: done ? "none" : "1px solid var(--border)",
                  fontFamily: "var(--font-grotesk)",
                }}
              >
                {done ? "✓" : i + 1}
              </span>
              <span className="tile flex h-11 w-11 shrink-0 items-center justify-center text-xl">
                {m.badgeIcon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="display block text-base font-semibold">{m.title}</span>
                <span className="muted mt-1 block max-w-xl text-[13px] leading-relaxed">
                  {m.summary}
                </span>
                <span className="mt-3 flex items-center gap-3">
                  <span className="bar max-w-[260px] flex-1">
                    <span
                      style={{
                        width: `${pct}%`,
                        background: done ? "var(--accent)" : started ? "var(--info)" : "#3a3f49",
                      }}
                    />
                  </span>
                  <span className="mono-label">{pct}%</span>
                </span>
              </span>
              <span className={`pill shrink-0 ${done ? "pill-done" : started ? "pill-progress" : "pill-idle"}`}>
                {done ? "Done" : started ? "In progress" : "Not started"}
              </span>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
