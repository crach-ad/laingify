import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { autoFeedback, type Band } from "@/lib/gemini";
import { applyFeedbackToCriteria, evaluateModule, assembleProjectIfComplete } from "@/lib/completion";

import { lockReflection, reflectionSnapshot, ReflectionConflict } from "@/lib/reflection-rewrite";

// Text submission → formative auto-feedback → criteria update (PRD §9).
// Feedback judges only the text-based AUTO/HYBRID criteria; evidence-backed and
// instructor-only (RUBRIC) criteria are handled elsewhere.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
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

  const assignment = await prisma.classModule.findUnique({ where: { classId_moduleId: { classId: session.classId, moduleId } } });
  const enrollment = await prisma.rosterEntry.findUnique({ where: { classId_learnerId: { classId: session.classId, learnerId: session.learnerId } } });
  if (!klass || !learner || !assignment || !enrollment || module.orgId !== klass.orgId) return NextResponse.json({ error: "Module not assigned to your class." }, { status: 403 });
  const before = await prisma.$transaction(async db => {
    await lockReflection(db, session.learnerId, moduleId);
    return reflectionSnapshot(db, session.learnerId, moduleId);
  });
  if ((body.rewriteRequestId ?? null) !== (before.pending?.id ?? null)) return NextResponse.json({ error: "Your reflection status changed. Refresh the page before submitting." }, { status: 409 });

  const band = (klass?.band ?? learner?.band ?? "YOUTH") as Band;

  // Only the criteria a written answer can satisfy go to the assessor.
  const textCriteria = allCriteria.filter(
    (c) => !c.requiresEvidenceType && c.checkType !== "RUBRIC",
  );

  const fb = await autoFeedback({
    band,
    moduleTitle: module.title,
    moduleSummary: module.summary,
    criteria: textCriteria.map((c) => ({ id: c.id, label: c.label, description: c.description })),
    submission: content,
  });

  let submission;
  try {
    submission = await prisma.$transaction(async db => {
      await lockReflection(db, session.learnerId, moduleId);
      const current = await reflectionSnapshot(db, session.learnerId, moduleId);
      if ((current.latest?.id ?? null) !== (before.latest?.id ?? null) || (current.pending?.id ?? null) !== (before.pending?.id ?? null)) {
        throw new ReflectionConflict("Your reflection changed while feedback was being prepared. Refresh the page before submitting again.");
      }
      const saved = await db.submission.create({ data: { learnerId: session.learnerId, moduleId, content } });
      await db.autoFeedback.create({ data: { submissionId: saved.id, summary: fb.summary, metJson: JSON.stringify(fb.metIds), missingJson: JSON.stringify(fb.missingIds), nextSteps: fb.nextSteps } });
      await applyFeedbackToCriteria(session.learnerId, fb.metIds, allCriteria, db);
      if (current.pending) await db.reflectionRewriteRequest.update({ where: { id: current.pending.id }, data: { fulfilledAt: new Date(), replacementSubmissionId: saved.id } });
      return saved;
    });
  } catch (error) {
    if (error instanceof ReflectionConflict) return NextResponse.json({ error: error.message }, { status: 409 });
    console.error("Save reflection failed", error instanceof Error ? error.name : "Unknown");
    return NextResponse.json({ error: "Could not save your reflection. Please try again." }, { status: 500 });
  }

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
