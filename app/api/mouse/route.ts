import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import { validRecord, sessionScore, rankMeadowScores, type MouseRecord, type Attempt } from '@/lib/mouse-skills';
const json = (value: unknown, status = 200) => NextResponse.json(value, { status, headers: { 'Cache-Control': 'private, no-store' } });
async function saveScore(prefix: string, learnerId: string, classId: string, sessionId: string) {
  const events = await prisma.learnerEvent.findMany({ where: { learnerId, type: 'mouse_skills', id: { startsWith: `${prefix}:` } }, select: { meta: true } });
  const records: MouseRecord[] = events.flatMap(event => {
    try { const data = JSON.parse(event.meta); return validRecord(data) ? [data] : []; } catch { return []; }
  }).sort((a, b) => a.sequence - b.sequence);
  const attempts = records.flatMap(record => record.attempt ? [record.attempt] : []) as Attempt[];
  const result = sessionScore(attempts);
  const id = `${prefix}:score`;
  await prisma.learnerEvent.upsert({ where: { id }, create: { id, learnerId, type: 'mouse_score', meta: JSON.stringify({ ...result, classId, sessionId, version: 2 }) }, update: {} });
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session || typeof session.learnerId !== 'string' || typeof session.classId !== 'string') return json({ error: 'Sign in to see your class leaderboard.' }, 401);
    if (!await prisma.rosterEntry.findUnique({ where: { classId_learnerId: session } })) return json({ error: 'Class membership required.' }, 403);
    const rows = await prisma.learnerEvent.findMany({
      where: { type: 'mouse_score', id: { startsWith: `mouse:${session.classId}:` }, learner: { roster: { some: { classId: session.classId } } } },
      select: { learnerId: true, meta: true },
    });
    const ranked = rankMeadowScores(rows.flatMap(row => {
      try { const data = JSON.parse(row.meta); return data.classId === session.classId && data.version === 2 ? [{ learnerId: row.learnerId, sessionId: data.sessionId, score: data.score, completed: data.completed }] : []; } catch { return []; }
    }));
    const roster = await prisma.rosterEntry.findMany({ where: { classId: session.classId }, orderBy: { learnerId: 'asc' }, select: { learnerId: true } });
    const names = ['Clover', 'Butterfly', 'Sunflower', 'Acorn', 'Daisy', 'Fern'];
    const nickname = (id: string) => { const i = roster.findIndex(row => row.learnerId === id); return `${names[Math.max(0, i) % names.length]} ${String(i + 1).padStart(2, '0')}`; };
    const entries = ranked.map((row, i) => ({ rank: i + 1, nickname: nickname(row.learnerId), score: row.score, completed: row.completed, you: row.learnerId === session.learnerId }));
    return json({ entries: entries.slice(0, 10), personal: entries.find(row => row.you) ?? null });
  } catch { return json({ error: 'Leaderboard unavailable. Try again.' }, 503); }
}

export async function POST(req: Request) {
  if (req.headers.get('origin') !== new URL(req.url).origin) return json({ error: 'Invalid origin' }, 403);
  try {
    const session = await getSession();
    if (!session || typeof session.learnerId !== 'string' || typeof session.classId !== 'string') return json({ error: 'Sign in to save progress.' }, 401);
    const roster = await prisma.rosterEntry.findUnique({ where: { classId_learnerId: session } });
    if (!roster) return json({ error: 'Class membership required.' }, 403);
    const assignment = await prisma.classModule.findFirst({ where: { classId: session.classId, module: { title: 'Mouse Meadow', topic: 'Mouse Skills', org: { classes: { some: { id: session.classId } } } } }, select: { moduleId: true } });
    const raw = await req.text();
    if (raw.length > 2048) return json({ error: 'Payload too large' }, 413);
    let body: unknown;
    try { body = JSON.parse(raw); } catch { return json({ error: 'Invalid JSON' }, 400); }
    if (!validRecord(body)) return json({ error: 'Invalid mouse-skills record' }, 400);
    const prefix = `mouse:${session.classId}:${session.learnerId}:${body.sessionId}`;
    const id = `${prefix}:${body.sequence}`;
    const existing = await prisma.learnerEvent.findUnique({ where: { id } });
    if (existing) {
      const previous = JSON.parse(existing.meta);
      if (previous.kind !== body.kind || JSON.stringify(previous.attempt) !== JSON.stringify(body.attempt)) return json({ error: 'This attempt has already been recorded.' }, 409);
      // A retried finish also repairs a score write interrupted by a connection failure.
      if (body.kind === 'end') await saveScore(prefix, session.learnerId, session.classId, body.sessionId);
      return json({ ok: true });
    }
    if (body.kind !== 'start') {
      const previous = await prisma.learnerEvent.findUnique({ where: { id: `${prefix}:${body.sequence - 1}` } });
      if (!previous || JSON.parse(previous.meta).kind === 'end') return json({ error: 'Save the previous attempt first, or start a new session.' }, 409);
    }
    await prisma.learnerEvent.upsert({ where: { id }, create: { id, learnerId: session.learnerId, moduleId: assignment?.moduleId ?? null, type: 'mouse_skills', meta: JSON.stringify({ ...body, classId: session.classId, version: 2 }) }, update: {} });
    if (body.kind === 'end') await saveScore(prefix, session.learnerId, session.classId, body.sessionId);
    return json({ ok: true });
  } catch { return json({ error: 'Progress could not be saved. Please retry.' }, 503); }
}
