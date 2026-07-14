import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { autoFeedback, type Band } from "@/lib/gemini";
import { applyFeedbackToCriteria, evaluateModule, assembleProjectIfComplete } from "@/lib/completion";

// Text submission → formative auto-feedback → criteria update (PRD §9).
// Feedback judges only the text-based AUTO/HYBRID criteria; evidence-backed and
// instructor-only (RUBRIC) criteria are handled elsewhere.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await req.json();
  const moduleId = String(body.moduleId || "");
  const content = String(body.content || "").trim();
  if (!moduleId) return NextResponse.json({ error: "Missing module." }, { status: 400 });
  if (!content) return NextResponse.json({ error: "Empty submission." }, { status: 400 });

  const [klass, learner, module, allCriteria] = await Promise.all([
    prisma.class.findUnique({ where: { id: session.classId } }),
    prisma.learner.findUnique({ where: { id: session.learnerId } }),
    prisma.module.findUnique({ where: { id: moduleId } }),
    prisma.criterion.findMany({ where: { moduleId }, orderBy: { order: "asc" } }),
  ]);
  if (!module) return NextResponse.json({ error: "Unknown module." }, { status: 404 });

  const band = (klass?.band ?? learner?.band ?? "YOUTH") as Band;

  // Only the criteria a written answer can satisfy go to the assessor.
  const textCriteria = allCriteria.filter(
    (c) => !c.requiresEvidenceType && c.checkType !== "RUBRIC",
  );

  const submission = await prisma.submission.create({
    data: { learnerId: session.learnerId, moduleId, content },
  });

  const fb = await autoFeedback({
    band,
    moduleTitle: module.title,
    moduleSummary: module.summary,
    criteria: textCriteria.map((c) => ({ id: c.id, label: c.label, description: c.description })),
    submission: content,
  });

  await prisma.autoFeedback.create({
    data: {
      submissionId: submission.id,
      summary: fb.summary,
      metJson: JSON.stringify(fb.metIds),
      missingJson: JSON.stringify(fb.missingIds),
      nextSteps: fb.nextSteps,
    },
  });

  await applyFeedbackToCriteria(
    session.learnerId,
    fb.metIds,
    allCriteria.map((c) => ({
      id: c.id,
      checkType: c.checkType,
      requiresEvidenceType: c.requiresEvidenceType,
    })),
  );

  const result = await assembleProjectIfComplete(session.learnerId, moduleId);
  const { criteria, complete } = await evaluateModule(session.learnerId, moduleId);

  return NextResponse.json({
    ok: true,
    submissionId: submission.id,
    feedback: {
      summary: fb.summary,
      metIds: fb.metIds,
      missingIds: fb.missingIds,
      nextSteps: fb.nextSteps,
      aiUsed: fb.aiUsed,
    },
    criteria,
    complete,
    project: result.complete ? result.project : null,
  });
}
