// Letter Leaper measurements for one session, computed from its events
// (lib/typing-events.ts). Pure, deterministic, and unit-tested. Definitions and
// their limits are documented in docs/letter-leaper-progress.md.
//
// Timing model: every key/timeout event carries `rt`, the active milliseconds
// since the game last became ready for input on that target (target shown,
// previous keystroke, or resume). The game's active clock only runs while it
// accepts answers, so deliberate pauses, the moon break, hidden-tab time, and
// jump animations are already outside every rt. One extra rule — the idle cap —
// counts at most IDLE_CAP_MS of any single wait; the excess is reported as
// idle time and left out of speed denominators.

import type { EventData } from "./typing-events.ts";

export const IDLE_CAP_MS = 30_000;

export type Phase = "letter" | "word";
export type KeyCounts = { n: number; c: number; to: number };

export type PhaseStats = {
  attempts: number; // accepted character attempts (correct + incorrect)
  correct: number;
  timeouts: number; // separate from incorrect keystrokes; no keystroke invented
  targetsPresented: number;
  targetsResolved: number; // completed or timed out
  targetsCompleted: number;
  firstTry: number; // completed with no incorrect attempt and no timeout
  wordsCompleted: number;
  responseMs: number; // capped active response time (keys + timeout waits)
  idleMs: number; // excluded by the idle cap
  firstCharRt: number[]; // first attempt at position 0 of each target
  interCharRt: number[]; // correct follow-on letters within a word
  afterError: number; // attempts that directly followed an error on the same target
  recovered: number; // ...of which were correct
  keys: Record<string, KeyCounts>; // by expected key
  confusions: Record<string, Record<string, number>>; // expected -> pressed -> count
};

export type SessionSummary = {
  v: 1;
  phases: Record<Phase, PhaseStats>;
  furthestLeap: number;
  // Consecutive targets completed with no wrong key or timeout (as the game shows it).
  streak: number;
  bestStreak: number;
  inputs: { kbd: number; screen: number };
  pauses: Record<string, number>;
  connectionLost: number;
  inconsistent: number; // events that didn't fit the target on screen (skipped)
  endReason: "completed" | "exited" | null;
};

const emptyPhase = (): PhaseStats => ({
  attempts: 0, correct: 0, timeouts: 0, targetsPresented: 0, targetsResolved: 0, targetsCompleted: 0, firstTry: 0,
  wordsCompleted: 0, responseMs: 0, idleMs: 0, firstCharRt: [], interCharRt: [], afterError: 0, recovered: 0,
  keys: {}, confusions: {},
});

export function summarizeSession(events: (EventData & { seq: number })[]): SessionSummary {
  const out: SessionSummary = {
    v: 1, phases: { letter: emptyPhase(), word: emptyPhase() }, furthestLeap: 0, streak: 0, bestStreak: 0,
    inputs: { kbd: 0, screen: 0 }, pauses: {}, connectionLost: 0, inconsistent: 0, endReason: null,
  };
  // The target on screen, and what has happened on it so far.
  let cur: { target: string; phase: Phase; leap: number; erred: boolean; tries: number; lastOk: boolean | null } | null = null;

  const time = (p: PhaseStats, rt: number) => {
    const counted = Math.min(rt, IDLE_CAP_MS);
    p.responseMs += counted;
    p.idleMs += rt - counted;
    return rt <= IDLE_CAP_MS;
  };
  const key = (p: PhaseStats, k: string) => (p.keys[k] ??= { n: 0, c: 0, to: 0 });

  for (const e of [...events].sort((a, b) => a.seq - b.seq)) {
    switch (e.type) {
      case "session_start":
        out.furthestLeap = Math.max(out.furthestLeap, e.leap);
        break;
      case "target":
        cur = { target: e.target, phase: e.kind, leap: e.leap, erred: false, tries: 0, lastOk: null };
        out.phases[e.kind].targetsPresented++;
        break;
      case "key": {
        if (!cur || cur.target[e.pos] !== e.exp) {
          out.inconsistent++;
          break;
        }
        const p = out.phases[cur.phase];
        p.attempts++;
        out.inputs[e.src]++;
        const k = key(p, e.exp);
        k.n++;
        const inWindow = time(p, e.rt);
        if (cur.tries === 0 && e.pos === 0 && inWindow) p.firstCharRt.push(e.rt);
        if (e.ok && e.pos > 0 && cur.lastOk === true && inWindow) p.interCharRt.push(e.rt);
        if (cur.lastOk === false) {
          p.afterError++;
          if (e.ok) p.recovered++;
        }
        if (e.ok) {
          p.correct++;
          k.c++;
        } else {
          cur.erred = true;
          out.streak = 0;
          (p.confusions[e.exp] ??= {})[e.got] = (p.confusions[e.exp][e.got] ?? 0) + 1;
        }
        cur.tries++;
        cur.lastOk = e.ok;
        break;
      }
      case "complete": {
        if (!cur || cur.target !== e.target) {
          out.inconsistent++;
          break;
        }
        const p = out.phases[cur.phase];
        p.targetsCompleted++;
        p.targetsResolved++;
        if (!cur.erred) p.firstTry++;
        if (cur.phase === "word") p.wordsCompleted++;
        out.streak++;
        out.bestStreak = Math.max(out.bestStreak, out.streak);
        out.furthestLeap = Math.max(out.furthestLeap, e.leap);
        cur = null;
        break;
      }
      case "timeout": {
        if (!cur || cur.target !== e.target) {
          out.inconsistent++;
          break;
        }
        const p = out.phases[cur.phase];
        p.timeouts++;
        p.targetsResolved++;
        key(p, e.target[e.pos]).to++;
        time(p, e.rt);
        out.streak = 0;
        cur = null;
        break;
      }
      case "pause":
        out.pauses[e.reason] = (out.pauses[e.reason] ?? 0) + 1;
        break;
      case "connection":
        if (e.state === "lost") out.connectionLost++;
        break;
      case "end":
        out.endReason = e.reason;
        out.furthestLeap = Math.max(out.furthestLeap, e.leap);
        break;
    }
  }
  return out;
}

export const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

const perMinute = (n: number, ms: number) => (ms > 0 ? n / (ms / 60_000) : null);
const ratio = (n: number, d: number) => (d > 0 ? n / d : null);

// The headline figures for one phase (or a pooled set of phases).
export function phaseMetrics(p: PhaseStats) {
  return {
    attempts: p.attempts,
    accuracy: ratio(p.correct, p.attempts),
    correctCpm: perMinute(p.correct, p.responseMs),
    attemptedCpm: perMinute(p.attempts, p.responseMs),
    // Short game words (2–3 letters) — not a standardized WPM.
    correctWpm: perMinute(p.wordsCompleted, p.responseMs),
    firstAttemptAccuracy: ratio(p.firstTry, p.targetsResolved),
    timeoutRate: ratio(p.timeouts, p.targetsResolved),
    recoveryRate: ratio(p.recovered, p.afterError),
    medianFirstCharMs: median(p.firstCharRt),
    medianInterCharMs: median(p.interCharRt),
    responseMs: p.responseMs,
    idleMs: p.idleMs,
  };
}

// Pool several PhaseStats (e.g. one phase across sessions) by summing counts.
export function poolPhases(list: PhaseStats[]): PhaseStats {
  const out = emptyPhase();
  for (const p of list) {
    for (const k of ["attempts", "correct", "timeouts", "targetsPresented", "targetsResolved", "targetsCompleted", "firstTry", "wordsCompleted", "responseMs", "idleMs", "afterError", "recovered"] as const) {
      out[k] += p[k];
    }
    out.firstCharRt.push(...p.firstCharRt);
    out.interCharRt.push(...p.interCharRt);
    for (const [k, v] of Object.entries(p.keys)) {
      const t = (out.keys[k] ??= { n: 0, c: 0, to: 0 });
      t.n += v.n;
      t.c += v.c;
      t.to += v.to;
    }
    for (const [exp, gots] of Object.entries(p.confusions)) {
      for (const [got, n] of Object.entries(gots)) (out.confusions[exp] ??= {})[got] = (out.confusions[exp][got] ?? 0) + n;
    }
  }
  return out;
}

export function inputMethodOf(s: SessionSummary): "keyboard" | "touch" | "mixed" | "unknown" {
  const { kbd, screen } = s.inputs;
  if (!kbd && !screen) return "unknown";
  if (kbd && screen) return "mixed";
  return kbd ? "keyboard" : "touch";
}
