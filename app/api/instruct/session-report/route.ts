import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getInstructor } from "@/lib/instructor";
import { sessionReport, type SessionParticipant, type Band } from "@/lib/gemini";
import { renderSessionReportHtml, sessionReportFilename } from "@/lib/session-report-html";

// Session dates are calendar days, not timestamps — same UTC-midnight
// normalization as app/api/instruct/attendance/route.ts, so a report for a
// given date lines up with that date's AttendanceRecord rows.
function parseDateOnly(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

const DATE_LABEL = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
const EXCERPT_MAX = 160;

// Instructor-triggered stakeholder/funder report for one class session:
// combines the instructor's own description of the lesson with that date's
// attendance, badges earned, and submissions written, then asks Gemini
// (lib/gemini.ts's sessionReport()) to write a short grounded narrative
// around it. GET + query params (not POST) so the result can be opened
// directly in a new tab and printed to PDF, same as the portfolio downloads.
export async function GET(req: Request) {
  const auth = await getInstructor();
  if (!auth) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classId = String(searchParams.get("classId") || "");
  const date = parseDateOnly(String(searchParams.get("date") || ""));
  const lessonDescription = String(searchParams.get("lessonDescription") || "").trim();
  if (!classId || !date) return NextResponse.json({ error: "Missing class or date." }, { status: 400 });
  if (lessonDescription.length < 10)
    return NextResponse.json({ error: "Please describe the session in a bit more detail." }, { status: 400 });

  const klass = await prisma.class.findUnique({ where: { id: classId }, include: { org: true } });
  if (!klass || !auth.orgIds.includes(klass.orgId)) return NextResponse.json({ error: "Class not found." }, { status: 404 });

  const roster = await prisma.rosterEntry.findMany({
    where: { classId },
    include: { learner: { select: { id: true, displayName: true } } },
    orderBy: { learner: { displayName: "asc" } },
  });
  const learnerIds = roster.map((r) => r.learnerId);
  const dayEnd = new Date(date.getTime() + 24 * 60 * 60 * 1000);
  const dayWindow = { gte: date, lt: dayEnd };

  const [attendance, activeEvents, projects, submissions, photos] = await Promise.all([
    prisma.attendanceRecord.findMany({ where: { classId, date } }),
    prisma.learnerEvent.findMany({
      where: { learnerId: { in: learnerIds }, createdAt: dayWindow },
      select: { learnerId: true },
      distinct: ["learnerId"],
    }),
    prisma.project.findMany({ where: { learnerId: { in: learnerIds }, createdAt: dayWindow } }),
    prisma.submission.findMany({ where: { learnerId: { in: learnerIds }, createdAt: dayWindow }, orderBy: { createdAt: "asc" } }),
    prisma.evidence.findMany({
      where: { learnerId: { in: learnerIds }, type: "PHOTO", createdAt: dayWindow },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const moduleIds = [...new Set(projects.map((p) => p.moduleId))];
  const modules = moduleIds.length
    ? await prisma.module.findMany({ where: { id: { in: moduleIds } }, select: { id: true, badgeName: true } })
    : [];
  const badgeNameByModule = new Map(modules.map((m) => [m.id, m.badgeName]));

  const attendanceByLearner = new Map(attendance.map((a) => [a.learnerId, a.status]));
  const activeToday = new Set(activeEvents.map((e) => e.learnerId));
  const attendanceTaken = attendance.length > 0;

  const participants: SessionParticipant[] = roster.map((r) => ({
    displayName: r.learner.displayName,
    attendanceStatus: attendanceByLearner.get(r.learnerId) ?? null,
    badgesToday: projects
      .filter((p) => p.learnerId === r.learnerId)
      .map((p) => badgeNameByModule.get(p.moduleId))
      .filter((n): n is string => Boolean(n)),
    submissionExcerpts: submissions
      .filter((s) => s.learnerId === r.learnerId)
      .slice(0, 1)
      .map((s) => (s.content.length > EXCERPT_MAX ? s.content.slice(0, EXCERPT_MAX) + "…" : s.content)),
  }));

  const presentCount = attendanceTaken
    ? participants.filter((p) => p.attendanceStatus === "PRESENT" || p.attendanceStatus === "LATE").length
    : activeToday.size;
  const totals = {
    present: presentCount,
    badgesEarned: projects.length,
    submissions: submissions.length,
  };

  // One photo per learner (their earliest that day) paired with their own
  // reflection, if they wrote one — the visual "highlights" section. Only
  // learners who actually captured a photo that day appear here.
  const firstSubmissionByLearner = new Map<string, string>();
  for (const s of submissions) {
    if (!firstSubmissionByLearner.has(s.learnerId)) firstSubmissionByLearner.set(s.learnerId, s.content);
  }
  const firstPhotoByLearner = new Map<string, string>();
  for (const p of photos) {
    if (p.url && !firstPhotoByLearner.has(p.learnerId)) firstPhotoByLearner.set(p.learnerId, p.url);
  }
  const highlights = roster
    .filter((r) => firstPhotoByLearner.has(r.learnerId))
    .map((r) => {
      const quote = firstSubmissionByLearner.get(r.learnerId);
      return {
        displayName: r.learner.displayName,
        photoUrl: firstPhotoByLearner.get(r.learnerId)!,
        quote: quote ? (quote.length > EXCERPT_MAX ? quote.slice(0, EXCERPT_MAX) + "…" : quote) : undefined,
      };
    });

  const band = (klass.band as Band) || "YOUTH";
  const dateLabel = DATE_LABEL.format(date);

  const { narrative, aiUsed } = await sessionReport({
    orgName: klass.org.name,
    className: klass.name,
    band,
    dateLabel,
    lessonDescription,
    participants,
    totals,
  });

  const html = renderSessionReportHtml({
    orgName: klass.org.name,
    className: klass.name,
    dateLabel,
    lessonDescription,
    narrative,
    aiUsed,
    preparedBy: auth.instructor.displayName,
    totals,
    highlights,
  });

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="${sessionReportFilename(klass.name, dateLabel)}"`,
    },
  });
}
