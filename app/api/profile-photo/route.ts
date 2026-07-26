import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

// Portfolio photo for the signed-in learner (PRD-lite: stored as a data URL,
// like other MVP media). Opting out is remembered via photoSkipped so the
// learner is never nagged; either choice can be changed later by re-posting.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await req.json();

  if (body.skip === true) {
    await prisma.learner.update({
      where: { id: session.learnerId },
      data: { photoSkipped: true },
    });
    return NextResponse.json({ ok: true, skipped: true });
  }

  const dataUrl = String(body.dataUrl || "");
  if (!dataUrl.startsWith("data:image/")) {
    return NextResponse.json({ error: "Missing photo." }, { status: 400 });
  }
  await prisma.learner.update({
    where: { id: session.learnerId },
    data: { photoUrl: dataUrl, photoSkipped: false },
  });
  return NextResponse.json({ ok: true });
}
