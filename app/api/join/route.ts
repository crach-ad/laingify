import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { setSession } from "@/lib/session";

// Class code and name selection sign students in without a PIN.
// minAuthTier only controls whether a class permits self-registration.
export async function POST(req: Request) {
  const body = await req.json();
  const { classCode, learnerId } = body;

  const klass = await prisma.class.findUnique({
    where: { classCode: String(classCode || "").trim().toUpperCase() },
  });
  if (!klass) return NextResponse.json({ error: "Unknown class code." }, { status: 404 });

  if (klass.minAuthTier === 0 && !learnerId) {
    const name = String(body.name || "").trim().replace(/\s+/g, " ");
    if (name.length < 2 || name.length > 40) {
      return NextResponse.json({ error: "Please type your name (2–40 letters)." }, { status: 400 });
    }
    const entries = await prisma.rosterEntry.findMany({
      where: { classId: klass.id },
      include: { learner: true },
    });
    const existing = entries.find(
      (e) => e.learner.displayName.toLowerCase() === name.toLowerCase(),
    );

    if (body.create) {
      if (existing) {
        return NextResponse.json(
          { error: "That name is already taken in this class. If it's you, use \"I'm coming back\" — otherwise add your last initial (like \"Maya B\")." },
          { status: 409 },
        );
      }
      const learner = await prisma.learner.create({
        data: { displayName: name, band: klass.band },
      });
      await prisma.rosterEntry.create({
        data: { classId: klass.id, learnerId: learner.id },
      });
      await setSession({ learnerId: learner.id, classId: klass.id, via: "register" });
      return NextResponse.json({ ok: true, created: true });
    }

    if (!existing) {
      return NextResponse.json(
        { error: "We couldn't find that name in this class. Check the spelling, or tap \"I'm new here\" to create your profile." },
        { status: 404 },
      );
    }
    await setSession({ learnerId: existing.learnerId, classId: klass.id, via: "name" });
    return NextResponse.json({ ok: true });
  }

  const entry = await prisma.rosterEntry.findFirst({
    where: { classId: klass.id, learnerId: String(learnerId || "") },
    select: { learnerId: true },
  });
  if (!entry) return NextResponse.json({ error: "Name not on this roster." }, { status: 404 });

  // The selected learner must belong to this class; no PIN is required.
  await setSession({ learnerId: entry.learnerId, classId: klass.id, via: "roster" });
  return NextResponse.json({ ok: true });
}
