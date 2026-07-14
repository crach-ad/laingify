import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { spriteReply, type Band } from "@/lib/gemini";

// Discussion threads (PRD §9). A thread can be opened straight from a piece of
// auto-feedback (its `seed`). The Sprite is the first responder — insight only,
// never answers — and an instructor can step in later (authorRole INSTRUCTOR).
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await req.json();
  const message = String(body.message || "").trim();
  if (!message) return NextResponse.json({ error: "Empty message." }, { status: 400 });

  const [learner, klass] = await Promise.all([
    prisma.learner.findUnique({ where: { id: session.learnerId }, include: { sprite: true } }),
    prisma.class.findUnique({ where: { id: session.classId } }),
  ]);
  if (!learner) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  // Find or create the thread.
  let thread = body.threadId
    ? await prisma.discussionThread.findFirst({
        where: { id: String(body.threadId), learnerId: learner.id },
      })
    : null;
  if (!thread) {
    const moduleId = String(body.moduleId || "");
    if (!moduleId) return NextResponse.json({ error: "Missing module." }, { status: 400 });
    thread = await prisma.discussionThread.create({
      data: { learnerId: learner.id, moduleId, seed: body.seed ? String(body.seed) : null },
    });
  }

  await prisma.message.create({
    data: { threadId: thread.id, authorRole: "LEARNER", body: message },
  });

  // Sprite responds with insight, never the answer.
  let sprite = learner.sprite;
  if (!sprite) sprite = await prisma.sprite.create({ data: { learnerId: learner.id } });

  const module = await prisma.module.findUnique({ where: { id: thread.moduleId } });
  const band = (klass?.band ?? learner.band) as Band;

  const prior = await prisma.message.findMany({
    where: { threadId: thread.id },
    orderBy: { createdAt: "asc" },
  });
  const history = prior
    .filter((m) => m.authorRole !== "INSTRUCTOR")
    .slice(-8)
    .map((m) => ({ role: m.authorRole === "LEARNER" ? ("user" as const) : ("model" as const), text: m.body }));

  const result = await spriteReply({
    spriteName: sprite.name,
    personality: sprite.personality,
    band,
    moduleTitle: module?.title ?? "your studies",
    moduleSummary: module?.summary ?? "",
    activity: thread.seed ? `discussing this feedback: ${thread.seed}` : "a discussion thread",
    history: history.slice(0, -1), // exclude the just-added learner message; spriteReply appends it
    message,
  });

  await prisma.message.create({
    data: { threadId: thread.id, authorRole: "SPRITE", body: result.reply },
  });
  await prisma.spriteInteraction.create({
    data: {
      learnerId: learner.id,
      moduleId: thread.moduleId,
      userMessage: message,
      spriteReply: result.reply,
      answerSeeking: result.answerSeeking,
    },
  });

  const messages = await prisma.message.findMany({
    where: { threadId: thread.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, authorRole: true, body: true, createdAt: true },
  });

  return NextResponse.json({ ok: true, threadId: thread.id, messages, aiUsed: result.aiUsed });
}
