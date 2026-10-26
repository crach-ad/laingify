// Turns stored Letter Leaper session summaries into what teachers and
// learners see: comparable-session trends, difficult keys, the teacher's
// suggestion, and the learner's after-session feedback. Pure and
// deterministic (no AI) — every message is built from the numbers it cites.

import { phaseMetrics, poolPhases, type Phase, type PhaseStats, type SessionSummary } from "./typing-metrics.ts";

// A session phase needs this many attempts to count toward trends.
export const MIN_PHASE_ATTEMPTS = 20;
// A key needs this many samples (attempts + timeouts) before it is ranked.
export const MIN_KEY_SAMPLES = 8;
// An unfinished session with no activity for this long is "interrupted".
export const STALE_MS = 30 * 60 * 1000;

export type SessionRow = {
  id: string;
  learnerId: string;
  startedAt: Date;
  lastActivityAt: Date;
  endedAt: Date | null;
  status: string;
  endReason: string | null;
  letterSet: string;
  pace: string;
  scope: string;
  hints: boolean;
  inputMethod: string;
  startLeap: number;
  furthestLeap: number;
  activeMs: number;
  pauseMs: number;
  animationMs: number;
  hiddenMs: number;
  summary: SessionSummary;
};

export const PHASE_LABEL: Record<Phase, string> = { letter: "Letter practice", word: "Word practice" };
export const SET_LABEL: Record<string, string> = { all: "All letters", home: "Home row", top: "Top row", bottom: "Bottom row" };
export const PACE_LABEL: Record<string, string> = { relaxed: "Relaxed (hints on)", steady: "Steady · 8 s", speedy: "Speedy · 4 s" };
export const SCOPE_LABEL: Record<string, string> = { letters: "Letters to the moon (100)", words: "Words to the stars (50)", full: "Full adventure (150)" };
export const INPUT_LABEL: Record<string, string> = { keyboard: "Physical keyboard", touch: "On-screen keys", mixed: "Mixed input", unknown: "No input yet" };

export function sessionState(s: Pick<SessionRow, "status" | "lastActivityAt">, now = Date.now()) {
  if (s.status === "COMPLETED") return "completed" as const;
  if (s.status === "ENDED_EARLY") return "ended early" as const;
  return now - s.lastActivityAt.getTime() > STALE_MS ? ("interrupted" as const) : ("in progress" as const);
}

// An unfinished climb a learner can pick up again: same settings as the
// class now uses, short of the finish, and touched in the last day.
export const RESUME_MS = 24 * 60 * 60 * 1000;
// `settings` null = the teacher hasn't set the practice, so any climb can resume.
export function resumableSession(rows: SessionRow[], settings: { letterSet: string; pace: string; scope: string } | null, now = Date.now()) {
  return [...rows]
    .sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime())
    .find(
      (r) =>
        ["in progress", "interrupted"].includes(sessionState(r, now)) &&
        now - r.lastActivityAt.getTime() < RESUME_MS &&
        (!settings || (r.letterSet === settings.letterSet && r.pace === settings.pace && r.scope === settings.scope)) &&
        r.summary.furthestLeap < (r.scope === "letters" ? 100 : 150),
    ) ?? null;
}

// Sessions are only compared like-for-like: same phase, same keys in play
// (words always use the whole keyboard), same pace (hints follow pace), and
// same input method.
export function comparableKey(s: Pick<SessionRow, "letterSet" | "pace" | "inputMethod">, phase: Phase) {
  return `${phase}|${phase === "letter" ? s.letterSet : "words"}|${s.pace}|${s.inputMethod}`;
}

export function comparableLabel(key: string) {
  const [phase, set, pace, input] = key.split("|");
  return [PHASE_LABEL[phase as Phase], phase === "letter" ? SET_LABEL[set] : "Short words", PACE_LABEL[pace], INPUT_LABEL[input]].join(" · ");
}

export type TrendPoint = { sessionId: string; date: Date; attempts: number; accuracy: number; correctCpm: number | null };
export type Trend = {
  key: string;
  label: string;
  points: TrendPoint[];
  // Pooled over the most recent half (≤3 sessions) vs the half before it.
  change:
    | { status: "ok"; recentN: number; earlierN: number; recentAttempts: number; earlierAttempts: number; accuracyPts: number; correctCpm: number | null }
    | { status: "not-enough-data"; reason: string };
};

export function trends(rows: SessionRow[]): Trend[] {
  const groups = new Map<string, { row: SessionRow; p: PhaseStats }[]>();
  for (const row of [...rows].sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime())) {
    for (const phase of ["letter", "word"] as const) {
      const p = row.summary.phases[phase];
      if (p.attempts < MIN_PHASE_ATTEMPTS) continue;
      const key = comparableKey(row, phase);
      groups.set(key, [...(groups.get(key) ?? []), { row, p }]);
    }
  }
  return [...groups.entries()].map(([key, list]) => {
    const points = list.map(({ row, p }) => {
      const m = phaseMetrics(p);
      return { sessionId: row.id, date: row.startedAt, attempts: p.attempts, accuracy: m.accuracy ?? 0, correctCpm: m.correctCpm };
    });
    let change: Trend["change"];
    if (list.length < 2) {
      change = { status: "not-enough-data", reason: `${list.length} comparable session${list.length === 1 ? "" : "s"} with ≥${MIN_PHASE_ATTEMPTS} attempts; 2 needed.` };
    } else {
      const n = Math.min(3, Math.floor(list.length / 2));
      const recent = poolPhases(list.slice(-n).map((x) => x.p));
      const earlier = poolPhases(list.slice(-2 * n, -n).map((x) => x.p));
      const r = phaseMetrics(recent);
      const e = phaseMetrics(earlier);
      change = {
        status: "ok", recentN: n, earlierN: n, recentAttempts: recent.attempts, earlierAttempts: earlier.attempts,
        accuracyPts: ((r.accuracy ?? 0) - (e.accuracy ?? 0)) * 100,
        correctCpm: r.correctCpm !== null && e.correctCpm !== null ? r.correctCpm - e.correctCpm : null,
      };
    }
    return { key, label: comparableLabel(key), points, change };
  });
}

export type KeyRow = { key: string; samples: number; attempts: number; errors: number; timeouts: number; errorRate: number };

// Per-key accuracy across sessions. errorRate = (incorrect attempts +
// timeouts on that key) / samples; the two stay separate in the counts.
export function keyTable(rows: SessionRow[], phases: Phase[] = ["letter", "word"]): KeyRow[] {
  const pooled = poolPhases(rows.flatMap((r) => phases.map((ph) => r.summary.phases[ph])));
  return Object.entries(pooled.keys)
    .map(([key, k]) => {
      const samples = k.n + k.to;
      return { key, samples, attempts: k.n, errors: k.n - k.c, timeouts: k.to, errorRate: samples ? (k.n - k.c + k.to) / samples : 0 };
    })
    .sort((a, b) => a.key.localeCompare(b.key));
}

export function difficultKeys(rows: SessionRow[], limit = 3, phases?: Phase[]): KeyRow[] {
  return keyTable(rows, phases)
    .filter((k) => k.samples >= MIN_KEY_SAMPLES && k.errorRate > 0)
    .sort((a, b) => b.errorRate - a.errorRate || b.samples - a.samples || a.key.localeCompare(b.key))
    .slice(0, limit);
}

export function confusionList(rows: SessionRow[], limit = 8) {
  const pooled = poolPhases(rows.flatMap((r) => [r.summary.phases.letter, r.summary.phases.word]));
  return Object.entries(pooled.confusions)
    .flatMap(([expected, gots]) => Object.entries(gots).map(([pressed, count]) => ({ expected, pressed, count })))
    .sort((a, b) => b.count - a.count || a.expected.localeCompare(b.expected))
    .slice(0, limit);
}

const pct = (x: number) => `${Math.round(x * 100)}%`;
const upper = (k: string) => k.toUpperCase();
const joinKeys = (ks: string[]) => (ks.length < 2 ? ks.map(upper).join("") : `${ks.slice(0, -1).map(upper).join(", ")} and ${upper(ks[ks.length - 1])}`);

// The teacher's suggestion: the first rule that the data supports, always
// quoting the evidence. Uses the learner's most recent comparable group.
export function teachingSuggestion(rows: SessionRow[]): { text: string; basis: string } {
  const sorted = [...rows].sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());
  const attempts = sorted.reduce((n, r) => n + r.summary.phases.letter.attempts + r.summary.phases.word.attempts, 0);
  if (attempts < 2 * MIN_PHASE_ATTEMPTS) {
    return { text: "Not enough data yet for a suggestion — a couple more practice sessions will help.", basis: `${attempts} attempts recorded; ${2 * MIN_PHASE_ATTEMPTS} needed.` };
  }
  // Latest group with enough data; fall back to everything recorded.
  const latest = [...sorted].reverse().find((r) => r.summary.phases.letter.attempts + r.summary.phases.word.attempts >= MIN_PHASE_ATTEMPTS) ?? sorted[sorted.length - 1];
  const phase: Phase = latest.summary.phases.word.attempts > latest.summary.phases.letter.attempts ? "word" : "letter";
  const key = comparableKey(latest, phase);
  const group = sorted.filter((r) => comparableKey(r, phase) === key && r.summary.phases[phase].attempts > 0).slice(-3);
  const n = group.length;
  const scope = `the last ${n === 1 ? "session" : `${n} comparable sessions`} (${comparableLabel(key)})`;
  const pooled = poolPhases(group.map((r) => r.summary.phases[phase]));
  const m = phaseMetrics(pooled);

  // Frequent timeouts come first: they make every timed-out key look hard, and
  // the fix is pace, not key drills.
  if (latest.pace !== "relaxed" && (m.timeoutRate ?? 0) >= 0.2) {
    return {
      text: `Try relaxed pace for a while: ${pct(m.timeoutRate ?? 0)} of targets timed out across ${scope}, so the timer is getting in the way.`,
      basis: `${pooled.timeouts} timeouts of ${pooled.targetsResolved} targets.`,
    };
  }
  const hard = difficultKeys(group, 2, [phase]).filter((k) => k.errorRate >= 0.15);
  if (hard.length) {
    const where = latest.pace === "relaxed" ? "in relaxed mode" : "in relaxed mode before returning to timed practice";
    return {
      text: `Practise ${joinKeys(hard.map((k) => k.key))} ${where}; ${hard.length === 1 ? "this key had" : "these keys had"} the highest error rate across ${scope}.`,
      basis: hard.map((k) => `${upper(k.key)}: ${pct(k.errorRate)} of ${k.samples} (${k.errors} wrong key${k.errors === 1 ? "" : "s"}, ${k.timeouts} timeout${k.timeouts === 1 ? "" : "s"})`).join(" · "),
    };
  }
  if ((m.accuracy ?? 0) >= 0.95 && pooled.attempts >= 3 * MIN_PHASE_ATTEMPTS) {
    const next = latest.pace === "relaxed" ? "steady pace" : latest.pace === "steady" ? "speedy pace" : phase === "letter" && latest.letterSet !== "all" ? "all letters" : "word practice";
    return {
      text: `Ready for a stretch: accuracy was ${pct(m.accuracy ?? 0)} across ${scope}. Consider ${next}.`,
      basis: `${pooled.correct} correct of ${pooled.attempts} attempts.`,
    };
  }
  return {
    text: `Keep a steady routine with the current settings; accuracy was ${pct(m.accuracy ?? 0)} across ${scope} with no single key standing out.`,
    basis: `${pooled.correct} correct of ${pooled.attempts} attempts.`,
  };
}

const ROW_OF: Record<string, string> = Object.fromEntries([
  ..."qwertyuiop".split("").map((k) => [k, "top row"]),
  ..."asdfghjkl".split("").map((k) => [k, "home row"]),
  ..."zxcvbnm".split("").map((k) => [k, "bottom row"]),
]);

// After-session feedback for the learner: one improvement, one next step, a
// small summary. Compares only with their own previous comparable session.
export function learnerFeedback(session: SessionRow, previous: SessionRow[]) {
  const s = session.summary;
  const phase: Phase = s.phases.word.attempts > s.phases.letter.attempts ? "word" : "letter";
  const p = s.phases[phase];
  const all = poolPhases([s.phases.letter, s.phases.word]);
  const m = phaseMetrics(p);
  const leaps = Math.max(0, s.furthestLeap - session.startLeap);
  const minutes = Math.max(1, Math.round(session.activeMs / 60_000));
  const accuracy = phaseMetrics(all).accuracy;
  const summary = `${leaps} leap${leaps === 1 ? "" : "s"} · ${accuracy === null ? "no answers yet" : `${pct(accuracy)} accuracy`} · about ${minutes} minute${minutes === 1 ? "" : "s"} of practice`;

  const key = comparableKey(session, phase);
  const before = [...previous]
    .filter((r) => r.id !== session.id && r.startedAt < session.startedAt && comparableKey(r, phase) === key && r.summary.phases[phase].attempts >= 10)
    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())[0];
  const bestBefore = previous
    .filter((r) => r.id !== session.id && r.startedAt < session.startedAt && comparableKey(r, phase) === key && r.scope === session.scope)
    .reduce((n, r) => Math.max(n, r.summary.furthestLeap), 0);

  let improved: string;
  if (p.attempts < 10) {
    improved = leaps > 0 ? `You made ${leaps} leap${leaps === 1 ? "" : "s"}. Every leap is practice!` : "You started a climb. Come back any time to keep going!";
  } else if (before) {
    const b = phaseMetrics(before.summary.phases[phase]);
    if ((m.accuracy ?? 0) - (b.accuracy ?? 0) >= 0.02) improved = `Your accuracy went up from ${pct(b.accuracy ?? 0)} to ${pct(m.accuracy ?? 0)}.`;
    else if (m.correctCpm && b.correctCpm && m.correctCpm >= b.correctCpm * 1.1) improved = `You found keys faster: ${Math.round(m.correctCpm)} correct letters a minute, up from ${Math.round(b.correctCpm)}.`;
    else if (s.furthestLeap > bestBefore && bestBefore > 0) improved = `You climbed to leap ${s.furthestLeap} — your highest yet!`;
    else if ((m.accuracy ?? 0) >= 0.9) improved = `You kept your accuracy high at ${pct(m.accuracy ?? 0)}.`;
    else improved = `You practised for about ${minutes} minute${minutes === 1 ? "" : "s"} — practice is how keys get easier.`;
  } else {
    improved = `Great start: ${pct(m.accuracy ?? 0)} of your key presses were right.`;
  }

  const sessionKeys = Object.entries(p.keys)
    .map(([k, c]) => ({ k, misses: c.n - c.c + c.to, samples: c.n + c.to }))
    .filter((x) => x.samples >= 3 && x.misses > 0)
    .sort((a, b) => b.misses / b.samples - a.misses / a.samples || b.samples - a.samples);
  let next: string;
  if (sessionKeys.length) {
    const k = sessionKeys[0].k;
    next = `Practise the ${upper(k)} key next. Look for it on the ${ROW_OF[k]}.`;
  } else if (p.timeouts > 0) {
    next = "Take a breath before each leap — finding the right key matters more than speed.";
  } else if ((m.accuracy ?? 0) >= 0.95 && session.pace === "relaxed" && p.attempts >= MIN_PHASE_ATTEMPTS) {
    next = "Ask your teacher if you are ready to try a timed pace.";
  } else {
    next = "Keep your eyes on the screen and try to make your streak a little longer.";
  }
  return { improved, next, summary };
}

// Fewer attempts than this across the filtered sessions = "limited data".
export const LIMITED_ATTEMPTS = 2 * MIN_PHASE_ATTEMPTS;

// One learner's row on the class dashboard (and in the class CSV).
export function learnerSummary(rows: SessionRow[], now = Date.now()) {
  const sorted = [...rows].sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());
  const states = sorted.map((r) => sessionState(r, now));
  const idle = (r: SessionRow) => r.summary.phases.letter.idleMs + r.summary.phases.word.idleMs;
  const attempts = sorted.reduce((n, r) => n + r.summary.phases.letter.attempts + r.summary.phases.word.attempts, 0);
  // Latest session with enough data in some phase; its larger phase is "the" figure.
  const latestRow = [...sorted].reverse().find((r) => Math.max(r.summary.phases.letter.attempts, r.summary.phases.word.attempts) >= MIN_PHASE_ATTEMPTS);
  let latest: { phase: Phase; accuracy: number | null; correctCpm: number | null; at: Date } | null = null;
  let improvement: Trend | null = null;
  if (latestRow) {
    const phase: Phase = latestRow.summary.phases.word.attempts > latestRow.summary.phases.letter.attempts ? "word" : "letter";
    const m = phaseMetrics(latestRow.summary.phases[phase]);
    latest = { phase, accuracy: m.accuracy, correctCpm: m.correctCpm, at: latestRow.startedAt };
    improvement = trends(sorted).find((t) => t.key === comparableKey(latestRow, phase)) ?? null;
  }
  return {
    sessions: sorted.length,
    completed: states.filter((s) => s === "completed").length,
    partial: states.filter((s) => s !== "completed").length,
    interrupted: states.filter((s) => s === "interrupted").length,
    activeMs: sorted.reduce((n, r) => n + Math.max(0, r.activeMs - idle(r)), 0),
    idleMs: sorted.reduce((n, r) => n + idle(r), 0),
    practiceDays: new Set(sorted.map((r) => r.startedAt.toISOString().slice(0, 10))).size,
    lastPractised: sorted.length ? sorted[sorted.length - 1].startedAt : null,
    attempts,
    limited: attempts < LIMITED_ATTEMPTS,
    latest,
    improvement,
    difficult: difficultKeys(sorted, 2),
  };
}
