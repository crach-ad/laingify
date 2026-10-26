// Stores one Letter Leaper upload batch and refreshes the session summary.
//
// Idempotent: a retried batch (same event ids at the same seqs) changes
// nothing; a different event claiming a stored seq is rejected. The session
// row is locked for the duration, so a beacon racing a retry can't interleave.

import { prisma } from "@/lib/db";
import { planInsert, type BatchIn, type EventData } from "@/lib/typing-events";
import { inputMethodOf, summarizeSession, type SessionSummary } from "@/lib/typing-metrics";
import type { PracticeContext } from "@/lib/typing-access";

export type IngestResult =
  | { ok: true; lastSeq: number; accepted: number; duplicates: number }
  | { ok: false; status: number; error: string };

export async function ingestBatch(ctx: PracticeContext, batch: BatchIn, now = Date.now()): Promise<IngestResult> {
  const s = batch.session;
  const startedAt = new Date(Math.min(s.startedAt, now));
  return prisma.$transaction(async (tx) => {
    await tx.typingSession.createMany({
      data: [{
        id: s.id, learnerId: ctx.learnerId, classId: ctx.classId, moduleId: ctx.moduleId,
        letterSet: s.letterSet, pace: s.pace, scope: s.scope, hints: s.hints,
        gameVersion: s.gameVersion, measurementVersion: s.measurementVersion,
        startedAt, lastActivityAt: startedAt,
      }],
      skipDuplicates: true,
    });
    await tx.$queryRaw`SELECT 1 FROM "TypingSession" WHERE id = ${s.id} FOR UPDATE`;
    const row = await tx.typingSession.findUniqueOrThrow({ where: { id: s.id } });

    // A session id belongs to one learner, class, and set of practice settings.
    if (row.learnerId !== ctx.learnerId || row.classId !== ctx.classId) {
      return { ok: false as const, status: 409, error: "This practice session belongs to someone else." };
    }
    if (row.letterSet !== s.letterSet || row.pace !== s.pace || row.scope !== s.scope || row.hints !== s.hints) {
      return { ok: false as const, status: 409, error: "Practice settings changed mid-session." };
    }
    if (row.eventsPurgedAt) return { ok: false as const, status: 410, error: "This session is closed." };

    const stored = await tx.typingEvent.findMany({ where: { sessionId: s.id }, select: { id: true, seq: true, type: true, t: true, data: true } });
    const plan = planInsert(batch.events, stored);
    if (!plan.ok) return { ok: false as const, status: 409, error: plan.error };

    // Merge and check the whole timeline: times never go backwards by seq.
    const merged = [
      ...stored.map((e) => ({ seq: e.seq, t: e.t, ...(JSON.parse(e.data) as object), type: e.type }) as EventData & { seq: number; t: number; at?: number }),
      ...plan.fresh,
    ].sort((a, b) => a.seq - b.seq);
    for (let i = 1; i < merged.length; i++) {
      if (merged[i].t < merged[i - 1].t) return { ok: false as const, status: 400, error: "Event times go backwards." };
    }
    if (merged.length && merged[0].seq === 0 && merged[0].type !== "session_start") {
      return { ok: false as const, status: 400, error: "A session's first event must be session_start." };
    }

    if (plan.fresh.length) {
      await tx.typingEvent.createMany({
        data: plan.fresh.map(({ id, seq, t, type, ...data }) => ({ id, sessionId: s.id, seq, t, type, data: JSON.stringify(data) })),
      });
    }

    const summary = summarizeSession(merged);
    const prevSummary = JSON.parse(row.summaryJson) as Partial<SessionSummary & { ignored: Record<string, number> }>;
    const ignored = Object.fromEntries(
      Object.entries(batch.ignored).map(([k, v]) => [k, Math.max(v, prevSummary.ignored?.[k] ?? 0)]),
    );
    const first = merged.find((e) => e.type === "session_start");
    const end = merged.find((e) => e.type === "end") as (EventData & { type: "end"; t: number; at?: number }) | undefined;
    // Wall-clock time of an event: the device's `at` (clamped to the session
    // and to now), else start + session clock for events without one.
    const start = row.startedAt.getTime();
    const wall = (e: { t: number; at?: number }) => new Date(Math.max(start, Math.min(e.at ?? start + e.t, now)));
    const lastWall = merged.length ? wall(merged[merged.length - 1]) : row.startedAt;
    const total = (k: "attempts" | "correct" | "timeouts" | "wordsCompleted" | "responseMs" | "idleMs") =>
      summary.phases.letter[k] + summary.phases.word[k];

    await tx.typingSession.update({
      where: { id: s.id },
      data: {
        lastSeq: merged.length ? merged[merged.length - 1].seq : -1,
        lastActivityAt: lastWall > row.lastActivityAt ? lastWall : row.lastActivityAt,
        startLeap: first && first.type === "session_start" ? first.leap : row.startLeap,
        furthestLeap: summary.furthestLeap,
        status: end ? (end.reason === "completed" ? "COMPLETED" : "ENDED_EARLY") : row.status,
        endReason: end ? end.reason : row.endReason,
        endedAt: end ? wall(end) : row.endedAt,
        inputMethod: inputMethodOf(summary),
        // Client clocks are cumulative; never let a stale retry move them back.
        activeMs: Math.max(row.activeMs, batch.clocks.activeMs),
        pauseMs: Math.max(row.pauseMs, batch.clocks.pauseMs),
        animationMs: Math.max(row.animationMs, batch.clocks.animationMs),
        hiddenMs: Math.max(row.hiddenMs, batch.clocks.hiddenMs),
        responseMs: total("responseMs"),
        idleMs: total("idleMs"),
        attempts: total("attempts"),
        correct: total("correct"),
        timeouts: total("timeouts"),
        wordsCompleted: total("wordsCompleted"),
        summaryJson: JSON.stringify({ ...summary, ignored }),
      },
    });
    const lastSeq = merged.length ? merged[merged.length - 1].seq : -1;
    return { ok: true as const, lastSeq, accepted: plan.fresh.length, duplicates: batch.events.length - plan.fresh.length };
  });
}
