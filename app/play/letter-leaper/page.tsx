import Link from "next/link";
import { notFound } from "next/navigation";
import { requireLearner } from "@/lib/learner";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { issueTicket, learnerKey, practiceContext, teacherSettings } from "@/lib/typing-access";
import { toSessionRow } from "@/lib/typing-data";
import { phaseMetrics, poolPhases } from "@/lib/typing-metrics";
import { PACE_LABEL, SCOPE_LABEL, SET_LABEL, resumableSession, sessionState } from "@/lib/typing-report";
import { day, encodeCfg, num, pct } from "@/lib/typing-format";

export const metadata = {
  title: "Letter Leaper — Moonbound | laingify",
  description: "Practice typing through six terrains, from the jungle to the moon and stars.",
};

// Class play: the teacher's practice settings, this learner's own recent
// progress, and the game. Every player on the roster gets the teacher's
// settings; only verified sign-ins (PIN, NFC tag, or the device they
// registered on — see lib/session.ts) also get tracking credentials, so
// name-only players follow the practice but nothing is recorded or shown.
export default async function LetterLeaperPage() {
  await requireLearner();
  const ctx = await practiceContext(await getSession());
  if (!ctx) notFound();
  const settings = await teacherSettings(ctx.classId);

  // Progress is only shown to verified sign-ins: anyone can type a classmate's
  // name in an open class.
  const rows = !ctx.verified ? [] : (
    await prisma.typingSession.findMany({
      where: { learnerId: ctx.learnerId, classId: ctx.classId },
      orderBy: { startedAt: "desc" },
      take: 6,
    })
  ).map(toSessionRow);
  const resumable = resumableSession(rows, settings);

  // Practice configuration for everyone; tracking credentials only when verified.
  const tracking = ctx.verified
    ? { ticket: issueTicket({ l: ctx.learnerId, c: ctx.classId, m: ctx.moduleId }), k: learnerKey(ctx.learnerId, ctx.classId), resume: resumable?.id ?? null }
    : {};
  const cfg = settings || ctx.verified ? encodeCfg({ settings, ...tracking }) : null;
  const src = `/games/letter-leaper/index.html${cfg ? `#cfg=${cfg}` : ""}`;

  return (
    <main className="mx-auto w-full max-w-[1440px] flex-1 px-3 py-4 sm:px-6">
      <Link href={`/learn/${ctx.moduleId}`} className="muted text-sm">
        ← Back to your Letter Leaper module
      </Link>

      <section className="mt-4 grid gap-3 lg:grid-cols-[1fr_1.4fr]">
        <div className="card p-5">
          <div className="overline mb-2">Your practice</div>
          {settings ? (
            <>
              <h1 className="text-2xl font-semibold tracking-tight">{SCOPE_LABEL[settings.scope]}</h1>
              <p className="muted mt-1 text-sm">
                {settings.scope === "words" ? "Short words, whole keyboard" : SET_LABEL[settings.letterSet]} · {PACE_LABEL[settings.pace]} · set by your teacher
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold tracking-tight">{SCOPE_LABEL.full}</h1>
              <p className="muted mt-1 text-sm">Choose your letters and difficulty in the game.</p>
            </>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <a href="#game" className="btn-primary flex h-11 items-center px-5 text-sm">
              {resumable && ctx.verified ? "Resume your climb ↓" : "Start practising ↓"}
            </a>
            <a href={src} className="btn-ghost flex h-11 items-center px-4 text-sm">
              Open full page ↗
            </a>
          </div>
          {ctx.verified ? (
            <p className="muted mt-3 text-[13px]">Your practice saves to your learning record — even if you stop early.</p>
          ) : (
            <p className="mt-3 text-[13px]" style={{ color: "var(--warn)" }}>
              You can play, but your practice isn&apos;t being saved: saving needs a PIN sign-in. Ask your teacher for your PIN.
            </p>
          )}
        </div>

        <div className="card p-5">
          <div className="overline mb-2">Your recent progress</div>
          {!ctx.verified ? (
            <p className="muted text-sm">Sign in with your PIN to see your saved progress.</p>
          ) : rows.length === 0 ? (
            <p className="muted text-sm">No practice saved yet. Your sessions will show up here.</p>
          ) : (
            <ul className="flex flex-col gap-1.5 text-sm">
              {rows.slice(0, 5).map((r) => {
                const m = phaseMetrics(poolPhases([r.summary.phases.letter, r.summary.phases.word]));
                const letters = phaseMetrics(r.summary.phases.letter);
                return (
                  <li key={r.id} className="flex flex-wrap items-baseline justify-between gap-x-4">
                    <span>
                      <span className="font-medium">{day(r.startedAt)}</span>
                      <span className="muted"> · reached leap {r.summary.furthestLeap}</span>
                    </span>
                    <span className="mono-label">
                      {pct(m.accuracy)} accuracy
                      {letters.attempts >= 20 ? ` · ${num(letters.correctCpm)} letters/min` : ""}
                      {sessionState(r) === "completed" ? " · finished ✦" : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <iframe
        id="game"
        src={src}
        title="Letter Leaper: Moonbound typing adventure"
        className="mt-4 h-[1100px] w-full scroll-mt-4 rounded-xl border border-[var(--border-soft)] sm:h-[980px]"
        allow="fullscreen"
      />
    </main>
  );
}
