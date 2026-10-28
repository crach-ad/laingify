// Loading Letter Leaper sessions for the learner page and instructor
// dashboards, plus the dashboard filters. Access checks happen in the callers
// (lib/typing-access.ts); everything here is scoped by class (and learner).

import { prisma } from "@/lib/db";
import type { Prisma, TypingSession } from "@prisma/client";
import { summarizeSession, type SessionSummary } from "@/lib/typing-metrics";
import type { SessionRow } from "@/lib/typing-report";

export function toSessionRow(s: TypingSession): SessionRow {
  let summary: SessionSummary;
  try {
    summary = JSON.parse(s.summaryJson);
    if (summary?.v !== 1) throw new Error("old summary");
  } catch {
    summary = summarizeSession([]);
  }
  return {
    id: s.id, learnerId: s.learnerId, startedAt: s.startedAt, lastActivityAt: s.lastActivityAt, endedAt: s.endedAt,
    status: s.status, endReason: s.endReason, letterSet: s.letterSet, pace: s.pace, scope: s.scope, hints: s.hints,
    inputMethod: s.inputMethod, startLeap: s.startLeap, furthestLeap: s.furthestLeap, activeMs: s.activeMs,
    pauseMs: s.pauseMs, animationMs: s.animationMs, hiddenMs: s.hiddenMs, summary,
  };
}

// Dashboard filters, parsed from the query string. Dates are inclusive days
// (UTC); "phase" narrows which part of each session the figures use.
export type TypingFilters = {
  from?: string;
  to?: string;
  phase?: "letter" | "word";
  letterSet?: string;
  pace?: string;
  input?: string;
};

const DAY = /^\d{4}-\d{2}-\d{2}$/;
export function parseFilters(q: Record<string, string | string[] | undefined>): TypingFilters {
  const one = (k: string) => (typeof q[k] === "string" ? (q[k] as string) : undefined);
  const pick = <T extends string>(k: string, allowed: readonly T[]) => {
    const v = one(k);
    return v && (allowed as readonly string[]).includes(v) ? (v as T) : undefined;
  };
  return {
    from: DAY.test(one("from") ?? "") ? one("from") : undefined,
    to: DAY.test(one("to") ?? "") ? one("to") : undefined,
    phase: pick("phase", ["letter", "word"] as const),
    letterSet: pick("letterSet", ["all", "home", "top", "bottom"] as const),
    pace: pick("pace", ["easy", "medium", "hard", "relaxed", "steady", "speedy", "falls"] as const),
    input: pick("input", ["keyboard", "touch", "mixed"] as const),
  };
}

export function filterQuery(f: TypingFilters) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) if (v) p.set(k, v);
  const s = p.toString();
  return s ? `?${s}` : "";
}

function where(classId: string, f: TypingFilters, learnerId?: string): Prisma.TypingSessionWhereInput {
  return {
    classId,
    ...(learnerId ? { learnerId } : {}),
    ...(f.letterSet ? { letterSet: f.letterSet } : {}),
    ...(f.pace ? { pace: f.pace } : {}),
    ...(f.input ? { inputMethod: f.input } : {}),
    ...(f.from || f.to
      ? { startedAt: { ...(f.from ? { gte: new Date(`${f.from}T00:00:00Z`) } : {}), ...(f.to ? { lt: new Date(new Date(`${f.to}T00:00:00Z`).getTime() + 86_400_000) } : {}) } }
      : {}),
  };
}

// Applying the phase filter: zero out the other phase so every figure below
// (accuracy, keys, trends) only uses the chosen kind of practice.
function narrow(row: SessionRow, phase?: "letter" | "word"): SessionRow {
  if (!phase) return row;
  const other = phase === "letter" ? "word" : "letter";
  const empty = summarizeSession([]).phases[other];
  return { ...row, summary: { ...row.summary, phases: { ...row.summary.phases, [other]: empty } } };
}

export async function classSessions(classId: string, f: TypingFilters = {}) {
  const rows = await prisma.typingSession.findMany({ where: where(classId, f), orderBy: { startedAt: "asc" } });
  return rows.map((r) => narrow(toSessionRow(r), f.phase));
}

export async function learnerSessions(classId: string, learnerId: string, f: TypingFilters = {}) {
  const rows = await prisma.typingSession.findMany({ where: where(classId, f, learnerId), orderBy: { startedAt: "asc" } });
  return rows.map((r) => narrow(toSessionRow(r), f.phase));
}

// Completed climbs saved to the old class leaderboard (LearnerEvent
// "leaper_score"). Shown as legacy results only: they have no session-level
// or per-key detail, and none is inferred from them.
export async function legacyScores(classId: string, learnerId: string) {
  const rows = await prisma.learnerEvent.findMany({
    where: { learnerId, type: "leaper_score", id: { startsWith: `leaper-score:${classId}:${learnerId}:` } },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true, meta: true },
  });
  return rows.flatMap((r) => {
    try {
      const m = JSON.parse(r.meta);
      return [{ at: r.createdAt, practice: String(m.practice), pace: String(m.pace), accuracy: m.correct / m.attempts, streak: Number(m.streak), elapsedMs: Number(m.elapsed) }];
    } catch {
      return [];
    }
  });
}
