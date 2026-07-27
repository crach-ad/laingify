import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { setSession } from "@/lib/session";

// Class code + name onboarding with tiered identity (PRD §7, §11).
// Tier 0 classes use open self-registration: a learner creates a profile by
// typing their name (selfie follows on the dashboard) and signs back in later
// with class code + the same name. Tier 1+ classes use the seeded roster.
export async function POST(req: Request) {
  const body = await req.json();
  const { classCode, learnerId, pin } = body;

  const klass = await prisma.class.findUnique({
    where: { classCode: String(classCode || "").toUpperCase() },
  });
  if (!klass) return NextResponse.json({ error: "Unknown class code." }, { status: 404 });

  if (klass.minAuthTier === 0) {
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
      await setSession({ learnerId: learner.id, classId: klass.id });
      return NextResponse.json({ ok: true, created: true });
    }

    if (!existing) {
      return NextResponse.json(
        { error: "We couldn't find that name in this class. Check the spelling, or tap \"I'm new here\" to create your profile." },
        { status: 404 },
      );
    }
    await setSession({ learnerId: existing.learnerId, classId: klass.id });
    return NextResponse.json({ ok: true });
  }

  const entry = await prisma.rosterEntry.findFirst({
    where: { classId: klass.id, learnerId: String(learnerId || "") },
    include: { learner: true },
  });
  if (!entry) return NextResponse.json({ error: "Name not on this roster." }, { status: 404 });

  // Tier 1: PIN required and must match.
  if (klass.minAuthTier >= 1) {
    if (!pin || entry.learner.pin !== String(pin)) {
      return NextResponse.json({ error: "Incorrect PIN." }, { status: 401 });
    }
  }
  // Tier 2 (corporate/account) is represented here as name selection; a real
  // deployment would require email/SSO (PRD §11). Left as a documented gap.

  await setSession({ learnerId: entry.learnerId, classId: klass.id });
  return NextResponse.json({ ok: true });
}
