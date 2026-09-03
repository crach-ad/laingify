import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getInstructor } from "@/lib/instructor";

const STATUSES = ["PRESENT", "ABSENT", "LATE", "EXCUSED"];

// Session dates are calendar days, not timestamps — normalize to UTC midnight
// so the same string always lands on the same @@unique([classId, learnerId, date]) row.
function parseDateOnly(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function authorizedClass(orgIds: string[], classId: string) {
  const klass = await prisma.class.findUnique({ where: { id: classId } });
  if (!klass || !orgIds.includes(klass.orgId)) return null;
  return klass;
}

// Roster + that date's attendance, for the class's instructor console tab.
export async function GET(req: Request) {
  const auth = await getInstructor();
  if (!auth) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classId = String(searchParams.get("classId") || "");
  const date = parseDateOnly(String(searchParams.get("date") || ""));
  if (!classId || !date) return NextResponse.json({ error: "Missing class or date." }, { status: 400 });

  const klass = await authorizedClass(auth.orgIds, classId);
  if (!klass) return NextResponse.json({ error: "Class not found." }, { status: 404 });

  const roster = await prisma.rosterEntry.findMany({
    where: { classId },
    include: { learner: { select: { id: true, displayName: true, photoUrl: true } } },
    orderBy: { learner: { displayName: "asc" } },
  });
  const learnerIds = roster.map((r) => r.learnerId);
  const dayEnd = new Date(date.getTime() + 24 * 60 * 60 * 1000);

  const [records, activeEvents] = await Promise.all([
    prisma.attendanceRecord.findMany({ where: { classId, date } }),
    // Best-effort "logged in today" signal (from the fire-and-forget event
    // pipeline in lib/track.ts) — a hint to speed up marking, never the
    // source of truth: a learner can be in the room without generating an
    // event yet (hands-on/offline work), or log in without being present.
    prisma.learnerEvent.findMany({
      where: { learnerId: { in: learnerIds }, createdAt: { gte: date, lt: dayEnd } },
      select: { learnerId: true },
      distinct: ["learnerId"],
    }),
  ]);
  const byLearner = new Map(records.map((r) => [r.learnerId, r]));
  const activeToday = new Set(activeEvents.map((e) => e.learnerId));

  return NextResponse.json({
    roster: roster.map((r) => ({
      learnerId: r.learner.id,
      displayName: r.learner.displayName,
      photoUrl: r.learner.photoUrl,
      status: byLearner.get(r.learner.id)?.status ?? null,
      note: byLearner.get(r.learner.id)?.note ?? null,
      activeToday: activeToday.has(r.learner.id),
    })),
  });
}

// Bulk upsert — one save per date, keyed by [classId, learnerId, date] so
// re-saving the same day always updates instead of duplicating.
export async function POST(req: Request) {
  const auth = await getInstructor();
  if (!auth) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await req.json();
  const classId = String(body.classId || "");
  const date = parseDateOnly(String(body.date || ""));
  const records = Array.isArray(body.records) ? body.records : [];
  if (!classId || !date) return NextResponse.json({ error: "Missing class or date." }, { status: 400 });

  const klass = await authorizedClass(auth.orgIds, classId);
  if (!klass) return NextResponse.json({ error: "Class not found." }, { status: 404 });

  const rosterLearnerIds = new Set(
    (await prisma.rosterEntry.findMany({ where: { classId }, select: { learnerId: true } })).map(
      (r) => r.learnerId,
    ),
  );

  const writes = [];
  for (const rec of records) {
    const learnerId = String(rec?.learnerId || "");
    const status = String(rec?.status || "").toUpperCase();
    if (!learnerId || !rosterLearnerIds.has(learnerId) || !STATUSES.includes(status)) continue;
    const note = rec?.note ? String(rec.note).slice(0, 280) : null;
    writes.push(
      prisma.attendanceRecord.upsert({
        where: { classId_learnerId_date: { classId, learnerId, date } },
        create: { classId, learnerId, date, status, note, recordedById: auth.instructor.id },
        update: { status, note, recordedById: auth.instructor.id },
      }),
    );
  }
  if (writes.length === 0) return NextResponse.json({ error: "No valid records." }, { status: 400 });

  await prisma.$transaction(writes);
  return NextResponse.json({ ok: true, count: writes.length });
}
