import Link from "next/link";
import { prisma } from "@/lib/db";
import { bandConfig } from "@/lib/bands";
import { requireLearner } from "@/lib/learner";
import Logo from "@/components/Logo";
import SpriteChat from "./SpriteChat";
import SpriteCustomizer from "./SpriteCustomizer";
import LogoutButton from "./LogoutButton";

export default async function Dashboard() {
  const { learner, klass, sprite } = await requireLearner();
  const band = bandConfig(klass.band);

  // Modules assigned to this class, in order, with this learner's progress and
  // criteria (for per-module completion bars). Project rows are the completion
  // signal — Project.moduleId is a plain string, so they're looked up separately.
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

  const completedModuleIds = new Set(projects.map((p) => p.moduleId));
  const metCriterionIds = new Set(statuses.filter((s) => s.status === "MET").map((s) => s.criterionId));

  const rows = classModules.map((cm) => {
    const m = cm.module;
    const done = completedModuleIds.has(m.id) || m.progress[0]?.status === "COMPLETED";
    const started = m.progress.length > 0;
    const required = m.criteria.filter((c) => c.required);
    const met = required.filter((c) => metCriterionIds.has(c.id)).length;
    const pct = done ? 100 : required.length === 0 ? 0 : Math.round((met / required.length) * 100);
    return { cm, m, done, started, pct };
  });

  const inProgress = rows.filter((r) => r.started && !r.done).length;
  const completed = rows.filter((r) => r.done).length;
  const earned = rows.filter((r) => completedModuleIds.has(r.m.id));
  const className = klass.name.replace(/\s*\(.*\)$/, "");

  return (
    <main className={`mx-auto w-full max-w-4xl flex-1 px-6 py-10 ${band.textScale}`}>
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[var(--border-soft)] pb-8">
        <div className="flex items-center gap-3.5">
          <Logo />
          <div className="flex items-baseline gap-3">
            <span className="display text-base font-semibold">{className}</span>
            <span className="mono-label">Ages {band.ageRange.replace("≈", "")}</span>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-xs font-semibold"
              style={{ background: "var(--tile)", color: "var(--accent)", fontFamily: "var(--font-grotesk)" }}
            >
              {learner.displayName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium" style={{ color: "var(--body)" }}>
              {learner.displayName}
            </span>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* Greeting + stats */}
      <section className="animate-fade-up mt-11 flex flex-wrap items-end justify-between gap-8">
        <div>
          <div className="overline mb-3">Dashboard</div>
          <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight">
            Welcome back, {learner.displayName}
          </h1>
          <p className="muted mt-3 max-w-md text-sm">
            {inProgress > 0
              ? `You're ${inProgress} module${inProgress === 1 ? "" : "s"} into this term. Keep the streak going.`
              : completed === rows.length && rows.length > 0
                ? "Everything's done — brilliant work this term."
                : "Pick a module below to get started."}
          </p>
        </div>
        <div className="flex gap-3">
          {[
            { value: inProgress, label: "In progress", color: "var(--info-text)" },
            { value: completed, label: "Completed", color: "var(--accent)" },
            { value: earned.length, label: "Badges", color: "var(--heading)" },
          ].map((s) => (
            <div key={s.label} className="card min-w-[118px] rounded-[14px] p-4">
              <div className="display text-[26px] font-semibold leading-none" style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="mono-label mt-2 text-[10.5px]">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Sprite */}
      <section className="animate-fade-up mt-10" style={{ animationDelay: "0.08s" }}>
        <SpriteCustomizer sprite={sprite} />
      </section>

      {/* Badges */}
      <section className="animate-fade-up mt-12" style={{ animationDelay: "0.12s" }}>
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold">Badges</h2>
          <span className="mono-label">
            {earned.length} / {rows.length} earned
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {rows.map(({ cm, m }) => {
            const has = completedModuleIds.has(m.id);
            return (
              <div
                key={cm.id}
                title={m.badgeDescription}
                className="flex items-center gap-2.5 rounded-xl border py-2.5 pl-3 pr-4"
                style={
                  has
                    ? { borderColor: "rgba(182,242,77,0.28)", background: "rgba(182,242,77,0.06)" }
                    : { borderColor: "var(--border-soft)", background: "#0f1115" }
                }
              >
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-base"
                  style={{
                    background: has ? "rgba(182,242,77,0.14)" : "var(--tile)",
                    filter: has ? "none" : "grayscale(1) opacity(0.45)",
                  }}
                >
                  {m.badgeIcon}
                </span>
                <span
                  className="text-sm font-semibold"
                  style={{ color: has ? "var(--heading)" : "#5a616c" }}
                >
                  {m.badgeName}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Modules */}
      <section className="animate-fade-up mt-12" style={{ animationDelay: "0.16s" }}>
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold">Modules</h2>
          <span className="mono-label">This term</span>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          {rows.map(({ cm, m, done, started, pct }) => (
            <Link key={cm.id} href={`/learn/${m.id}`} className="block">
              <div className="card card-interactive flex items-center gap-5 p-5">
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
                <span
                  className={`pill shrink-0 ${done ? "pill-done" : started ? "pill-progress" : "pill-idle"}`}
                >
                  {done ? "Done" : started ? "In progress" : "Not started"}
                </span>
              </div>
            </Link>
          ))}
          {rows.length === 0 && <p className="muted">No modules assigned yet — check back soon!</p>}
        </div>
      </section>

      <SpriteChat sprite={{ name: sprite.name, avatar: sprite.avatar, color: sprite.color }} />
    </main>
  );
}
