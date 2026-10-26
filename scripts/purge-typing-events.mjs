// Letter Leaper retention (docs/letter-leaper-progress.md → Retention).
//   Detailed TypingEvent rows: kept 180 days after the session started, then
//   deleted; the session keeps its summary and is stamped eventsPurgedAt.
//   TypingSession summaries: kept 3 years, then deleted.
//   SignInFailure rows (PIN lockout): only needed for 15 minutes; cleared after a day.
//   --learner <id>: delete ALL of one learner's typing sessions and events
//   (a deletion request). Their other Laingify work is untouched.
//
// Dry run (default) prints what would change; --apply makes the change.
//   node --env-file=.env scripts/purge-typing-events.mjs [--apply] [--learner <id>]
import { PrismaClient } from "@prisma/client";

const EVENT_DAYS = 180;
const SUMMARY_YEARS = 3;
const apply = process.argv.includes("--apply");
const learnerArg = process.argv.indexOf("--learner");
const learnerId = learnerArg > 0 ? process.argv[learnerArg + 1] : null;
const prisma = new PrismaClient();
const host = (process.env.DATABASE_URL ?? "").replace(/^.*@/, "").replace(/[/?].*$/, "");

try {
  console.log(`Database: ${host} · ${apply ? "APPLY" : "dry run"}`);
  if (learnerId) {
    const sessions = await prisma.typingSession.findMany({ where: { learnerId }, select: { id: true } });
    const events = await prisma.typingEvent.count({ where: { sessionId: { in: sessions.map((s) => s.id) } } });
    console.log(`Learner ${learnerId}: ${sessions.length} sessions, ${events} events to delete.`);
    if (apply) {
      await prisma.$transaction([
        prisma.typingEvent.deleteMany({ where: { sessionId: { in: sessions.map((s) => s.id) } } }),
        prisma.typingSession.deleteMany({ where: { learnerId } }),
      ]);
      console.log("Deleted.");
    }
  } else {
    const eventCutoff = new Date(Date.now() - EVENT_DAYS * 864e5);
    const summaryCutoff = new Date(Date.now() - SUMMARY_YEARS * 365 * 864e5);
    const oldSessions = await prisma.typingSession.findMany({ where: { startedAt: { lt: eventCutoff }, eventsPurgedAt: null }, select: { id: true } });
    const ids = oldSessions.map((s) => s.id);
    const events = await prisma.typingEvent.count({ where: { sessionId: { in: ids } } });
    const expired = await prisma.typingSession.count({ where: { startedAt: { lt: summaryCutoff } } });
    console.log(`Events older than ${EVENT_DAYS} days: ${events} in ${ids.length} sessions (summaries kept).`);
    console.log(`Session summaries older than ${SUMMARY_YEARS} years: ${expired}.`);
    const failures = await prisma.signInFailure.count({ where: { createdAt: { lt: new Date(Date.now() - 864e5) } } });
    console.log(`PIN-attempt records older than a day: ${failures}.`);
    if (apply) {
      await prisma.$transaction([
        prisma.typingEvent.deleteMany({ where: { sessionId: { in: ids } } }),
        prisma.typingSession.updateMany({ where: { id: { in: ids } }, data: { eventsPurgedAt: new Date() } }),
        prisma.typingEvent.deleteMany({ where: { session: { startedAt: { lt: summaryCutoff } } } }),
        prisma.typingSession.deleteMany({ where: { startedAt: { lt: summaryCutoff } } }),
        prisma.signInFailure.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 864e5) } } }),
      ]);
      console.log("Done.");
    }
  }
} finally {
  await prisma.$disconnect();
}
