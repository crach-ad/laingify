import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import * as rules from '../lib/mouse-skills.ts';
const sessionId = 'd302498b-84f3-4b84-92c4-29b5931aa48a';
const source = ts.transpileModule(readFileSync(new URL('../app/api/mouse/route.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
function fixture({ signedIn = true, enrolled = true, unavailable = false } = {}) {
  const rows = new Map();
  const dependencies = {
    'next/server': { NextResponse: { json: (value, options) => Response.json(value, options) } },
    '@/lib/session': { getSession: async () => signedIn ? { learnerId: 'student', classId: 'class' } : null },
    '@/lib/mouse-skills': rules,
    '@/lib/db': { prisma: {
      classModule: { findFirst: async () => ({ moduleId: 'mouse-module' }) },
      rosterEntry: { findMany: async () => [{ learnerId: 'student' }], findUnique: async () => enrolled ? {} : null },
      learnerEvent: {
        findMany: async ({ where }) => [...rows.values()].filter(r => r.type === where.type && r.id.startsWith(where.id.startsWith) && (!where.learnerId || r.learnerId === where.learnerId)),
        findUnique: async ({ where }) => rows.get(where.id) ?? null,
        upsert: async ({ where, create }) => { if (unavailable) throw new Error('offline'); if (!rows.has(where.id)) rows.set(where.id, create); return rows.get(where.id); },
      },
    } },
  };
  const exports = {};
  new Function('require', 'exports', source)(name => dependencies[name], exports);
  return { rows, get: exports.GET, send: (body, origin = 'http://localhost:3000') => exports.POST(new Request('http://localhost:3000/api/mouse', { method: 'POST', headers: { origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })) };
}
const start = { sessionId, kind: 'start', sequence: 0 };
const attempt = { sessionId, kind: 'attempt', sequence: 1, attempt: { skill: 'drag', level: 0, success: true, ms: 1500, reason: 'hit', input: 'mouse' } };
test('requires same origin, sign-in and class membership', async () => {
  assert.equal((await fixture().send(start, 'https://other.example')).status, 403);
  assert.equal((await fixture({ signedIn: false }).send(start)).status, 401);
  assert.equal((await fixture({ enrolled: false }).send(start)).status, 403);
});
test('records session and attempt once, with identity taken from the cookie', async () => {
  const f = fixture();
  assert.equal((await f.send({ ...start, learnerId: 'impostor' })).status, 200);
  assert.equal((await f.send(attempt)).status, 200);
  assert.equal((await f.send(attempt)).status, 200);
  assert.equal(f.rows.size, 2);
  assert.equal([...f.rows.values()][1].learnerId, 'student');
  assert.equal([...f.rows.values()][1].moduleId, 'mouse-module');
  assert.equal(JSON.parse([...f.rows.values()][1].meta).classId, 'class');
});
test('rejects missing predecessors, conflicting retries and attempts after finish', async () => {
  const f = fixture();
  assert.equal((await f.send(attempt)).status, 409);
  await f.send(start); await f.send(attempt);
  assert.equal((await f.send({ ...attempt, attempt: { ...attempt.attempt, ms: 2000 } })).status, 409);
  assert.equal((await f.send({ sessionId, kind: 'end', sequence: 2 })).status, 200);
  assert.equal((await f.send({ ...attempt, sequence: 3 })).status, 409);
});
test('rejects invalid payloads and returns a retryable save error', async () => {
  assert.equal((await fixture().send({ ...attempt, sequence: -1 })).status, 400);
  assert.equal((await fixture().send({ extra: 'x'.repeat(3000) })).status, 413);
  assert.equal((await fixture({ unavailable: true }).send(start)).status, 503);
});

test('finish computes score server-side and repeated finishes are idempotent', async () => {
  const f = fixture();
  await f.send(start);
  for (let i = 1; i <= 4; i++) await f.send({ ...attempt, sequence: i, score: 99999 });
  const end = { sessionId, kind: 'end', sequence: 5 };
  assert.equal((await f.send(end)).status, 200);
  assert.equal((await f.send(end)).status, 200);
  const scores = [...f.rows.values()].filter(r => r.type === 'mouse_score');
  assert.equal(scores.length, 1);
  assert.equal(JSON.parse(scores[0].meta).score, 140);
  const response = await f.get();
  const board = await response.json();
  assert.equal(board.entries[0].score, 140);
  assert.equal(board.entries[0].you, true);
  assert.equal(board.entries[0].learnerId, undefined);
  assert.equal(board.personal.rank, 1);
});
test('leaderboard checks membership and excludes another class', async () => {
  assert.equal((await fixture({ signedIn: false }).get()).status, 401);
  assert.equal((await fixture({ enrolled: false }).get()).status, 403);
  const f = fixture();
  f.rows.set('mouse:other:student:score', { id: 'mouse:other:student:score', learnerId: 'student', type: 'mouse_score', meta: JSON.stringify({ classId: 'other', version: 2, score: 999, completed: 5 }) });
  assert.deepEqual((await (await f.get()).json()).entries, []);
});
