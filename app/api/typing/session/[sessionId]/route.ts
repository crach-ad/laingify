import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, verifiedSignIn } from "@/lib/session";
import { toSessionRow } from "@/lib/typing-data";
import { learnerFeedback, sessionState } from "@/lib/typing-report";

// The signed-in learner's own session: what the game needs to resume a climb,
// and the after-session feedback. Nobody else's sessions are readable here.
export async function GET(_req: Request, ctx: RouteContext<"/api/typing/session/[sessionId]">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  // A name-only sign-in proves nothing about who is reading.
  if (!verifiedSignIn(session)) return NextResponse.json({ error: "Sign in with your PIN." }, { status: 403 });
  const { sessionId } = await ctx.params;
  const row = await prisma.typingSession.findUnique({ where: { id: sessionId } });
  const onRoster = await prisma.rosterEntry.findUnique({ where: { classId_learnerId: { classId: session.classId, learnerId: session.learnerId } } });
  if (!row || !onRoster || row.learnerId !== session.learnerId || row.classId !== session.classId) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const s = toSessionRow(row);
  const last = await prisma.typingEvent.findFirst({ where: { sessionId }, orderBy: { seq: "desc" }, select: { t: true } });
  const previous = (
    await prisma.typingSession.findMany({
      where: { learnerId: row.learnerId, classId: row.classId, startedAt: { lt: row.startedAt } },
      orderBy: { startedAt: "desc" },
      take: 20,
    })
  ).map(toSessionRow);
  return NextResponse.json(
    {
      id: s.id,
      state: sessionState(s),
      settings: { letterSet: s.letterSet, pace: s.pace, scope: s.scope },
      startedAt: row.startedAt.getTime(),
      lastSeq: row.lastSeq,
      lastT: last?.t ?? 0,
      // What the game shows, for resuming: its "attempts" include timeouts.
      resume: {
        leap: s.summary.furthestLeap,
        correct: row.correct,
        attempts: row.attempts + row.timeouts,
        streak: s.summary.streak,
        bestStreak: s.summary.bestStreak,
        clocks: { activeMs: row.activeMs, pauseMs: row.pauseMs, animationMs: row.animationMs, hiddenMs: row.hiddenMs },
      },
      feedback: learnerFeedback(s, previous),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
