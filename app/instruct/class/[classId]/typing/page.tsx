import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireInstructorClass, letterLeaperModuleId, practiceSettings } from "@/lib/typing-access";
import { classSessions, filterQuery, parseFilters } from "@/lib/typing-data";
import { PHASE_LABEL, difficultKeys, learnerSummary, sessionState } from "@/lib/typing-report";
import { day, delta, minutes, num, pct } from "@/lib/typing-format";
import { ConsoleHeader } from "../../../ConsoleParts";
import { Filters, NotEnough, Stat } from "./parts";
import TypingSetup from "./TypingSetup";

// Letter Leaper for one class: setup (assignment, settings, sign-in) and the
// progress dashboard. Figures are explained in docs/letter-leaper-progress.md.
export default async function TypingDashboard({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { classId } = await params;
  const ctx = await requireInstructorClass(classId);
  const { auth, klass } = ctx;
  const f = parseFilters(await searchParams);
  const base = `/instruct/class/${klass.id}/typing`;

  const [moduleId, settings, roster, sessions] = await Promise.all([
    letterLeaperModuleId(klass.id, klass.orgId),
    practiceSettings(klass.id),
    prisma.rosterEntry.findMany({
      where: { classId: klass.id },
      include: { learner: { select: { id: true, displayName: true, pin: true } } },
      orderBy: { learner: { displayName: "asc" } },
    }),
    classSessions(klass.id, f),
  ]);

  const byLearner = new Map<string, typeof sessions>();
  for (const s of sessions) byLearner.set(s.learnerId, [...(byLearner.get(s.learnerId) ?? []), s]);
  const rows = roster.map((r) => ({ learner: r.learner, rows: byLearner.get(r.learnerId) ?? [], sum: learnerSummary(byLearner.get(r.learnerId) ?? []) }));
  const practised = rows.filter((r) => r.sum.sessions > 0);
  const latestAcc = practised.map((r) => r.sum.latest?.accuracy).filter((x): x is number => typeof x === "number").sort((a, b) => a - b);
  const classHard = difficultKeys(sessions, 5);
  const attention = rows.filter((r) => r.sum.sessions === 0 || r.sum.limited || r.sum.interrupted > 0);
  const interrupted = sessions.filter((s) => sessionState(s) === "interrupted").length;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <ConsoleHeader orgLabel={auth.orgs.map((o) => o.name).join(" · ")} instructorName={auth.instructor.displayName} />
      <Link href={`/instruct/class/${klass.id}`} className="muted mt-8 inline-block text-sm transition-colors hover:text-[var(--text)]">
        ← {klass.name}
      </Link>

      <section className="animate-fade-up mt-6">
        <div className="overline mb-3">Keyboard skills · Letter Leaper</div>
        <h1 className="text-3xl font-semibold tracking-tight">Typing progress</h1>
        <p className="muted mt-1.5 max-w-2xl text-sm">
          Client-reported practice data from the game, not a proctored test. Speed counts only time the game was waiting for an answer
          (pauses, hidden tabs, and jump animations excluded; any wait over 30 s counts as 30 s). Game CPM measures finding keys for
          displayed letters, so it isn&apos;t comparable to typing a passage.
        </p>
      </section>

      <TypingSetup
        classId={klass.id}
        assigned={!!moduleId}
        settings={settings}
        minAuthTier={klass.minAuthTier}
        classCode={klass.classCode}
        entryPath={`/join?code=${encodeURIComponent(klass.classCode)}`}
        withoutPin={roster.filter((r) => !r.learner.pin).length}
      />

      {moduleId && (
        <>
          <Filters action={base} f={f} />

          <div className="mt-5 flex flex-wrap gap-3">
            <Stat value={`${practised.length}/${roster.length}`} label="students practised" color="var(--accent)" />
            <Stat value={minutes(rows.reduce((n, r) => n + r.sum.activeMs, 0))} label="active practice" color="var(--info)" />
            <Stat value={`${sessions.filter((s) => sessionState(s) === "completed").length}/${sessions.length}`} label={`sessions finished${interrupted ? ` · ${interrupted} interrupted` : ""}`} />
            <Stat value={latestAcc.length ? pct(latestAcc[Math.floor((latestAcc.length - 1) / 2)]) : "—"} label="median latest accuracy" />
          </div>

          <section className="mt-8">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl font-semibold tracking-tight">Students</h2>
              <a href={`${base}/export${filterQuery(f)}`} className="btn-ghost flex h-9 items-center px-3 text-xs">⬇ Export class CSV</a>
            </div>
            <div className="card mt-4 overflow-x-auto p-2">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="mono-label">
                  <tr>
                    <th className="px-3 py-2">Student</th>
                    <th>Sessions</th>
                    <th>Active</th>
                    <th>Last practised</th>
                    <th>Latest accuracy</th>
                    <th>Latest correct CPM</th>
                    <th>Comparable change</th>
                    <th>Difficult keys</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ learner, sum }) => {
                    const ch = sum.improvement?.change;
                    return (
                      <tr key={learner.id} className="border-t border-[var(--border-soft)] align-top">
                        <td className="px-3 py-2.5">
                          <Link href={`${base}/learner/${learner.id}${filterQuery(f)}`} className="font-medium underline-offset-2 hover:underline">
                            {learner.displayName}
                          </Link>
                          {klass.minAuthTier >= 1 && !learner.pin && <div className="mono-label" style={{ color: "var(--warn)" }}>no PIN</div>}
                        </td>
                        <td className="py-2.5">
                          {sum.sessions === 0 ? <NotEnough>none</NotEnough> : <>{sum.completed} done · {sum.partial} partial</>}
                          {sum.interrupted > 0 && <div className="mono-label" style={{ color: "var(--warn)" }}>{sum.interrupted} interrupted</div>}
                        </td>
                        <td className="py-2.5">{sum.sessions ? minutes(sum.activeMs) : "—"}</td>
                        <td className="py-2.5">{sum.lastPractised ? day(sum.lastPractised) : "—"}</td>
                        <td className="py-2.5">
                          {sum.latest ? <>{pct(sum.latest.accuracy)} <span className="muted text-xs">{PHASE_LABEL[sum.latest.phase].split(" ")[0]}</span></> : <NotEnough>not enough data</NotEnough>}
                        </td>
                        <td className="py-2.5">{sum.latest ? num(sum.latest.correctCpm) : "—"}</td>
                        <td className="py-2.5">
                          {ch?.status === "ok" ? (
                            <span title={`Last ${ch.recentN} vs previous ${ch.earlierN} comparable sessions (${ch.recentAttempts} vs ${ch.earlierAttempts} attempts)`}>
                              {delta(ch.accuracyPts, "pts")} · {delta(ch.correctCpm, "CPM")}
                              <div className="mono-label">{ch.recentN} vs {ch.earlierN} sessions</div>
                            </span>
                          ) : (
                            <NotEnough>not enough data</NotEnough>
                          )}
                        </td>
                        <td className="py-2.5">
                          {sum.difficult.length ? sum.difficult.map((k) => `${k.key.toUpperCase()} ${pct(k.errorRate)} (n=${k.samples})`).join(", ") : <NotEnough>none flagged</NotEnough>}
                        </td>
                      </tr>
                    );
                  })}
                  {rows.length === 0 && (
                    <tr><td colSpan={8} className="muted px-3 py-4">No students on this roster yet — add them above.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-8 grid gap-3 lg:grid-cols-2">
            <div className="card p-5">
              <div className="overline mb-3">Common difficult keys</div>
              {classHard.length ? (
                <ul className="flex flex-col gap-1.5 text-sm">
                  {classHard.map((k) => (
                    <li key={k.key} className="flex justify-between">
                      <span className="font-semibold">{k.key.toUpperCase()}</span>
                      <span className="mono-label">{pct(k.errorRate)} missed · {k.errors} wrong, {k.timeouts} timeouts · n={k.samples}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <NotEnough>Not enough data yet (keys need 8+ samples).</NotEnough>
              )}
            </div>
            <div className="card p-5">
              <div className="overline mb-3">Needs a look</div>
              {attention.length ? (
                <ul className="flex flex-col gap-1.5 text-sm">
                  {attention.map(({ learner, sum }) => (
                    <li key={learner.id} className="flex justify-between gap-3">
                      <Link href={`${base}/learner/${learner.id}${filterQuery(f)}`} className="hover:underline">{learner.displayName}</Link>
                      <span className="mono-label text-right">
                        {sum.sessions === 0
                          ? "no practice in this range"
                          : [sum.limited ? `limited data (${sum.attempts} attempts)` : "", sum.interrupted ? `${sum.interrupted} interrupted` : ""].filter(Boolean).join(" · ")}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted text-sm">Everyone has enough practice data in this range.</p>
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
