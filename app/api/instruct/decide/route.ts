import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getInstructor } from "@/lib/instructor";
import { setStatus, assembleProjectIfComplete } from "@/lib/completion";

// Instructor decision on a criterion (PRD §9): approve marks it MET, revoke
// drops it back to IN_PROGRESS. Either way the decision is attributed to the
// instructor, and approval may complete the module (project + badge).
export async function POST(req: Request) {
  const auth = await getInstructor();
  if (!auth) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await req.json();
  const learnerId = String(body.learnerId || "");
  const criterionId = String(body.criterionId || "");
  const met = Boolean(body.met);
  if (!learnerId || !criterionId) {
    return NextResponse.json({ error: "Missing learner or criterion." }, { status: 400 });
  }

  const criterion = await prisma.criterion.findUnique({
    where: { id: criterionId },
    include: { module: true },
  });
  if (!criterion || !auth.orgIds.includes(criterion.module.orgId)) {
    return NextResponse.json({ error: "Criterion not found." }, { status: 404 });
  }

  await setStatus(learnerId, criterionId, met ? "MET" : "IN_PROGRESS", "instructor");
  const result = await assembleProjectIfComplete(learnerId, criterion.moduleId);

  return NextResponse.json({ ok: true, complete: result.complete });
}
