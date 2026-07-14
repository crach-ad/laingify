import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

// Learner names & designs their Sprite; it persists across all classes (PRD §8).
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { name, personality, color, avatar } = await req.json();
  const data = {
    name: String(name || "Sprite").slice(0, 40),
    personality: String(personality || "friendly").slice(0, 40),
    color: String(color || "#7c5cff").slice(0, 20),
    avatar: String(avatar || "✨").slice(0, 8),
  };

  const sprite = await prisma.sprite.upsert({
    where: { learnerId: session.learnerId },
    create: { learnerId: session.learnerId, ...data },
    update: data,
  });

  return NextResponse.json({ sprite });
}
