import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { setInstructorSession } from "@/lib/session";

// Instructor sign-in: email + PIN (plaintext for MVP, same caveat as learners).
export async function POST(req: Request) {
  const { email, pin } = await req.json();

  const instructor = await prisma.instructor.findUnique({
    where: { email: String(email || "").trim().toLowerCase() },
  });
  if (!instructor || !pin || instructor.pin !== String(pin)) {
    return NextResponse.json({ error: "Email or PIN doesn't match." }, { status: 401 });
  }

  await setInstructorSession({ instructorId: instructor.id });
  return NextResponse.json({ ok: true });
}
