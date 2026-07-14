// Lightweight learner session via an HTTP-only cookie.
//
// NOTE: this is intentionally minimal for the MVP. The cookie just carries the
// learner + class ids; it is NOT a security boundary. PRD §11 describes the
// real tiered-identity model (open / PIN / account) that would replace this.

import { cookies } from "next/headers";

const COOKIE = "ll_session";
const INSTRUCTOR_COOKIE = "ll_instructor";

export type Session = { learnerId: string; classId: string };
export type InstructorSession = { instructorId: string };

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Session;
    if (parsed.learnerId && parsed.classId) return parsed;
    return null;
  } catch {
    return null;
  }
}

export async function setSession(session: Session) {
  const jar = await cookies();
  jar.set(COOKIE, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

// Instructor session lives in its own cookie so an instructor can stay signed
// in alongside a learner session on a shared machine.
export async function getInstructorSession(): Promise<InstructorSession | null> {
  const jar = await cookies();
  const raw = jar.get(INSTRUCTOR_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as InstructorSession;
    if (parsed.instructorId) return parsed;
    return null;
  } catch {
    return null;
  }
}

export async function setInstructorSession(session: InstructorSession) {
  const jar = await cookies();
  jar.set(INSTRUCTOR_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearInstructorSession() {
  const jar = await cookies();
  jar.delete(INSTRUCTOR_COOKIE);
}
