import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getInstructor } from "@/lib/instructor";
import { attendanceRegister, moduleFunnel, timeFit } from "@/lib/insights";

// CSV escape hatch: any analysis we didn't predict, the teacher does in
// Sheets. ?what=engagement | funnel | times
//
// engagement: learner × week activity grid (from the attendance register)
// funnel:     module × funnel stages + median minutes
// times:      per-learner per-module time on task (minutes)

const csvCell = (v: unknown) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = (rows: unknown[][]) => rows.map((r) => r.map(csvCell).join(",")).join("\n") + "\n";

export async function GET(req: Request, ctx: RouteContext<"/instruct/class/[classId]/export">) {
  const auth = await getInstructor();
  if (!auth) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { classId } = await ctx.params;
  const klass = await prisma.class.findUnique({ where: { id: classId } });
  if (!klass || !auth.orgIds.includes(klass.orgId)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const what = new URL(req.url).searchParams.get("what") ?? "engagement";
  let rows: unknown[][];

  if (what === "funnel") {
    const funnel = await moduleFunnel(classId);
    rows = [
      ["module", "topic", "started", "evidence_in", "wrapup_in", "badge", "median_minutes"],
      ...funnel.map((f) => [f.title, f.topic, f.started, f.someEvidence, f.wrapUp, f.badge, f.medianMinutes ?? ""]),
    ];
  } else if (what === "times") {
    const roster = await prisma.rosterEntry.findMany({
      where: { classId },
      include: { learner: { select: { id: true, displayName: true } } },
    });
    const nameOf = new Map(roster.map((r) => [r.learnerId, r.learner.displayName]));
    const progress = await prisma.moduleProgress.findMany({
      where: { learnerId: { in: roster.map((r) => r.learnerId) } },
      include: { module: { select: { title: true } } },
    });
    rows = [
      ["learner", "module", "status", "minutes_on_task", "started_at", "completed_at"],
      ...progress.map((p) => [
        nameOf.get(p.learnerId) ?? p.learnerId,
        p.module.title,
        p.status,
        Math.round(p.timeOnTaskSeconds / 60),
        p.startedAt.toISOString(),
        p.completedAt?.toISOString() ?? "",
      ]),
    ];
  } else {
    const reg = await attendanceRegister(classId, 12);
    rows = [
      ["learner", "joined_week", "active_weeks", ...reg.weekKeys],
      ...reg.cohorts.flatMap((c) =>
        c.rows.map((r) => [r.displayName, r.joinedWeek, r.activeWeeks, ...r.weeks.map((w) => (w ? 1 : 0))]),
      ),
    ];
  }

  return new NextResponse(csv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${klass.classCode}-${what}.csv"`,
    },
  });
}
