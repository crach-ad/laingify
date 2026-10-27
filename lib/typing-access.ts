// Who may record and read Letter Leaper progress.
//
// Learners: identity comes only from the signed session cookie, re-checked
// against the current roster and the class's Letter Leaper assignment. The
// practice ticket (signed, embedded in the game page) binds queued uploads to
// the learner who produced them, so data from one learner can never be
// uploaded under another learner's sign-in on a shared device.
//
// Instructors: a class is visible when its org is one of theirs (home org or
// accessOrgs) — the same rule as the rest of the instructor console.

import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { getSession, verifiedSignIn, type Session } from "@/lib/session";
import { notFound } from "next/navigation";
import { getInstructor, requireInstructor } from "@/lib/instructor";
import { signToken, verifyToken } from "@/lib/signed-token";
import { paceOf, type LetterSet, type Pace, type Scope } from "@/lib/typing-events";

export const LETTER_LEAPER_TITLE = "Letter Leaper: Moonbound";
export const DEFAULT_SETTINGS = { letterSet: "all", pace: "easy", scope: "full" } as const;
export type PracticeSettings = { letterSet: LetterSet; pace: Pace; scope: Scope };

export type Ticket = { l: string; c: string; m: string };

// Opaque key for the game's local upload queue (not a secret). Per learner AND
// class: a learner on two rosters has two queues, each uploaded only with that
// class's ticket.
export const learnerKey = (learnerId: string, classId: string) =>
  createHash("sha256").update(`leaper:${learnerId}:${classId}`).digest("hex").slice(0, 16);

export const issueTicket = (t: Ticket) => signToken("leaper-ticket", t);
export const readTicket = (token: string) => {
  const t = verifyToken<Ticket>("leaper-ticket", token);
  return t && typeof t.l === "string" && typeof t.c === "string" && typeof t.m === "string" ? t : null;
};

export async function letterLeaperModuleId(classId: string, orgId: string) {
  const a = await prisma.classModule.findFirst({
    where: { classId, module: { orgId, title: LETTER_LEAPER_TITLE } },
    select: { moduleId: true },
  });
  return a?.moduleId ?? null;
}

// The practice the teacher has set, or null when they haven't (then players
// choose their own letters and difficulty, as in the original Windsor module).
// Settings saved under the old pace names read as the matching difficulty.
export async function teacherSettings(classId: string): Promise<PracticeSettings | null> {
  const a = await prisma.typingAssignment.findUnique({ where: { classId } });
  return a ? { letterSet: a.letterSet as LetterSet, pace: paceOf(a.pace), scope: a.scope as Scope } : null;
}

// Settings for the teacher's form: the saved ones, else the defaults.
export async function practiceSettings(classId: string): Promise<PracticeSettings> {
  return (await teacherSettings(classId)) ?? { ...DEFAULT_SETTINGS };
}

export type PracticeContext = {
  learnerId: string;
  classId: string;
  orgId: string;
  moduleId: string;
  // False for name-only sign-ins: they can play, but nothing is recorded.
  verified: boolean;
  session: Session;
};

// The signed-in learner's Letter Leaper context, or null when they aren't on
// a roster with the module assigned.
export async function practiceContext(session?: Session | null): Promise<PracticeContext | null> {
  const s = session === undefined ? await getSession() : session;
  if (!s) return null;
  const roster = await prisma.rosterEntry.findUnique({
    where: { classId_learnerId: { classId: s.classId, learnerId: s.learnerId } },
    select: { class: { select: { orgId: true } } },
  });
  if (!roster) return null;
  const moduleId = await letterLeaperModuleId(s.classId, roster.class.orgId);
  if (!moduleId) return null;
  return { learnerId: s.learnerId, classId: s.classId, orgId: roster.class.orgId, moduleId, verified: verifiedSignIn(s), session: s };
}

// The class, if the signed-in instructor may see it; otherwise null.
export async function instructorClass(classId: string) {
  const auth = await getInstructor();
  if (!auth) return null;
  const klass = await prisma.class.findUnique({ where: { id: classId }, include: { org: true } });
  if (!klass || !auth.orgIds.includes(klass.orgId)) return null;
  return { auth, klass };
}

// Pages: signed-out visitors go to sign in; other instructors get a 404.
export async function requireInstructorClass(classId: string) {
  await requireInstructor();
  return (await instructorClass(classId)) ?? notFound();
}

// A learner record is only visible through a class the learner is on.
export async function instructorLearner(classId: string, learnerId: string) {
  const ctx = await instructorClass(classId);
  if (!ctx) return null;
  const entry = await prisma.rosterEntry.findUnique({
    where: { classId_learnerId: { classId, learnerId } },
    include: { learner: true },
  });
  return entry ? { ...ctx, learner: entry.learner } : null;
}
