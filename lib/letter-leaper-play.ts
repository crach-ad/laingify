import { prisma } from "@/lib/db";
import { issueTicket, learnerKey, teacherSettings, type PracticeContext } from "@/lib/typing-access";
import { toSessionRow } from "@/lib/typing-data";
import { resumableSession } from "@/lib/typing-report";
import { encodeCfg } from "@/lib/typing-format";


// What class play needs: the teacher's practice settings, this learner's own
// recent progress, and the game's address. Recognized student sessions,
// including name and roster sign-ins, receive tracking credentials.
export async function letterLeaperPlay(ctx: PracticeContext) {
  const settings = await teacherSettings(ctx.classId);

  // Progress belongs to the learner and class in the signed session.
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
  return { settings, rows, resumable, src };
}
