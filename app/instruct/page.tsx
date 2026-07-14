import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireInstructor } from "@/lib/instructor";
import Logo from "@/components/Logo";
import LogoutButton from "./LogoutButton";

// Instructor console home: the review queue (criteria awaiting a human
// decision) plus a roster progress overview, scoped to the instructor's org.
export default async function InstructorDashboard() {
  const { instructor, org } = await requireInstructor();

  const classes = await prisma.class.findMany({
    where: { orgId: org.id },
    orderBy: { createdAt: "asc" },
    include: {
      roster: { include: { learner: true } },
      modules: {
        orderBy: { order: "asc" },
        include: { module: { include: { criteria: true } } },
      },
    },
  });

  const learnerIds = [...new Set(classes.flatMap((c) => c.roster.map((r) => r.learnerId)))];
  const [progress, statuses, projects] = await Promise.all([
    prisma.moduleProgress.findMany({ where: { learnerId: { in: learnerIds } } }),
    prisma.criterionStatus.findMany({ where: { learnerId: { in: learnerIds } } }),
    prisma.project.findMany({ where: { learnerId: { in: learnerIds } } }),
  ]);
  const started = new Set(progress.map((p) => `${p.learnerId}:${p.moduleId}`));
  const completedModules = new Set(
    projects
      .map((p) => `${p.learnerId}:${p.moduleId}`)
      .concat(progress.filter((p) => p.status === "COMPLETED").map((p) => `${p.learnerId}:${p.moduleId}`)),
  );
  const statusMap = new Map(statuses.map((s) => [`${s.learnerId}:${s.criterionId}`, s]));

  // Review queue: RUBRIC criteria become reviewable once the learner starts the
  // module; HYBRID ones once the auto pre-screen passes (IN_PROGRESS).
  type QueueItem = {
    learnerId: string;
    learnerName: string;
    moduleId: string;
    moduleTitle: string;
    badgeIcon: string;
    className: string;
    pending: string[];
  };
  const queue: QueueItem[] = [];
  for (const klass of classes) {
    for (const entry of klass.roster) {
      for (const cm of klass.modules) {
        const m = cm.module;
        if (!started.has(`${entry.learnerId}:${m.id}`)) continue;
        const pending = m.criteria
          .filter((c) => {
            const s = statusMap.get(`${entry.learnerId}:${c.id}`)?.status ?? "NOT_STARTED";
            if (c.checkType === "RUBRIC") return s !== "MET";
            if (c.checkType === "HYBRID") return s === "IN_PROGRESS";
            return false;
          })
          .map((c) => c.label);
        if (pending.length > 0) {
          queue.push({
            learnerId: entry.learnerId,
            learnerName: entry.learner.displayName,
            moduleId: m.id,
            moduleTitle: m.title,
            badgeIcon: m.badgeIcon,
            className: klass.name,
            pending,
          });
        }
      }
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[var(--border-soft)] pb-8">
        <div className="flex items-center gap-3.5">
          <Logo />
          <div className="flex items-baseline gap-3">
            <span className="display text-base font-semibold">Instructor Console</span>
            <span className="mono-label">{org.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <span className="text-sm font-medium" style={{ color: "var(--body)" }}>
            {instructor.displayName}
          </span>
          <LogoutButton />
        </div>
      </header>

      {/* Review queue */}
      <section className="animate-fade-up mt-11">
        <div className="overline mb-3">Review queue</div>
        <div className="flex items-baseline justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">Awaiting your review</h1>
          <span className="mono-label">
            {queue.length} item{queue.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="mt-5 flex flex-col gap-3">
          {queue.map((q) => (
            <Link key={`${q.learnerId}:${q.moduleId}`} href={`/instruct/review/${q.learnerId}/${q.moduleId}`} className="block">
              <div className="card card-interactive flex items-center gap-5 p-5">
                <span className="tile flex h-11 w-11 shrink-0 items-center justify-center text-xl">
                  {q.badgeIcon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="display block text-base font-semibold">
                    {q.learnerName} · {q.moduleTitle}
                  </span>
                  <span className="muted mt-1 block text-[13px]">
                    {q.className} — needs: {q.pending.join(", ")}
                  </span>
                </span>
                <span className="pill pill-warn shrink-0">
                  {q.pending.length} to review
                </span>
              </div>
            </Link>
          ))}
          {queue.length === 0 && (
            <div className="card p-6">
              <p className="muted text-sm">Nothing to review right now — you&apos;re all caught up.</p>
            </div>
          )}
        </div>
      </section>

      {/* Roster progress */}
      <section className="animate-fade-up mt-12" style={{ animationDelay: "0.08s" }}>
        <div className="overline mb-3">Roster</div>
        <h2 className="text-xl font-semibold tracking-tight">Progress overview</h2>
        <div className="mt-5 flex flex-col gap-6">
          {classes.map((klass) => (
            <div key={klass.id} className="card p-5">
              <div className="flex items-baseline justify-between">
                <span className="display text-base font-semibold">{klass.name}</span>
                <span className="mono-label">Code {klass.classCode}</span>
              </div>
              <div className="mt-4 flex flex-col gap-2.5">
                {klass.roster.map((entry) => {
                  const total = klass.modules.length;
                  const done = klass.modules.filter((cm) =>
                    completedModules.has(`${entry.learnerId}:${cm.moduleId}`),
                  ).length;
                  const inProgress = klass.modules.filter(
                    (cm) =>
                      started.has(`${entry.learnerId}:${cm.moduleId}`) &&
                      !completedModules.has(`${entry.learnerId}:${cm.moduleId}`),
                  ).length;
                  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
                  return (
                    <Link
                      key={entry.id}
                      href={`/instruct/learner/${entry.learnerId}`}
                      className="-mx-2 flex items-center gap-4 rounded-xl px-2 py-1 transition-colors hover:bg-[var(--card-hover)]"
                    >
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-xs font-semibold"
                        style={{ background: "var(--tile)", color: "var(--accent)", fontFamily: "var(--font-grotesk)" }}
                      >
                        {entry.learner.displayName.charAt(0).toUpperCase()}
                      </span>
                      <span className="w-36 truncate text-sm font-medium" style={{ color: "var(--body)" }}>
                        {entry.learner.displayName}
                      </span>
                      <span className="bar max-w-[220px] flex-1">
                        <span
                          style={{
                            width: `${pct}%`,
                            background: pct === 100 ? "var(--accent)" : inProgress > 0 ? "var(--info)" : "#3a3f49",
                          }}
                        />
                      </span>
                      <span className="mono-label w-28 text-right">
                        {done}/{total} done{inProgress > 0 ? ` · ${inProgress} active` : ""}
                      </span>
                    </Link>
                  );
                })}
                {klass.roster.length === 0 && <p className="muted text-sm">No learners on this roster.</p>}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
