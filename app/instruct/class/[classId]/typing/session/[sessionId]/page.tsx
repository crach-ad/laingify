import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireInstructorClass } from "@/lib/typing-access";
import { toSessionRow } from "@/lib/typing-data";
import { IDLE_CAP_MS, phaseMetrics, type Phase } from "@/lib/typing-metrics";
import { INPUT_LABEL, PACE_LABEL, PHASE_LABEL, SCOPE_LABEL, SET_LABEL, keyTable, sessionState } from "@/lib/typing-report";
import { dateTime, minutes, num, pct, seconds } from "@/lib/typing-format";
import { ConsoleHeader } from "../../../../../ConsoleParts";
import { KeyTable, NotEnough, TimeBar } from "../../parts";

type TargetLog = { leap: number; target: string; kind: string; misses: string[]; outcome: "first try" | "after errors" | "timed out" | "on screen at end"; ms: number };

// What happened on each target, rebuilt from the session's events.
function targetLog(events: { type: string; data: string }[]): TargetLog[] {
  const out: TargetLog[] = [];
  let cur: TargetLog | null = null;
  for (const e of events) {
    const d = JSON.parse(e.data);
    if (e.type === "target") {
      cur = { leap: d.leap, target: d.target, kind: d.kind, misses: [], outcome: "on screen at end", ms: 0 };
      out.push(cur);
    } else if (cur && e.type === "key") {
      cur.ms += Math.min(d.rt, IDLE_CAP_MS);
      if (!d.ok) cur.misses.push(`${d.got.toUpperCase()} for ${d.exp.toUpperCase()}`);
    } else if (cur && e.type === "complete") {
      cur.outcome = cur.misses.length ? "after errors" : "first try";
      cur = null;
    } else if (cur && e.type === "timeout") {
      cur.ms += Math.min(d.rt, IDLE_CAP_MS);
      cur.outcome = "timed out";
      cur = null;
    }
  }
  return out;
}

export default async function TypingSessionDetail({ params }: { params: Promise<{ classId: string; sessionId: string }> }) {
  const { classId, sessionId } = await params;
  const ctx = await requireInstructorClass(classId);
  const row = await prisma.typingSession.findUnique({ where: { id: sessionId }, include: { learner: { select: { id: true, displayName: true } } } });
  if (!row || row.classId !== ctx.klass.id) notFound();
  const { auth, klass } = ctx;
  const s = toSessionRow(row);
  const events = row.eventsPurgedAt ? [] : await prisma.typingEvent.findMany({ where: { sessionId }, orderBy: { seq: "asc" }, select: { type: true, data: true } });
  const log = targetLog(events);
  const summary = JSON.parse(row.summaryJson) as { ignored?: Record<string, number> };
  const idle = s.summary.phases.letter.idleMs + s.summary.phases.word.idleMs;
  const response = s.summary.phases.letter.responseMs + s.summary.phases.word.responseMs;
  const phases = (["letter", "word"] as Phase[]).filter((p) => s.summary.phases[p].targetsPresented > 0);
  const base = `/instruct/class/${klass.id}/typing`;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <ConsoleHeader orgLabel={auth.orgs.map((o) => o.name).join(" · ")} instructorName={auth.instructor.displayName} />
      <Link href={`${base}/learner/${row.learner.id}`} className="muted mt-8 inline-block text-sm transition-colors hover:text-[var(--text)]">
        ← {row.learner.displayName}&apos;s typing record
      </Link>

      <section className="animate-fade-up mt-6">
        <div className="overline mb-3">Practice session</div>
        <h1 className="text-2xl font-semibold tracking-tight">{dateTime(s.startedAt)} · {sessionState(s)}</h1>
        <p className="muted mt-1.5 text-sm">
          {SCOPE_LABEL[s.scope]} · {SET_LABEL[s.letterSet]} · {PACE_LABEL[s.pace]} · {INPUT_LABEL[s.inputMethod]} · leaps {s.startLeap}→{s.summary.furthestLeap}
          {s.endReason ? ` · ended: ${s.endReason === "completed" ? "finished" : "left early"}` : ""} · last activity {dateTime(s.lastActivityAt)}
        </p>
        <p className="muted mt-1 text-xs">Game {row.gameVersion} · measurement v{row.measurementVersion} · session {row.id}</p>
      </section>

      <section className="card mt-6 p-5">
        <div className="overline mb-3">Where the time went</div>
        <TimeBar
          parts={[
            { label: "Counted response time", ms: response, color: "var(--accent)" },
            { label: "Idle (over 30 s per wait, excluded)", ms: idle, color: "var(--warn)" },
            { label: "Paused / moon break / hidden tab", ms: s.pauseMs, color: "#3a3f49" },
            { label: "Jump animations (excluded)", ms: s.animationMs, color: "var(--info)" },
          ]}
        />
        <p className="muted mt-2 text-xs">
          Of the pause time, {minutes(s.hiddenMs)} was with the tab hidden. Pauses: {Object.entries(s.summary.pauses).map(([k, v]) => `${k} ×${v}`).join(", ") || "none"}.
          {s.summary.connectionLost ? ` Connection dropped ${s.summary.connectionLost}× (data was kept on the device and uploaded later).` : ""}
        </p>
      </section>

      <section className="mt-6 grid gap-3 md:grid-cols-2">
        {phases.length ? phases.map((p) => {
          const st = s.summary.phases[p];
          const m = phaseMetrics(st);
          const line = (label: string, value: string, note?: string) => (
            <div className="flex justify-between gap-3 border-t border-[var(--border-soft)] py-1.5 text-sm">
              <span className="muted">{label}</span>
              <span className="text-right">{value}{note ? <span className="muted text-xs"> {note}</span> : null}</span>
            </div>
          );
          return (
            <div key={p} className="card p-5">
              <div className="overline mb-3">{PHASE_LABEL[p]}</div>
              {line("Accuracy", pct(m.accuracy, 1), `${st.correct}/${st.attempts} attempts`)}
              {line("Correct characters / min", num(m.correctCpm, 1))}
              {line("Attempted characters / min", num(m.attemptedCpm, 1))}
              {p === "word" && line("Correct short words / min", num(m.correctWpm, 1), "(2–3 letter game words, not standardized WPM)")}
              {line("First-attempt targets", pct(m.firstAttemptAccuracy), `${st.firstTry}/${st.targetsResolved}`)}
              {line("Timeouts", `${st.timeouts}`, `rate ${pct(m.timeoutRate)}`)}
              {line("Recovery after an error", pct(m.recoveryRate), `${st.recovered}/${st.afterError}`)}
              {line("Median time to first letter", seconds(m.medianFirstCharMs), `n=${st.firstCharRt.length}`)}
              {p === "word" && line("Median gap between letters", seconds(m.medianInterCharMs), `n=${st.interCharRt.length}`)}
              {st.attempts < 20 && <p className="mt-2"><NotEnough>Fewer than 20 attempts — treat these figures as rough.</NotEnough></p>}
            </div>
          );
        }) : <NotEnough>No targets recorded in this session.</NotEnough>}
      </section>

      <section className="mt-6 grid gap-3 lg:grid-cols-2">
        <div className="card p-5">
          <div className="overline mb-3">Keys in this session</div>
          <KeyTable keys={keyTable([s])} />
        </div>
        <div className="card p-5">
          <div className="overline mb-3">Ignored input (not counted as attempts)</div>
          <p className="text-sm">
            {Object.entries(summary.ignored ?? {}).filter(([, n]) => n > 0).map(([k, n]) => `${{ repeat: "held key repeats", modifier: "shortcuts (Ctrl/Cmd/Alt)", composition: "IME composition", paste: "paste", nonletter: "non-letter keys", busy: "keys during a leap" }[k] ?? k}: ${n}`).join(" · ") || "None."}
          </p>
          {s.summary.inconsistent > 0 && <p className="muted mt-2 text-xs">{s.summary.inconsistent} event(s) didn&apos;t match the target on screen and were skipped.</p>}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-semibold tracking-tight">Target by target</h2>
        {row.eventsPurgedAt ? (
          <p className="muted mt-2 text-sm">Detailed events were removed on {dateTime(row.eventsPurgedAt)} under the retention policy; the summary above is kept.</p>
        ) : (
          <div className="card mt-3 max-h-[480px] overflow-auto p-2">
            <table className="w-full text-left text-sm">
              <thead className="mono-label"><tr><th className="px-3 py-2">Leap</th><th>Target</th><th>Outcome</th><th>Wrong keys</th><th>Response time</th></tr></thead>
              <tbody>
                {log.map((t, i) => (
                  <tr key={i} className="border-t border-[var(--border-soft)]">
                    <td className="px-3 py-1.5">{t.leap}</td>
                    <td className="font-semibold">{t.target.toUpperCase()}</td>
                    <td style={{ color: t.outcome === "first try" ? "var(--accent)" : t.outcome === "timed out" ? "var(--warn)" : undefined }}>{t.outcome}</td>
                    <td className="text-xs">{t.misses.join(", ") || "—"}</td>
                    <td>{seconds(t.ms)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
