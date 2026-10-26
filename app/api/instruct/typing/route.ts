import { NextResponse } from "next/server";
import { getInstructor } from "@/lib/instructor";
import { instructorClass } from "@/lib/typing-access";
import { BANDS } from "@/lib/bands";
import { addStudents, assignLetterLeaper, createTypingClass, enablePins, parseNames, parseSettings, saveSettings } from "@/lib/typing-admin";
import { prisma } from "@/lib/db";

// Instructor actions for Letter Leaper classrooms, one POST with an `action`:
//   create-class  { orgId, name, band, students, settings }
//   assign        { classId }                — enable in an existing class
//   settings      { classId, settings }
//   enable-pins   { classId }
//   add-students  { classId, students }
// Every class action re-checks that the class is in one of this instructor's orgs.
const fail = (status: number, error: string) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  if (req.headers.get("origin") !== new URL(req.url).origin) return fail(403, "Cross-site request.");
  const auth = await getInstructor();
  if (!auth) return fail(401, "Sign in as an instructor.");
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return fail(400, "Invalid request.");
  }
  const teacher = auth.instructor.displayName || "your teacher";

  if (body.action === "create-class") {
    const orgId = String(body.orgId ?? "");
    if (!auth.orgIds.includes(orgId)) return fail(403, "Choose one of your organizations.");
    const name = String(body.name ?? "").trim();
    if (name.length < 2 || name.length > 60) return fail(400, "Class name must be 2–60 characters.");
    const band = String(body.band ?? "");
    if (!(band in BANDS)) return fail(400, "Choose an age band.");
    const settings = parseSettings(body.settings);
    if (!settings) return fail(400, "Choose practice settings.");
    const names = parseNames(body.students);
    if (!names.ok) return fail(400, names.error);
    const klass = await createTypingClass({ orgId, name, band, names: names.names, settings, teacher });
    return NextResponse.json({ ok: true, classId: klass.id });
  }

  const ctx = await instructorClass(String(body.classId ?? ""));
  if (!ctx) return fail(404, "Class not found.");
  const { klass } = ctx;

  switch (body.action) {
    case "assign":
      await assignLetterLeaper(klass, teacher);
      return NextResponse.json({ ok: true });
    case "settings": {
      const settings = parseSettings(body.settings);
      if (!settings) return fail(400, "Choose practice settings.");
      if (!(await prisma.typingAssignment.findUnique({ where: { classId: klass.id } }))) {
        await assignLetterLeaper(klass, teacher);
      }
      await saveSettings(klass.id, settings);
      return NextResponse.json({ ok: true });
    }
    case "enable-pins":
      await enablePins(klass.id);
      return NextResponse.json({ ok: true });
    case "add-students": {
      const result = await addStudents(klass, body.students);
      return result.ok ? NextResponse.json(result) : fail(400, result.error);
    }
    default:
      return fail(400, "Unknown action.");
  }
}
