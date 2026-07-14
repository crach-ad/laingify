// Server-side helper for instructor-facing pages: resolves the instructor
// session into the instructor and their org, or sends them to /instruct/login.
// (Cookie session is not a security boundary — see lib/session.ts / PRD §11.)

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getInstructorSession } from "@/lib/session";

// Non-redirecting variant for API routes: instructor or null.
export async function getInstructor() {
  const session = await getInstructorSession();
  if (!session) return null;
  return prisma.instructor.findUnique({
    where: { id: session.instructorId },
    include: { org: true },
  });
}

export async function requireInstructor() {
  const session = await getInstructorSession();
  if (!session) redirect("/instruct/login");

  const instructor = await prisma.instructor.findUnique({
    where: { id: session.instructorId },
    include: { org: true },
  });
  if (!instructor) redirect("/instruct/login");

  return { instructor, org: instructor.org };
}
