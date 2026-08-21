import Link from "next/link";
import { notFound } from "next/navigation";
import { requireInstructor } from "@/lib/instructor";
import { loadClassOverviews } from "@/lib/instructor-data";
import { bandConfig } from "@/lib/bands";
import { ConsoleHeader, ReviewQueue, RosterList } from "../../ConsoleParts";
import Insights from "./Insights";

// One class, two views switched by ?view=:
//   projects (default) — the learning modules assigned to this class, grouped
//                        by topic, with class-wide progress per module
//   roster             — every learner's progress, plus the review queue
//   insights           — weekly engagement, funnel, writing growth, coverage
export default async function ClassPage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ view?: string; lesson?: string }>;
}) {
  const { classId } = await params;
  const { view, lesson } = await searchParams;
  const showRoster = view === "roster";
  const showInsights = view === "insights";
  const { instructor, orgs, orgIds } = await requireInstructor();
  const [klass] = await loadClassOverviews(orgIds, classId);
  if (!klass) notFound();
  const band = bandConfig(klass.band);

  // Group modules by topic, keeping class order.
  const topics: { name: string; modules: typeof klass.modules }[] = [];
  for (const m of klass.modules) {
    const name = m.topic || m.title;
    const t = topics.find((x) => x.name === name);
    if (t) t.modules.push(m);
    else topics.push({ name, modules: [m] });
  }

  const tab = (active: boolean) =>
    `rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
      active ? "bg-[var(--accent)] text-[#0a0b0e]" : "muted hover:text-[var(--text)]"
    }`;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <ConsoleHeader orgLabel={orgs.map((o) => o.name).join(" · ")} instructorName={instructor.displayName} />

      <Link href="/instruct" className="muted mt-8 inline-block text-sm transition-colors hover:text-[var(--text)]">
        ← All classes
      </Link>

      <section className="animate-fade-up mt-6">
        <div className="overline mb-3">{klass.orgName}</div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{klass.name}</h1>
            <p className="muted mt-1.5 text-sm">
              {band.label} band · ages {band.ageRange} · {klass.moduleCount} project{klass.moduleCount === 1 ? "" : "s"} ·{" "}
              {klass.roster.length} learner{klass.roster.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="card px-4 py-3">
            <span className="mono-label">Class code</span>
            <span className="display ml-3 text-lg font-semibold" style={{ color: "var(--accent)" }}>
              {klass.classCode}
            </span>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <span className="card px-4 py-3">
            <span className="display text-2xl font-semibold" style={{ color: "var(--info)" }}>{klass.activeLearners}</span>
            <span className="mono-label ml-2">active</span>
          </span>
          <span className="card px-4 py-3">
            <span className="display text-2xl font-semibold" style={{ color: "var(--accent)" }}>{klass.badgesEarned}</span>
            <span className="mono-label ml-2">badges earned</span>
          </span>
          <span className="card px-4 py-3">
            <span className="display text-2xl font-semibold">{klass.queue.length}</span>
            <span className="mono-label ml-2">to review</span>
          </span>
        </div>
      </section>

      {/* View switch */}
      <div className="mt-10 flex items-center gap-1 border-b border-[var(--border-soft)] pb-3">
        <Link href={`/instruct/class/${klass.id}`} className={tab(!showRoster && !showInsights)}>
          📚 Projects · {klass.moduleCount}
        </Link>
        <Link href={`/instruct/class/${klass.id}?view=roster`} className={tab(showRoster)}>
          👥 Roster · {klass.roster.length}
          {klass.queue.length > 0 && (
            <span className="pill pill-warn ml-2">{klass.queue.length}</span>
          )}
        </Link>
        <Link href={`/instruct/class/${klass.id}?view=insights`} className={tab(showInsights)}>
          📊 Insights
        </Link>
      </div>

      {showInsights ? (
        <Insights classId={klass.id} rosterCount={klass.roster.length} lessonMinutes={Math.max(10, Math.min(180, Number(lesson) || 45))} />
      ) : showRoster ? (
        <>
          {klass.queue.length > 0 && (
            <section className="animate-fade-up mt-8">
              <div className="overline mb-3">Review queue</div>
              <h2 className="text-xl font-semibold tracking-tight">Awaiting your review</h2>
              <ReviewQueue queue={klass.queue} showClass={false} />
            </section>
          )}
          <section className="animate-fade-up mt-8" style={{ animationDelay: "0.05s" }}>
            <div className="overline mb-3">Roster</div>
            <h2 className="text-xl font-semibold tracking-tight">Progress overview</h2>
            <div className="card mt-5 p-5">
              <RosterList roster={klass.roster} />
            </div>
          </section>
        </>
      ) : (
        <section className="animate-fade-up mt-8">
          <div className="overline mb-3">Learning modules</div>
          <h2 className="text-xl font-semibold tracking-tight">What this class is working through</h2>
          <p className="muted mt-1.5 text-sm">
            In the order learners see them. Open a project to read every step the learner gets.
          </p>
          {topics.map((t, ti) => (
            <div key={t.name} className="mt-7">
              <div className="mb-3 flex items-baseline gap-3">
                <span className="mono-label">{String(ti + 1).padStart(2, "0")}</span>
                <h3 className="display text-base font-semibold">{t.name}</h3>
                <span className="mono-label">
                  {t.modules.length} project{t.modules.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {t.modules.map((m) => {
                  const n = klass.roster.length;
                  const pct = n === 0 ? 0 : Math.round((m.done / n) * 100);
                  return (
                    <Link key={m.id} href={`/instruct/class/${klass.id}/module/${m.id}`} className="block">
                      <div className="card card-interactive flex items-center gap-5 p-5">
                        <span className="tile flex h-12 w-12 shrink-0 items-center justify-center text-2xl">{m.badgeIcon}</span>
                        <span className="min-w-0 flex-1">
                          <span className="display block text-base font-semibold">{m.title}</span>
                          <span className="muted mt-1 block text-[13px]">{m.summary}</span>
                          <span className="mono-label mt-2 block">
                            {m.badgeName} badge · {m.checkpointCount} checkpoint{m.checkpointCount === 1 ? "" : "s"}
                            {m.hasWrapUp ? " · written wrap-up" : ""}
                          </span>
                        </span>
                        <span className="flex w-40 shrink-0 flex-col items-end gap-1.5">
                          <span className="mono-label">
                            {m.done}/{n} done{m.inProgress > 0 ? ` · ${m.inProgress} active` : ""}
                          </span>
                          <span className="bar w-full">
                            <span
                              style={{
                                width: `${pct}%`,
                                background: pct === 100 ? "var(--accent)" : m.inProgress > 0 ? "var(--info)" : "#3a3f49",
                              }}
                            />
                          </span>
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
          {klass.modules.length === 0 && (
            <div className="card mt-6 p-6">
              <p className="muted text-sm">No modules assigned to this class yet.</p>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
