import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

// Append-only learner interaction log (ANALYTICS.md Phase A). Fire-and-forget
// from the client — accepts one event or an array, validates against a type
// whitelist, and never trusts a client-supplied learner id (session only).
//
// Side effect: step_view events carrying dwellMs also increment the module's
// timeOnTaskSeconds, capped per event so an abandoned open tab can't record
// an hour of "work".

const TYPES = new Set([
  "session_start",
  "step_view",
  "step_done",
  "track_pick",
  "checkpoint_saved",
  "checkpoint_retry",
  "audio_recorded",
  "wrapup_submitted",
  "module_done",
]);

const DWELL_CAP_MS = 5 * 60 * 1000;

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad payload." }, { status: 400 });
  }
  const raw = Array.isArray(body) ? body : [body];
  if (raw.length === 0 || raw.length > 50) {
    return NextResponse.json({ error: "Bad batch size." }, { status: 400 });
  }

  const rows: { learnerId: string; moduleId: string | null; type: string; meta: string }[] = [];
  const dwellByModule = new Map<string, number>();

  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const e = item as Record<string, unknown>;
    const type = String(e.type || "");
    if (!TYPES.has(type)) continue;
    const moduleId = e.moduleId ? String(e.moduleId).slice(0, 40) : null;
    const meta = typeof e.meta === "object" && e.meta !== null ? (e.meta as Record<string, unknown>) : {};
    let metaJson = JSON.stringify(meta);
    if (metaJson.length > 2048) metaJson = "{}";
    rows.push({ learnerId: session.learnerId, moduleId, type, meta: metaJson });

    if (type === "step_view" && moduleId && typeof meta.dwellMs === "number" && meta.dwellMs > 0) {
      dwellByModule.set(moduleId, (dwellByModule.get(moduleId) ?? 0) + Math.min(meta.dwellMs, DWELL_CAP_MS));
    }
  }
  if (rows.length === 0) return NextResponse.json({ ok: true, saved: 0 });

  await prisma.learnerEvent.createMany({ data: rows });
  for (const [moduleId, ms] of dwellByModule) {
    // Only bump progress rows that exist — opening the module created one.
    await prisma.moduleProgress.updateMany({
      where: { learnerId: session.learnerId, moduleId },
      data: { timeOnTaskSeconds: { increment: Math.round(ms / 1000) } },
    });
  }
  return NextResponse.json({ ok: true, saved: rows.length });
}
