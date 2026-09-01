import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isSpriteStyleKey } from "@/lib/dicebear";

function safeTraitsJson(value: unknown, maxLen: number): string {
  if (!value || typeof value !== "object") return "{}";
  const json = JSON.stringify(value);
  return json.length > maxLen ? "{}" : json;
}

// Learner names & designs their Sprite; it persists across all classes (PRD §8).
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { name, personality, color, avatar, avatarStyle, avatarSeed, avatarTraits, avatarColors } =
    await req.json();
  const data = {
    name: String(name || "Sprite").slice(0, 40),
    personality: String(personality || "friendly").slice(0, 40),
    color: String(color || "#7c5cff").slice(0, 20),
    avatar: String(avatar || "✨").slice(0, 8),
    avatarStyle: isSpriteStyleKey(avatarStyle) ? avatarStyle : null,
    avatarSeed: avatarSeed ? String(avatarSeed).slice(0, 40) : null,
    avatarTraits: safeTraitsJson(avatarTraits, 4000),
    avatarColors: safeTraitsJson(avatarColors, 4000),
  };

  const sprite = await prisma.sprite.upsert({
    where: { learnerId: session.learnerId },
    create: { learnerId: session.learnerId, ...data },
    update: data,
  });

  return NextResponse.json({ sprite });
}
