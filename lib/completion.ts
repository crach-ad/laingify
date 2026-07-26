// Criteria evaluation + project assembly + badge award (PRD §9, §10).
//
// CriterionStatus is the single source of truth for "met". This module keeps it
// in sync after evidence/submissions, and assembles the Project (+ awards the
// completion badge) the moment all required criteria are met.

import { prisma } from "@/lib/db";

export type CritView = {
  id: string;
  label: string;
  description: string;
  checkType: string;
  required: boolean;
  requiresEvidenceType: string | null;
  status: string; // NOT_STARTED | IN_PROGRESS | MET
  decidedBy: string | null;
};

export async function setStatus(
  learnerId: string,
  criterionId: string,
  status: string,
  decidedBy: string,
) {
  await prisma.criterionStatus.upsert({
    where: { learnerId_criterionId: { learnerId, criterionId } },
    create: { learnerId, criterionId, status, decidedBy },
    update: { status, decidedBy },
  });
}

// Recompute every criterion that is satisfied by the presence of an evidence
// type. Evidence tagged with a criterionId only counts toward that criterion
// (checkpoint flows); untagged evidence counts toward any criterion of its
// type (the original behavior).
export async function recomputeEvidenceCriteria(learnerId: string, moduleId: string) {
  const criteria = await prisma.criterion.findMany({
    where: { moduleId, requiresEvidenceType: { not: null } },
  });
  if (criteria.length === 0) return;

  const evidence = await prisma.evidence.findMany({ where: { learnerId, moduleId } });

  for (const c of criteria) {
    const met = evidence.some(
      (e) =>
        e.type === c.requiresEvidenceType && (!e.criterionId || e.criterionId === c.id),
    );
    await setStatus(learnerId, c.id, met ? "MET" : "NOT_STARTED", "system");
  }
}

// Apply auto-feedback results to the text-based AUTO/HYBRID criteria.
export async function applyFeedbackToCriteria(
  learnerId: string,
  metIds: string[],
  allCriteria: { id: string; checkType: string; requiresEvidenceType: string | null }[],
) {
  const metSet = new Set(metIds);
  for (const c of allCriteria) {
    if (c.requiresEvidenceType) continue; // handled by evidence
    if (c.checkType === "RUBRIC") continue; // instructor only
    if (c.checkType === "AUTO") {
      if (metSet.has(c.id)) await setStatus(learnerId, c.id, "MET", "system");
      else await setStatus(learnerId, c.id, "IN_PROGRESS", "system");
    } else if (c.checkType === "HYBRID") {
      // Auto pre-screen: passing means "awaiting instructor confirmation".
      await setStatus(learnerId, c.id, metSet.has(c.id) ? "IN_PROGRESS" : "NOT_STARTED", "system");
    }
  }
}

// Build the full criterion view for a learner+module and whether it's complete.
export async function evaluateModule(learnerId: string, moduleId: string) {
  const criteria = await prisma.criterion.findMany({
    where: { moduleId },
    orderBy: { order: "asc" },
  });
  const statuses = await prisma.criterionStatus.findMany({
    where: { learnerId, criterionId: { in: criteria.map((c) => c.id) } },
  });
  const byCrit = new Map(statuses.map((s) => [s.criterionId, s]));

  const view: CritView[] = criteria.map((c) => {
    const s = byCrit.get(c.id);
    return {
      id: c.id,
      label: c.label,
      description: c.description,
      checkType: c.checkType,
      required: c.required,
      requiresEvidenceType: c.requiresEvidenceType,
      status: s?.status ?? "NOT_STARTED",
      decidedBy: s?.decidedBy ?? null,
    };
  });

  const complete = view.filter((c) => c.required).every((c) => c.status === "MET");
  return { criteria: view, complete };
}

// Assemble the project artifact + award the badge, idempotently.
export async function assembleProjectIfComplete(learnerId: string, moduleId: string) {
  const { criteria, complete } = await evaluateModule(learnerId, moduleId);
  if (!complete) return { complete: false as const };

  const existing = await prisma.project.findUnique({
    where: { learnerId_moduleId: { learnerId, moduleId } },
  });

  // Mark module progress completed regardless (badge award).
  await prisma.moduleProgress.upsert({
    where: { learnerId_moduleId: { learnerId, moduleId } },
    create: { learnerId, moduleId, status: "COMPLETED", completedAt: new Date() },
    update: { status: "COMPLETED", completedAt: new Date() },
  });

  if (existing) return { complete: true as const, project: existing };

  const [learner, module, evidence, submissions] = await Promise.all([
    prisma.learner.findUnique({ where: { id: learnerId } }),
    prisma.module.findUnique({ where: { id: moduleId } }),
    prisma.evidence.findMany({ where: { learnerId, moduleId }, orderBy: { createdAt: "asc" } }),
    prisma.submission.findMany({ where: { learnerId, moduleId }, orderBy: { createdAt: "asc" } }),
  ]);

  const summary = buildSummary({
    learnerName: learner?.displayName ?? "The learner",
    moduleTitle: module?.title ?? "this module",
    badgeName: module?.badgeName ?? "",
    criteria,
    evidenceCount: evidence.length,
    submissionCount: submissions.length,
  });

  const project = await prisma.project.create({
    data: {
      learnerId,
      moduleId,
      summary,
      evidenceJson: JSON.stringify(evidence.map((e) => e.id)),
    },
  });

  return { complete: true as const, project };
}

function buildSummary(p: {
  learnerName: string;
  moduleTitle: string;
  badgeName: string;
  criteria: CritView[];
  evidenceCount: number;
  submissionCount: number;
}): string {
  const metLabels = p.criteria.filter((c) => c.status === "MET").map((c) => c.label);
  return (
    `${p.learnerName} completed "${p.moduleTitle}" and earned the ${p.badgeName} badge. ` +
    `They demonstrated: ${metLabels.join("; ")}. ` +
    `This project assembles ${p.evidenceCount} piece(s) of evidence and ${p.submissionCount} submission(s) into a finished artifact.`
  );
}
