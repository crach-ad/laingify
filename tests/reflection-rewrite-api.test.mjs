import test from 'node:test';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import { createFixture, requireLocalReflectionDatabase } from '../scripts/reflection-test-fixture.mjs';

requireLocalReflectionDatabase();
const base = process.env.REFLECTION_TEST_URL || 'http://localhost:3138';
const target = new URL(base);
assert.ok(['localhost', '127.0.0.1'].includes(target.hostname), 'Tests refuse remote servers');
const db = new PrismaClient();
const f = await createFixture();
async function post(path, body, cookie = '', origin = base) {
  const response = await fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie, Origin: origin }, body: JSON.stringify(body) });
  return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
}
async function html(path, cookie) { const r = await fetch(base + path, { headers: { Cookie: cookie } }); assert.equal(r.status, 200); return r.text(); }
const teacher = (await post('/api/instruct/login', { email: f.instructor.email, pin: '8642' })).cookie;
const outsider = (await post('/api/instruct/login', { email: f.outsider.email, pin: '8642' })).cookie;
assert.ok(teacher); assert.ok(outsider);
const student = (await post('/api/join', { classCode: f.klass.classCode, learnerId: f.learners.Avery.id })).cookie;
const input = (name = 'Avery', mod = f.module) => ({ learnerId: f.learners[name].id, moduleId: mod.id, submissionId: `${f.learners[name].id}-${mod.id}-reflection` });
const reopen = (body, cookie = teacher) => post('/api/instruct/reflection/reopen', body, cookie);
const preserve = async (learnerId, moduleId) => ({
  evidence: await db.evidence.findMany({ where: { learnerId, moduleId }, orderBy: { id: 'asc' } }),
  progress: await db.moduleProgress.findUnique({ where: { learnerId_moduleId: { learnerId, moduleId } } }),
  project: await db.project.findUnique({ where: { learnerId_moduleId: { learnerId, moduleId } } }),
  statuses: await db.criterionStatus.findMany({ where: { learnerId }, orderBy: { id: 'asc' } }),
  others: await db.submission.findMany({ where: { learnerId, NOT: { id: input().submissionId } }, include: { feedback: true }, orderBy: { id: 'asc' } }),
});

test('server rejects anonymous, student, unauthorized org, non-WSR, unassigned module, and cross-origin actions', async () => {
  assert.equal((await reopen(input(), '')).status, 401);
  assert.equal((await reopen(input(), student)).status, 401);
  assert.equal((await reopen(input(), outsider)).status, 403);
  assert.equal((await reopen(input('Drew'))).status, 403);
  assert.equal((await reopen(input('Avery', f.unassigned))).status, 403);
  assert.equal((await post('/api/instruct/reflection/reopen', input(), teacher, 'https://untrusted.example')).status, 403);
  assert.equal((await post('/api/submission', { moduleId: f.unassigned.id, content: 'Unassigned submission must fail.' }, student)).status, 403);
  assert.ok(await db.submission.findUnique({ where: { id: input().submissionId } }));
});

test('completed tutorial: reopen, rewrite, and review replacement; preserve all other work', async () => {
  const before = await preserve(f.learners.Avery.id, f.module.id);
  assert.match(await html(`/instruct/review/${f.learners.Avery.id}/${f.module.id}`, teacher), /Reopen reflection/);
  const opened = await reopen(input()); assert.equal(opened.status, 200, JSON.stringify(opened));
  assert.equal(opened.body.awaitingRewrite, true);
  assert.equal(await db.submission.findUnique({ where: { id: input().submissionId } }), null);
  assert.equal(await db.autoFeedback.findUnique({ where: { submissionId: input().submissionId } }), null);
  assert.deepEqual(await preserve(f.learners.Avery.id, f.module.id), before);
  const request = await db.reflectionRewriteRequest.findUnique({ where: { removedSubmissionId: input().submissionId } });
  assert.match(await html(`/instruct/review/${f.learners.Avery.id}/${f.module.id}`, teacher), /Awaiting rewritten reflection/);
  assert.match(await html('/instruct', teacher), /Awaiting rewritten reflection/);
  assert.match(await html(`/instruct/learner/${f.learners.Avery.id}`, teacher), /Awaiting rewritten reflection/);
  assert.match(await html(`/learn/${f.module.id}`, student), /Rewrite your reflection/);
  assert.equal((await post('/api/submission', { moduleId: f.module.id, content: 'A stale open learner page must not clear a new rewrite request.' }, student)).status, 409);
  const content = 'I rewrote my reflection: the stronger triangular supports helped my bridge carry more weight during testing.';
  const result = await post('/api/submission', { moduleId: f.module.id, content, rewriteRequestId: request.id }, student);
  assert.equal(result.status, 200, JSON.stringify(result)); assert.ok(result.body.feedback.summary);
  assert.equal(result.body.complete, true);
  assert.deepEqual(await db.moduleProgress.findUnique({ where: { learnerId_moduleId: { learnerId: f.learners.Avery.id, moduleId: f.module.id } } }), before.progress);
  assert.deepEqual(await db.evidence.findMany({ where: { learnerId: f.learners.Avery.id, moduleId: f.module.id }, orderBy: { id: 'asc' } }), before.evidence);
  const updated = await db.reflectionRewriteRequest.findUnique({ where: { id: request.id } });
  assert.ok(updated.fulfilledAt); assert.equal(updated.replacementSubmissionId, result.body.submissionId);
  const page = await html(`/instruct/review/${f.learners.Avery.id}/${f.module.id}`, teacher);
  assert.match(page, /I rewrote my reflection/); assert.doesNotMatch(page, /Awaiting rewritten reflection/);
  const stale = await reopen(input()); assert.equal(stale.status, 200); assert.equal(stale.body.awaitingRewrite, false);
  assert.ok(await db.submission.findUnique({ where: { id: result.body.submissionId } }));
  assert.equal((await post('/api/submission', { moduleId: f.module.id, content, rewriteRequestId: request.id }, student)).status, 409);
});

test('parallel reopen requests are idempotent and never remove older or criterion submissions', async () => {
  const body = input('Blake');
  const results = await Promise.all([reopen(body), reopen(body), reopen(body)]);
  assert.ok(results.every(r => r.status === 200), JSON.stringify(results));
  assert.equal(await db.reflectionRewriteRequest.count({ where: { removedSubmissionId: body.submissionId } }), 1);
  assert.equal(await db.submission.count({ where: { learnerId: body.learnerId, moduleId: body.moduleId } }), 2);
  assert.equal((await reopen({ ...body, submissionId: `${body.learnerId}-${body.moduleId}-checkpoint` })).status, 409);
});

test('stale instructor cannot remove a newer reflection or one from another learner', async () => {
  const body = input('Casey');
  const newer = await db.submission.create({ data: { learnerId: body.learnerId, moduleId: body.moduleId, content: 'A newer written reflection.', createdAt: new Date(Date.now() + 1000), feedback: { create: { summary: 'New feedback.' } } } });
  assert.equal((await reopen(body)).status, 409);
  assert.equal((await reopen({ ...body, submissionId: input('Blake').submissionId })).status, 403);
  assert.ok(await db.submission.findUnique({ where: { id: newer.id } }));
  assert.ok(await db.submission.findUnique({ where: { id: body.submissionId } }));
});

test('completed workspace also exposes rewrite form and clears request after resubmission', async () => {
  const body = input('Avery', f.workspace);
  assert.equal((await reopen(body)).status, 200);
  const pending = await db.reflectionRewriteRequest.findUnique({ where: { removedSubmissionId: body.submissionId } });
  assert.match(await html(`/learn/${f.workspace.id}`, student), /Rewrite your reflection/);
  const result = await post('/api/submission', { moduleId: f.workspace.id, content: 'I tested several different designs before deciding which bridge supports worked best in my experiment.', rewriteRequestId: pending.id }, student);
  assert.equal(result.status, 200); assert.ok(result.body.feedback);
  assert.equal(await db.reflectionRewriteRequest.count({ where: { learnerId: body.learnerId, moduleId: body.moduleId, fulfilledAt: null } }), 0);
});

test('parallel learner rewrites consume one request exactly once', async () => {
  const body = input('Blake');
  const cookie = (await post('/api/join', { classCode: f.klass.classCode, learnerId: body.learnerId })).cookie;
  const request = await db.reflectionRewriteRequest.findUnique({ where: { removedSubmissionId: body.submissionId } });
  const before = await db.submission.count({ where: { learnerId: body.learnerId, moduleId: body.moduleId } });
  const payload = { moduleId: body.moduleId, rewriteRequestId: request.id, content: 'I tested the bridge again and rewrote my explanation using more evidence about the stronger supports.' };
  const results = await Promise.all([post('/api/submission', payload, cookie), post('/api/submission', payload, cookie)]);
  assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
  assert.equal(await db.submission.count({ where: { learnerId: body.learnerId, moduleId: body.moduleId } }), before + 1);
  const final = await db.reflectionRewriteRequest.findUnique({ where: { id: request.id } });
  assert.ok(final.fulfilledAt);
  assert.ok(await db.autoFeedback.findUnique({ where: { submissionId: final.replacementSubmissionId } }));
});

test.after(async () => { await db.$disconnect(); });
