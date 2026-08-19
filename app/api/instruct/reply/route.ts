import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getInstructor } from "@/lib/instructor";

// Instructor reply in a learner's discussion thread (authorRole INSTRUCTOR).
export async function POST(req: Request) {
  const auth = await getInstructor();
  if (!auth) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await req.json();
  const threadId = String(body.threadId || "");
  const message = String(body.message || "").trim();
  if (!threadId || !message) {
    return NextResponse.json({ error: "Missing thread or message." }, { status: 400 });
  }

  const thread = await prisma.discussionThread.findUnique({ where: { id: threadId } });
  if (!thread) return NextResponse.json({ error: "Thread not found." }, { status: 404 });

  // The thread's module must belong to one of this instructor's orgs.
  const module = await prisma.module.findUnique({ where: { id: thread.moduleId } });
  if (!module || !auth.orgIds.includes(module.orgId)) {
    return NextResponse.json({ error: "Thread not found." }, { status: 404 });
  }

  await prisma.message.create({
    data: { threadId: thread.id, authorRole: "INSTRUCTOR", body: message },
  });

  return NextResponse.json({ ok: true });
}
