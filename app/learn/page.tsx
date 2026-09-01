import Link from "next/link";
import { prisma } from "@/lib/db";
import { bandConfig } from "@/lib/bands";
import { requireLearner } from "@/lib/learner";
import { slugifyTopic } from "@/lib/topics";
import Logo from "@/components/Logo";
import SpriteChat from "./SpriteChat";
import SpriteCustomizer from "./SpriteCustomizer";
import LogoutButton from "./LogoutButton";
import PhotoCapture from "./PhotoCapture";

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

  // Group project modules into topics, keeping the assigned order — the
  // dashboard shows topic cards; each topic page lists its projects.
  const topics: { name: string; rows: typeof rows }[] = [];
  for (const row of rows) {
    const name = row.m.topic || row.m.title;
    const existing = topics.find((t) => t.name === name);
    if (existing) existing.rows.push(row);
    else topics.push({ name, rows: [row] });
  }

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
            {learner.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={learner.photoUrl}
                alt=""
                className="h-8 w-8 rounded-full border border-[var(--border)] object-cover"
              />
            ) : (
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-xs font-semibold"
                style={{ background: "var(--tile)", color: "var(--accent)", fontFamily: "var(--font-grotesk)" }}
              >
                {learner.displayName.charAt(0).toUpperCase()}
              </div>
            )}
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
              ? `You're ${inProgress} project${inProgress === 1 ? "" : "s"} deep. Keep the streak going.`
              : completed === rows.length && rows.length > 0
                ? "Everything's done — brilliant work this term."
                : "Pick a topic below to get started."}
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

      {/* One-time portfolio photo prompt (opt-out remembered) */}
      {!learner.photoUrl && !learner.photoSkipped && (
        <PhotoCapture learnerName={learner.displayName} />
      )}

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
          {earned.length === 0 && (
            <p className="muted text-sm">Finish your first project to earn a badge — every project has one.</p>
          )}
          {earned.map(({ cm, m }) => {
            const has = completedModuleIds.has(m.id);
            const chip = (
              <div
                title={has ? `${m.badgeDescription} — view your portfolio` : m.badgeDescription}
                className={`flex items-center gap-2.5 rounded-xl border py-2.5 pl-3 pr-4 ${has ? "transition-colors hover:border-[var(--accent)]" : ""}`}
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
                {has && <span className="mono-label ml-1">📖</span>}
              </div>
            );
            // Earned badges open that module's portfolio.
            return has ? (
              <Link key={cm.id} href={`/learn/${m.id}/portfolio`}>
                {chip}
              </Link>
            ) : (
              <div key={cm.id}>{chip}</div>
            );
          })}
        </div>
      </section>

      {/* Topics — each opens a page listing that topic's project modules */}
      <section className="animate-fade-up mt-12" style={{ animationDelay: "0.16s" }}>
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold">Topics</h2>
          <span className="mono-label">This term</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {topics.map((t) => {
            const total = t.rows.length;
            const doneCount = t.rows.filter((r) => r.done).length;
            const startedAny = t.rows.some((r) => r.started);
            const pct = total === 0 ? 0 : Math.round((doneCount / total) * 100);
            const allDone = doneCount === total && total > 0;
            const icon = t.rows[0].m.badgeIcon;
            return (
              <Link key={t.name} href={`/learn/topic/${slugifyTopic(t.name)}`} className="block">
                <div className="card card-interactive flex h-full flex-col gap-4 p-5">
                  <div className="flex items-center gap-4">
                    <span className="tile flex h-11 w-11 shrink-0 items-center justify-center text-xl">
                      {icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="display block text-base font-semibold">{t.name}</span>
                      <span className="muted mt-0.5 block text-[13px]">
                        {total} project{total === 1 ? "" : "s"}
                      </span>
                    </span>
                    <span
                      className={`pill shrink-0 ${allDone ? "pill-done" : startedAny ? "pill-progress" : "pill-idle"}`}
                    >
                      {allDone ? "Done" : startedAny ? "In progress" : "Not started"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bar flex-1">
                      <span
                        style={{
                          width: `${pct}%`,
                          background: allDone ? "var(--accent)" : startedAny ? "var(--info)" : "#3a3f49",
                        }}
                      />
                    </span>
                    <span className="mono-label">
                      {doneCount}/{total}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
          {topics.length === 0 && <p className="muted">No topics assigned yet — check back soon!</p>}
        </div>
      </section>

      <SpriteChat
        sprite={{
          name: sprite.name,
          avatar: sprite.avatar,
          color: sprite.color,
          avatarStyle: sprite.avatarStyle,
          avatarSeed: sprite.avatarSeed,
          avatarTraits: sprite.avatarTraits,
          avatarColors: sprite.avatarColors,
        }}
      />
    </main>
  );
}
