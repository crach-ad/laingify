// Learner and instructor sessions via HTTP-only cookies.
//
// Both cookies are HMAC-signed (lib/signed-token.ts), so their ids can't be
// forged or edited client-side. Unsigned cookies from before signing are
// ignored — those users sign in once more. The learner session also records
// how the learner signed in. Class-code/name and roster sign-ins are valid
// student sessions and can save progress, just like NFC and registration.

import { cookies } from "next/headers";
import { signToken, verifyToken } from "@/lib/signed-token";

const COOKIE = "ll_session";
const INSTRUCTOR_COOKIE = "ll_instructor";

// pin      — legacy session issued before PIN-free student sign-in
// nfc      — per-enrollment NFC tag token
// register — created their profile on this device (open classes)
// name     — typed an existing name (open classes): anyone can do this
// roster   — selected a name on the class roster
export type SignInMethod = "pin" | "nfc" | "register" | "name" | "roster";
export type Session = { learnerId: string; classId: string; via?: SignInMethod };
export type InstructorSession = { instructorId: string };

const COOKIE_OPTIONS = { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 } as const;

// Recognized student sign-in eligible to save progress. Callers still check
// roster membership and assignment; the session cookie remains HMAC-signed.
export function verifiedSignIn(session: Session | null): boolean {
  return !!session && (session.via === "pin" || session.via === "nfc" || session.via === "register" || session.via === "name" || session.via === "roster");
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const parsed = verifyToken<Session>("learner", jar.get(COOKIE)?.value);
  if (parsed && typeof parsed.learnerId === "string" && typeof parsed.classId === "string") return parsed;
  return null;
}

export async function setSession(session: Session) {
  const jar = await cookies();
  jar.set(COOKIE, signToken("learner", session), COOKIE_OPTIONS);
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

// Instructor session lives in its own cookie so an instructor can stay signed
// in alongside a learner session on a shared machine.
export async function getInstructorSession(): Promise<InstructorSession | null> {
  const jar = await cookies();
  const parsed = verifyToken<InstructorSession>("instructor", jar.get(INSTRUCTOR_COOKIE)?.value);
  if (parsed && typeof parsed.instructorId === "string") return parsed;
  return null;
}

export async function setInstructorSession(session: InstructorSession) {
  const jar = await cookies();
  jar.set(INSTRUCTOR_COOKIE, signToken("instructor", session), COOKIE_OPTIONS);
}

export async function clearInstructorSession() {
  const jar = await cookies();
  jar.delete(INSTRUCTOR_COOKIE);
}
