import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { transcribeAudio } from "@/lib/gemini";
import { recomputeEvidenceCriteria, evaluateModule, assembleProjectIfComplete } from "@/lib/completion";

// Evidence capture (PRD §10): typed text, photo, or audio.
// Photos/audio arrive as data URLs and are stored inline for the MVP — a real
// deployment would put them in object storage and keep only the URL here.
// Audio is transcribed via Gemini so it can also satisfy text-based criteria.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await req.json();
  const moduleId = String(body.moduleId || "");
  if (!moduleId) return NextResponse.json({ error: "Missing module." }, { status: 400 });

  const type = String(body.type || "TEXT").toUpperCase();
  if (!["TEXT", "AUDIO", "PHOTO", "FILE"].includes(type)) {
    return NextResponse.json({ error: "Unknown evidence type." }, { status: 400 });
  }

  const criterionId = body.criterionId ? String(body.criterionId) : null;
  const caption = body.caption ? String(body.caption).slice(0, 280) : null;
  let text: string | null = body.text ? String(body.text) : null;
  const url: string | null = body.dataUrl ? String(body.dataUrl) : null;
  let aiUsed = false;

  // Uploads are compressed client-side; anything still over ~4 MB would fail
  // at the platform's request cap anyway — reject with a message kids can act on.
  if (url && url.length > 4_000_000) {
    return NextResponse.json(
      { error: "That file is too large. Try taking the photo again — it shrinks automatically." },
      { status: 413 },
    );
  }

  // Transcribe audio so it can be read and assessed like text.
  if (type === "AUDIO" && body.dataBase64 && body.mimeType) {
    const { transcript, aiUsed: used } = await transcribeAudio(
      String(body.dataBase64),
      String(body.mimeType),
    );
    if (transcript) text = transcript;
    aiUsed = used;
  }

  if (type === "TEXT" && !text?.trim()) {
    return NextResponse.json({ error: "Empty text evidence." }, { status: 400 });
  }
  if ((type === "PHOTO" || type === "FILE") && !url) {
    return NextResponse.json({ error: "Missing file." }, { status: 400 });
  }

  const created = await prisma.evidence.create({
    data: { learnerId: session.learnerId, moduleId, criterionId, type, text, url, caption },
  });

  // Evidence-backed criteria are recomputed, then we try to finish the module.
  await recomputeEvidenceCriteria(session.learnerId, moduleId);
  const result = await assembleProjectIfComplete(session.learnerId, moduleId);
  const { criteria, complete } = await evaluateModule(session.learnerId, moduleId);

  return NextResponse.json({
    ok: true,
    aiUsed,
    criteria,
    complete,
    project: result.complete ? result.project : null,
    evidence: { id: created.id, type: created.type, url: created.url, text: created.text, caption: created.caption },
  });
}

// Lets a learner remove a wrongly-picked upload (e.g. the wrong file from
// Finder) so they can immediately retake/reselect. Recomputes criteria the
// same way POST does, so an undone checkpoint re-gates "Next" correctly.
export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "Missing evidence id." }, { status: 400 });

  const existing = await prisma.evidence.findUnique({ where: { id } });
  if (!existing || existing.learnerId !== session.learnerId) {
    return NextResponse.json({ error: "Evidence not found." }, { status: 404 });
  }

  await prisma.evidence.delete({ where: { id } });

  await recomputeEvidenceCriteria(existing.learnerId, existing.moduleId);
  const { criteria, complete } = await evaluateModule(existing.learnerId, existing.moduleId);

  return NextResponse.json({ ok: true, criteria, complete });
}
