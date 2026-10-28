import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { PACES, PRACTICES, rankClimbs, validClimb, validUsername, type ClassClimb } from "@/lib/letter-leaper-rules";

const TITLE = "Letter Leaper: Moonbound";
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
function parseMeta(raw: string): Record<string, unknown> {
  try { const data = JSON.parse(raw); return data && typeof data === "object" ? data : {}; } catch { return {}; }
}
async function context() {
  const session = await getSession();
  if (!session || typeof session.learnerId !== "string" || typeof session.classId !== "string") return null;
  const roster = await prisma.rosterEntry.findUnique({
    where: { classId_learnerId: { classId: session.classId, learnerId: session.learnerId } },
    select: { class: { select: { orgId: true } } },
  });
  if (!roster) return null;
  const assignment = await prisma.classModule.findFirst({
    where: { classId: session.classId, module: { orgId: roster.class.orgId, title: TITLE } },
    select: { moduleId: true },
  });
  return assignment ? { ...session, moduleId: assignment.moduleId } : null;
}
async function handle(req: Request, action: string) {
  if (!["profile", "scores", "leaderboard"].includes(action)) return json({ error: "Not found." }, 404);
  if (req.method === "POST" && req.headers.get("origin") !== new URL(req.url).origin) return json({ error: "Use this game's page to save your climb." }, 403);
  const ctx = await context();
  if (!ctx) return json({ error: "Sign in to your Windsor class and open the Letter Leaper module." }, 401);
  const profileId = `leaper-profile:${ctx.classId}:${ctx.learnerId}`;
  if (action === "profile") {
    if (req.method === "GET") {
      const event = await prisma.learnerEvent.findUnique({ where: { id: profileId }, select: { meta: true } });
      return json({ username: event ? parseMeta(event.meta).username ?? "" : "" });
    }
    const body = await payload(req);
    if (!validUsername(body?.username)) return json({ error: "Use 2–20 letters, numbers, _ or -." }, 400);
    const meta = JSON.stringify({ classId: ctx.classId, username: body.username });
    await prisma.learnerEvent.upsert({ where: { id: profileId }, create: { id: profileId, learnerId: ctx.learnerId, moduleId: ctx.moduleId, type: "leaper_profile", meta }, update: { meta } });
    return json({ username: body.username });
  }
  if (action === "scores") {
    if (req.method !== "POST") return json({ error: "Use POST to save a climb." }, 405);
    const body = await payload(req);
    if (!validClimb(body)) return json({ error: "Only a completed 150-leap climb with valid results can be saved." }, 400);
    const profile = await prisma.learnerEvent.findUnique({ where: { id: profileId }, select: { meta: true } });
    const username = profile ? parseMeta(profile.meta).username : null;
    if (!validUsername(username)) return json({ error: "Choose your explorer nickname first." }, 400);
    const id = `leaper-score:${ctx.classId}:${ctx.learnerId}:${body.id}`;
    // Retries of the same climb are idempotent; do not accept client identity or class IDs.
    const { practice, pace, leaps, correct, attempts, streak, elapsed } = body;
    await prisma.learnerEvent.upsert({ where: { id }, create: {
      id, learnerId: ctx.learnerId, moduleId: ctx.moduleId, type: "leaper_score",
      meta: JSON.stringify({ id: body.id, practice, pace, leaps, correct, attempts, streak, elapsed, classId: ctx.classId, username }),
    }, update: {} });
    return json({ ok: true });
  }
  if (req.method !== "GET") return json({ error: "Use GET to view the leaderboard." }, 405);
  const query = new URL(req.url).searchParams;
  const practice = query.get("practice") ?? "all", pace = query.get("pace") ?? "easy";
  if (!PRACTICES.includes(practice) || !PACES.includes(pace)) return json({ error: "Choose a valid practice mode." }, 400);
  const rows = await prisma.learnerEvent.findMany({
    where: { moduleId: ctx.moduleId, type: "leaper_score", meta: { contains: `"classId":${JSON.stringify(ctx.classId)}` }, learner: { roster: { some: { classId: ctx.classId } } } },
    select: { learnerId: true, meta: true },
  });
  const ranked = rankClimbs(rows.map(r => ({ ...parseMeta(r.meta), learnerId: r.learnerId })) as ClassClimb[], ctx.classId, practice, pace);
  const profiles = await prisma.learnerEvent.findMany({ where: { id: { in: ranked.map(r => `leaper-profile:${ctx.classId}:${r.learnerId}`) } }, select: { learnerId: true, meta: true } });
  const names = new Map(profiles.map(p => [p.learnerId, parseMeta(p.meta).username]));
  return json({ entries: ranked.map((r, i) => ({ rank: i + 1, username: names.get(r.learnerId) ?? r.username, accuracy: r.correct / r.attempts * 100, streak: r.streak, elapsed: r.elapsed, you: r.learnerId === ctx.learnerId })) });
}
async function payload(req: Request): Promise<Record<string, unknown> | null> {
  const raw = await req.text();
  if (raw.length > 4096) return null;
  try { const result = JSON.parse(raw); return result && typeof result === "object" && !Array.isArray(result) ? result : null; } catch { return null; }
}
async function route(req: Request, { params }: { params: Promise<{ action: string }> }) {
  try { return await handle(req, (await params).action); }
  catch (error) { console.error("Letter Leaper request failed", error instanceof Error ? error.name : "Unknown error"); return json({ error: "We couldn't connect to your class. Please try again." }, 503); }
}
export { route as GET, route as POST };
