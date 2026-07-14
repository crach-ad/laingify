import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { spriteReply, type Band } from "@/lib/gemini";

// Help Sprite — first line of help, insight only (PRD §8).
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { moduleId, message, history } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: "Empty message." }, { status: 400 });

  const [learner, klass, module] = await Promise.all([
    prisma.learner.findUnique({ where: { id: session.learnerId }, include: { sprite: true } }),
    prisma.class.findUnique({ where: { id: session.classId } }),
    moduleId ? prisma.module.findUnique({ where: { id: moduleId } }) : Promise.resolve(null),
  ]);
  if (!learner) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  // Sprite persists across all classes; create a default on first use.
  let sprite = learner.sprite;
  if (!sprite) {
    sprite = await prisma.sprite.create({ data: { learnerId: learner.id } });
  }

  const band = (klass?.band ?? learner.band) as Band;

  const result = await spriteReply({
    spriteName: sprite.name,
    personality: sprite.personality,
    band,
    moduleTitle: module?.title ?? "your studies",
    moduleSummary: module?.summary ?? "",
    activity: "working through the module",
    history: Array.isArray(history)
      ? history
          .slice(-8)
          .map((h: { role: string; text: string }) => ({
            role: h.role === "model" ? ("model" as const) : ("user" as const),
            text: String(h.text || ""),
          }))
      : [],
    message: String(message),
  });

  // Log for analytics (PRD §8, §13).
  await prisma.spriteInteraction.create({
    data: {
      learnerId: learner.id,
      moduleId: moduleId || "",
      userMessage: String(message),
      spriteReply: result.reply,
      answerSeeking: result.answerSeeking,
    },
  });

  return NextResponse.json({
    reply: result.reply,
    answerSeeking: result.answerSeeking,
    aiUsed: result.aiUsed,
  });
}
