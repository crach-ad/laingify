import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { setSession } from "@/lib/session";

// Class code + name onboarding with tiered identity (PRD §7, §11).
export async function POST(req: Request) {
  const { classCode, learnerId, pin } = await req.json();

  const klass = await prisma.class.findUnique({
    where: { classCode: String(classCode || "").toUpperCase() },
  });
  if (!klass) return NextResponse.json({ error: "Unknown class code." }, { status: 404 });

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
