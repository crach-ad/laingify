import Link from "next/link";
import { notFound } from "next/navigation";
import { requireInstructor } from "@/lib/instructor";
import { instructorLearner } from "@/lib/typing-access";
import { filterQuery, learnerSessions, legacyScores, parseFilters } from "@/lib/typing-data";
import { phaseMetrics, poolPhases } from "@/lib/typing-metrics";
import { INPUT_LABEL, PACE_LABEL, SCOPE_LABEL, SET_LABEL, confusionList, keyTable, learnerSummary, sessionState, teachingSuggestion, trends } from "@/lib/typing-report";
import { dateTime, minutes, num, pct } from "@/lib/typing-format";
import { ConsoleHeader } from "../../../../../ConsoleParts";
import { Filters, KeyTable, KeyboardHeatmap, NotEnough, Stat, TrendChart } from "../../parts";

export default async function TypingLearnerRecord({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string; learnerId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { classId, learnerId } = await params;
  await requireInstructor();
  const ctx = await instructorLearner(classId, learnerId);
  if (!ctx) notFound();
  const { auth, klass, learner } = ctx;
  const f = parseFilters(await searchParams);
  const base = `/instruct/class/${klass.id}/typing`;
  const [rows, legacy] = await Promise.all([learnerSessions(klass.id, learner.id, f), legacyScores(klass.id, learner.id)]);
  const sum = learnerSummary(rows);
  const suggestion = teachingSuggestion(rows);
  const keys = keyTable(rows);
  const confusions = confusionList(rows);
  const groups = trends(rows);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <ConsoleHeader orgLabel={auth.orgs.map((o) => o.name).join(" · ")} instructorName={auth.instructor.displayName} />
      <Link href={`${base}${filterQuery(f)}`} className="muted mt-8 inline-block text-sm transition-colors hover:text-[var(--text)]">
        ← {klass.name} · typing progress
      </Link>

      <section className="animate-fade-up mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="overline mb-3">Typing record</div>
          <h1 className="text-3xl font-semibold tracking-tight">{learner.displayName}</h1>
        </div>
        <a href={`${base}/export${filterQuery(f)}${filterQuery(f) ? "&" : "?"}learner=${learner.id}`} className="btn-ghost flex h-9 items-center px-3 text-xs">
          ⬇ Export sessions CSV
        </a>
      </section>

      <Filters action={`${base}/learner/${learner.id}`} f={f} />

      <div className="mt-5 flex flex-wrap gap-3">
        <Stat value={sum.sessions} label={`sessions · ${sum.completed} finished, ${sum.partial} partial`} />
        <Stat value={minutes(sum.activeMs)} label="active practice" color="var(--info)" />
        <Stat value={sum.practiceDays} label={`practice day${sum.practiceDays === 1 ? "" : "s"}`} />
        <Stat value={sum.attempts} label="key attempts" />
      </div>

      <section className="card mt-6 p-5" style={{ borderColor: "var(--accent-border)" }}>
        <div className="overline mb-2">Teaching suggestion</div>
        <p className="text-base">{suggestion.text}</p>
        <p className="muted mt-1.5 text-xs">Based on: {suggestion.basis}</p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold tracking-tight">Progress over comparable sessions</h2>
        <p className="muted mt-1 text-sm">Sessions are compared only with the same kind of practice, keys, pace, and input. A session phase needs 20+ attempts to count.</p>
        <div className="mt-4 flex flex-col gap-3">
          {groups.length ? groups.map((t) => <TrendChart key={t.key} trend={t} />) : <NotEnough>Not enough data yet — no session phase has 20+ attempts.</NotEnough>}
        </div>
      </section>

      <section className="mt-8 grid gap-3 lg:grid-cols-[1.2fr_1fr]">
        <div className="card p-5">
          <div className="overline mb-4">Per-key accuracy</div>
          <KeyboardHeatmap keys={keys} />
          <div className="mt-4"><KeyTable keys={keys} /></div>
        </div>
        <div className="card p-5">
          <div className="overline mb-3">Common key confusions</div>
          {confusions.length ? (
            <table className="w-full text-left text-sm">
              <thead className="mono-label"><tr><th className="py-1.5">Expected</th><th>Pressed instead</th><th>Times</th></tr></thead>
              <tbody>
                {confusions.map((c) => (
                  <tr key={`${c.expected}${c.pressed}`} className="border-t border-[var(--border-soft)]">
                    <td className="py-1.5 font-semibold">{c.expected.toUpperCase()}</td>
                    <td>{c.pressed.toUpperCase()}</td>
                    <td>{c.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <NotEnough>No wrong keys recorded.</NotEnough>
          )}
          <p className="muted mt-3 text-xs">Timeouts aren&apos;t confusions: no key was pressed, so none is invented.</p>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold tracking-tight">Session history</h2>
        <div className="card mt-4 overflow-x-auto p-2">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="mono-label">
              <tr><th className="px-3 py-2">Started</th><th>Practice</th><th>Input</th><th>Status</th><th>Leaps</th><th>Active</th><th>Accuracy</th><th>Correct CPM</th><th>Timeouts</th></tr>
            </thead>
            <tbody>
              {[...rows].reverse().map((r) => {
                const m = phaseMetrics(poolPhases([r.summary.phases.letter, r.summary.phases.word]));
                const state = sessionState(r);
                return (
                  <tr key={r.id} className="border-t border-[var(--border-soft)]">
                    <td className="px-3 py-2">
                      <Link href={`${base}/session/${r.id}`} className="underline-offset-2 hover:underline">{dateTime(r.startedAt)}</Link>
                    </td>
                    <td className="text-xs">{SCOPE_LABEL[r.scope]}<div className="muted">{SET_LABEL[r.letterSet]} · {PACE_LABEL[r.pace]}</div></td>
                    <td className="text-xs">{INPUT_LABEL[r.inputMethod]}</td>
                    <td>
                      <span className={`pill ${state === "completed" ? "pill-done" : state === "interrupted" ? "pill-warn" : "pill-progress"}`}>{state}</span>
                    </td>
                    <td>{r.startLeap}→{r.summary.furthestLeap}</td>
                    <td>{minutes(Math.max(0, r.activeMs - r.summary.phases.letter.idleMs - r.summary.phases.word.idleMs))}</td>
                    <td>{pct(m.accuracy)}<span className="muted text-xs"> ({m.attempts})</span></td>
                    <td>{num(m.correctCpm)}</td>
                    <td>{r.summary.phases.letter.timeouts + r.summary.phases.word.timeouts}</td>
                  </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={9} className="muted px-3 py-4">No sessions in this range.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {legacy.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold tracking-tight">Legacy leaderboard results</h2>
          <p className="muted mt-1 text-sm">Completed climbs saved to the class leaderboard before progress tracking. They have no session or per-key detail and aren&apos;t part of the figures above.</p>
          <ul className="card mt-3 flex flex-col gap-1 p-4 text-sm">
            {legacy.map((l, i) => (
              <li key={i} className="flex justify-between">
                <span>{dateTime(l.at)} · {SET_LABEL[l.practice] ?? l.practice} · {l.pace}</span>
                <span className="mono-label">{pct(l.accuracy)} accuracy · best streak {l.streak} · {minutes(l.elapsedMs)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
