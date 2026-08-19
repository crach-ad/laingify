// Server-side helper for instructor-facing pages: resolves the instructor
// session into the instructor and the orgs they can see, or sends them to
// /instruct/login. An instructor has a home org plus any `accessOrgs` granted
// to them (one coach running several orgs sees all of them in one console).
// (Cookie session is not a security boundary — see lib/session.ts / PRD §11.)

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getInstructorSession } from "@/lib/session";

async function load(instructorId: string) {
  const instructor = await prisma.instructor.findUnique({
    where: { id: instructorId },
    include: { org: true, accessOrgs: true },
  });
  if (!instructor) return null;
  const orgs = [instructor.org, ...instructor.accessOrgs.filter((o) => o.id !== instructor.orgId)];
  return { instructor, org: instructor.org, orgs, orgIds: orgs.map((o) => o.id) };
}

// Non-redirecting variant for API routes: null when not signed in.
export async function getInstructor() {
  const session = await getInstructorSession();
  if (!session) return null;
  return load(session.instructorId);
}

export async function requireInstructor() {
  const session = await getInstructorSession();
  if (!session) redirect("/instruct/login");
  const ctx = await load(session.instructorId);
  if (!ctx) redirect("/instruct/login");
  return ctx;
}
