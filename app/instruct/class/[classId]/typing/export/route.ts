import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { instructorClass, instructorLearner } from "@/lib/typing-access";
import { classSessions, learnerSessions, parseFilters } from "@/lib/typing-data";
import { phaseMetrics, poolPhases } from "@/lib/typing-metrics";
import { learnerSummary, sessionState } from "@/lib/typing-report";

// CSV of the currently filtered Letter Leaper summaries: one row per learner
// (class), or one row per session with ?learner=. Same access rule and
// filters as the dashboards.
const cell = (v: unknown) => {
  let s = v === null || v === undefined ? "" : String(v);
  // Text that a spreadsheet would run as a formula (e.g. a name "=1+1").
  if (typeof v === "string" && /^[=+\-@]/.test(s)) s = `'${s}`;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = (rows: unknown[][]) => rows.map((r) => r.map(cell).join(",")).join("\n") + "\n";
const r1 = (x: number | null) => (x === null ? "" : Math.round(x * 10) / 10);
const p1 = (x: number | null) => (x === null ? "" : Math.round(x * 1000) / 10);
const min = (ms: number) => Math.round(ms / 6000) / 10;

export async function GET(req: Request, ctx: RouteContext<"/instruct/class/[classId]/typing/export">) {
  const { classId } = await ctx.params;
  const url = new URL(req.url);
  const f = parseFilters(Object.fromEntries(url.searchParams));
  const learnerId = url.searchParams.get("learner");

  let rows: unknown[][];
  let name: string;
  if (learnerId) {
    const access = await instructorLearner(classId, learnerId);
    if (!access) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const sessions = await learnerSessions(classId, learnerId, f);
    name = `${access.klass.classCode}-typing-${access.learner.displayName.replace(/[^\w-]+/g, "_")}`;
    rows = [
      ["session_id", "started_at_utc", "status", "end_reason", "scope", "letter_set", "pace", "hints", "input", "start_leap", "furthest_leap",
        "active_min", "idle_excluded_min", "pause_min", "animation_min", "attempts", "correct", "accuracy_pct", "correct_cpm", "attempted_cpm",
        "words_completed", "correct_short_wpm", "first_attempt_pct", "timeouts", "timeout_rate_pct"],
      ...sessions.map((s) => {
        const all = poolPhases([s.summary.phases.letter, s.summary.phases.word]);
        const m = phaseMetrics(all);
        const w = phaseMetrics(s.summary.phases.word);
        return [s.id, s.startedAt.toISOString(), sessionState(s), s.endReason, s.scope, s.letterSet, s.pace, s.hints, s.inputMethod, s.startLeap,
          s.summary.furthestLeap, min(Math.max(0, s.activeMs - all.idleMs)), min(all.idleMs), min(s.pauseMs), min(s.animationMs), all.attempts,
          all.correct, p1(m.accuracy), r1(m.correctCpm), r1(m.attemptedCpm), all.wordsCompleted, r1(w.correctWpm), p1(m.firstAttemptAccuracy),
          all.timeouts, p1(m.timeoutRate)];
      }),
    ];
  } else {
    const access = await instructorClass(classId);
    if (!access) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const [roster, sessions] = await Promise.all([
      prisma.rosterEntry.findMany({ where: { classId }, include: { learner: { select: { id: true, displayName: true } } }, orderBy: { learner: { displayName: "asc" } } }),
      classSessions(classId, f),
    ]);
    name = `${access.klass.classCode}-typing-class`;
    rows = [
      ["learner", "sessions", "completed", "partial", "interrupted", "active_min", "idle_excluded_min", "practice_days", "last_practised_utc",
        "attempts", "latest_phase", "latest_accuracy_pct", "latest_correct_cpm", "comparable_change_accuracy_pts", "comparable_change_cpm",
        "comparable_sessions_compared", "difficult_keys", "limited_data"],
      ...roster.map((r) => {
        const s = learnerSummary(sessions.filter((x) => x.learnerId === r.learnerId));
        const ch = s.improvement?.change;
        return [r.learner.displayName, s.sessions, s.completed, s.partial, s.interrupted, min(s.activeMs), min(s.idleMs), s.practiceDays,
          s.lastPractised?.toISOString() ?? "", s.attempts, s.latest?.phase ?? "", p1(s.latest?.accuracy ?? null), r1(s.latest?.correctCpm ?? null),
          ch?.status === "ok" ? r1(ch.accuracyPts) : "not enough data", ch?.status === "ok" ? r1(ch.correctCpm) : "",
          ch?.status === "ok" ? `${ch.recentN} vs ${ch.earlierN}` : "",
          s.difficult.map((k) => `${k.key.toUpperCase()} ${Math.round(k.errorRate * 100)}% n=${k.samples}`).join("; "), s.limited];
      }),
    ];
  }
  return new NextResponse(csv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
