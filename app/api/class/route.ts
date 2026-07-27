import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Class lookup for the join screen: given a class code, return the public
// info the learner needs to pick their name and (if required) enter a PIN.
// Never returns PINs or anything sensitive (PRD §7, §11).
export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("code");
  if (!code) return NextResponse.json({ error: "Missing class code." }, { status: 400 });

  const klass = await prisma.class.findUnique({
    where: { classCode: code.toUpperCase() },
    include: {
      org: { select: { name: true, context: true } },
      roster: {
        include: { learner: { select: { id: true, displayName: true } } },
        orderBy: { learner: { displayName: "asc" } },
      },
    },
  });
  if (!klass) return NextResponse.json({ error: "Unknown class code." }, { status: 404 });

  // Tier 0 = open self-registration: learners create a profile (name + selfie)
  // and come back by re-entering their name, so the roster is never listed.
  const selfRegister = klass.minAuthTier === 0;

  return NextResponse.json({
    class: {
      id: klass.id,
      name: klass.name,
      band: klass.band,
      minAuthTier: klass.minAuthTier,
      selfRegister,
      orgName: klass.org.name,
      context: klass.org.context,
    },
    roster: selfRegister
      ? []
      : klass.roster.map((r) => ({
          learnerId: r.learner.id,
          displayName: r.learner.displayName,
        })),
  });
}
