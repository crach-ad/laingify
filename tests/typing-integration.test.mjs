// End-to-end API tests for Letter Leaper progress against a running server.
// Writes fixtures straight to the database, so it only runs against a local
// one:
//   TYPING_IT_BASE=http://localhost:3124 DATABASE_URL=postgresql://…@localhost…/db \
//     node --test tests/typing-integration.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.TYPING_IT_BASE;
const DB = process.env.DATABASE_URL ?? '';
const enabled = BASE && /@(localhost|127\.0\.0\.1)[:/]/.test(DB);
const it = enabled ? test : test.skip;
if (!enabled) console.log('typing-integration: set TYPING_IT_BASE and a localhost DATABASE_URL to run.');

let prisma, tag, orgA, orgB, teacherA, teacherB;
const PIN_A = '4111', PIN_B = '4222';

// ---- tiny cookie-keeping client ---------------------------------------------
function client() {
  const jar = new Map();
  const call = async (path, { method = 'GET', body, headers = {}, raw } = {}) => {
    const res = await fetch(BASE + path, {
      method, redirect: 'manual',
      headers: { ...(body !== undefined ? { 'Content-Type': 'application/json', Origin: BASE } : {}), Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join('; '), ...headers },
      body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
    for (const c of res.headers.getSetCookie()) {
      const [kv] = c.split(';'); const i = kv.indexOf('=');
      const k = kv.slice(0, i), v = kv.slice(i + 1);
      if (/Max-Age=0|Expires=Thu, 01 Jan 1970/i.test(c) || v === '') jar.delete(k); else jar.set(k, v);
    }
    const text = await res.text();
    let json = null; try { json = JSON.parse(text); } catch {}
    return { status: res.status, text, json, location: res.headers.get('location') };
  };
  return { call, jar };
}

async function teacher(email, pin) {
  const c = client();
  const r = await c.call('/api/instruct/login', { method: 'POST', body: { email, pin } });
  assert.equal(r.status, 200, r.text);
  return c;
}
async function student(classCode, learnerId, pin) {
  const c = client();
  const r = await c.call('/api/join', { method: 'POST', body: { classCode, learnerId, pin } });
  assert.equal(r.status, 200, r.text);
  return c;
}
async function ticketFor(c) {
  const page = await c.call('/play/letter-leaper');
  assert.equal(page.status, 200);
  const m = page.text.match(/#cfg=([A-Za-z0-9_-]+)/);
  return m ? JSON.parse(Buffer.from(m[1], 'base64url').toString()) : null;
}

// ---- event batches -------------------------------------------------------------
function session(settings = { letterSet: 'all', pace: 'easy', scope: 'full' }) {
  return { id: crypto.randomUUID(), ...settings, hints: settings.pace === 'easy', gameVersion: 'test', measurementVersion: 1, startedAt: Date.now() - 120000 };
}
// seq/t-stamped events from a compact list of [type, data].
function events(list, seq0 = 0, t0 = 0) {
  return list.map(([type, data], i) => ({ id: crypto.randomUUID(), seq: seq0 + i, t: t0 + i * 500, type, ...data }));
}
const batch = (ticket, s, evs, clocks = { activeMs: 5000, pauseMs: 0, animationMs: 800, hiddenMs: 0 }) =>
  ({ ticket, session: s, clocks, ignored: { repeat: 0, modifier: 0, composition: 0, paste: 0, nonletter: 0, busy: 0 }, events: evs });
const upload = (c, b) => c.call('/api/typing/batch', { method: 'POST', body: b });

before(async () => {
  if (!enabled) return;
  const { PrismaClient } = await import('@prisma/client');
  prisma = new PrismaClient();
  tag = Date.now().toString(36);
  orgA = await prisma.org.create({ data: { name: `IT Org A ${tag}` } });
  orgB = await prisma.org.create({ data: { name: `IT Org B ${tag}` } });
  teacherA = await prisma.instructor.create({ data: { displayName: 'Teacher A', email: `a-${tag}@test.local`, pin: PIN_A, orgId: orgA.id } });
  teacherB = await prisma.instructor.create({ data: { displayName: 'Teacher B', email: `b-${tag}@test.local`, pin: PIN_B, orgId: orgB.id } });
});
after(async () => { await prisma?.$disconnect(); });

let klass, ann, bo, annC, boC, annTicket, boTicket, teacherAC;

it('a teacher creates a classroom with Letter Leaper assigned and PINs issued', async () => {
  teacherAC = await teacher(teacherA.email, PIN_A);
  const r = await teacherAC.call('/api/instruct/typing', { method: 'POST', body: {
    action: 'create-class', orgId: orgA.id, name: `Typing ${tag}`, band: 'YOUTH', students: 'Ann T\nBo T',
    settings: { letterSet: 'home', pace: 'medium', scope: 'full' },
  } });
  assert.equal(r.status, 200, r.text);
  klass = await prisma.class.findUnique({ where: { id: r.json.classId }, include: { roster: { include: { learner: true } }, typingAssignment: true, modules: { include: { module: true } } } });
  assert.equal(klass.minAuthTier, 1);
  assert.equal(klass.modules[0].module.title, 'Letter Leaper: Moonbound');
  assert.equal(klass.typingAssignment.pace, 'medium');
  assert.ok(klass.roster.every((r) => /^\d{4}$/.test(r.learner.pin)));
  ann = klass.roster.find((r) => r.learner.displayName === 'Ann T').learner;
  bo = klass.roster.find((r) => r.learner.displayName === 'Bo T').learner;
  // Another org's instructor cannot create classes in org A.
  const other = await teacher(teacherB.email, PIN_B);
  const denied = await other.call('/api/instruct/typing', { method: 'POST', body: { action: 'create-class', orgId: orgA.id, name: 'x', band: 'YOUTH', students: 'X Y', settings: { letterSet: 'all', pace: 'easy', scope: 'full' } } });
  assert.equal(denied.status, 403);
});

it('students sign in with PINs and receive a practice ticket with the teacher settings', async () => {
  annC = await student(klass.classCode, ann.id, ann.pin);
  boC = await student(klass.classCode, bo.id, bo.pin);
  const cfgA = await ticketFor(annC);
  const cfgB = await ticketFor(boC);
  assert.deepEqual(cfgA.settings, { letterSet: 'home', pace: 'medium', scope: 'full' });
  assert.notEqual(cfgA.k, cfgB.k);
  annTicket = cfgA.ticket; boTicket = cfgB.ticket;
  // Settings saved under the old pace names play at the matching difficulty.
  await prisma.typingAssignment.update({ where: { classId: klass.id }, data: { pace: 'steady' } });
  assert.equal((await ticketFor(annC)).settings.pace, 'medium');
  await prisma.typingAssignment.update({ where: { classId: klass.id }, data: { pace: 'medium' } });
});

let annSession, annEvents;
it('two students practise without their records mixing; retries do not duplicate', async () => {
  annSession = session({ letterSet: 'home', pace: 'medium', scope: 'full' });
  annEvents = events([
    ['session_start', { leap: 0, resumed: false }],
    ['target', { target: 'f', kind: 'letter', leap: 1 }],
    ['key', { exp: 'f', got: 'g', pos: 0, ok: false, rt: 900, src: 'kbd' }],
    ['key', { exp: 'f', got: 'f', pos: 0, ok: true, rt: 600, src: 'kbd' }],
    ['complete', { target: 'f', leap: 1 }],
    ['target', { target: 'j', kind: 'letter', leap: 2 }],
    ['timeout', { target: 'j', pos: 0, rt: 8000 }],
    ['target', { target: 'k', kind: 'letter', leap: 2 }],
    ['pause', { reason: 'user' }],
    ['resume', { reason: 'user' }],
    ['key', { exp: 'k', got: 'k', pos: 0, ok: true, rt: 700, src: 'kbd' }],
    ['complete', { target: 'k', leap: 2 }],
  ]);
  const first = await upload(annC, batch(annTicket, annSession, annEvents.slice(0, 7)));
  assert.equal(first.status, 200, first.text);
  assert.equal(first.json.accepted, 7);
  // Retry of the same batch (e.g. the response was lost) + the rest.
  const retry = await upload(annC, batch(annTicket, annSession, annEvents.slice(0, 7)));
  assert.deepEqual([retry.status, retry.json.accepted, retry.json.duplicates], [200, 0, 7]);
  const rest = await upload(annC, batch(annTicket, annSession, annEvents.slice(5)));
  assert.deepEqual([rest.status, rest.json.accepted, rest.json.duplicates], [200, 5, 2]);

  const boSession = session({ letterSet: 'home', pace: 'medium', scope: 'full' });
  const boRes = await upload(boC, batch(boTicket, boSession, events([
    ['session_start', { leap: 0, resumed: false }],
    ['target', { target: 'a', kind: 'letter', leap: 1 }],
    ['key', { exp: 'a', got: 'a', pos: 0, ok: true, rt: 400, src: 'screen' }],
    ['complete', { target: 'a', leap: 1 }],
    ['end', { reason: 'exited', leap: 1 }],
  ])));
  assert.equal(boRes.status, 200, boRes.text);

  const a = await prisma.typingSession.findUnique({ where: { id: annSession.id } });
  assert.equal(a.learnerId, ann.id);
  assert.deepEqual([a.attempts, a.correct, a.timeouts, a.furthestLeap, a.lastSeq, a.status], [3, 2, 1, 2, 11, 'ACTIVE']);
  assert.equal(a.responseMs, 900 + 600 + 8000 + 700, 'pause time is not response time');
  assert.equal(await prisma.typingEvent.count({ where: { sessionId: annSession.id } }), 12);
  const b = await prisma.typingSession.findUnique({ where: { id: boSession.id } });
  assert.deepEqual([b.learnerId, b.status, b.endReason, b.inputMethod], [bo.id, 'ENDED_EARLY', 'exited', 'touch']);
});

it('conflicting writers and other learners cannot touch a session', async () => {
  const clash = { ...annEvents[3], id: crypto.randomUUID() };
  const r = await upload(annC, batch(annTicket, annSession, [clash]));
  assert.deepEqual([r.status, r.json.code], [409, 'rejected']);
  // Bo's sign-in with Ann's ticket (shared device): held for Ann, never re-attributed.
  const swapped = await upload(boC, batch(annTicket, session(), events([['session_start', { leap: 0, resumed: false }]])));
  assert.deepEqual([swapped.status, swapped.json.code], [409, 'other-learner']);
  // Bo's own ticket can't append to Ann's session id.
  const hijack = await upload(boC, batch(boTicket, annSession, events([['stage', { stage: 'mountains', leap: 20 }]], 12, 99999)));
  assert.equal(hijack.status, 409);
  assert.equal(await prisma.typingEvent.count({ where: { sessionId: annSession.id } }), 12);
  // A learner can read their own session but not someone else's.
  assert.equal((await annC.call(`/api/typing/session/${annSession.id}`)).status, 200);
  assert.equal((await boC.call(`/api/typing/session/${annSession.id}`)).status, 404);
  // Signed out: kept on the device.
  const out = await client().call('/api/typing/batch', { method: 'POST', body: batch(annTicket, session(), []) });
  assert.deepEqual([out.status, out.json.code], [401, 'signed-out']);
});

it('the teacher sees partial sessions; other teachers and guests see nothing', async () => {
  const base = `/instruct/class/${klass.id}/typing`;
  const dash = await teacherAC.call(base);
  assert.equal(dash.status, 200);
  assert.match(dash.text, /Ann T/);
  const csv = await teacherAC.call(`${base}/export`);
  assert.equal(csv.status, 200);
  const annRow = csv.text.split('\n').find((l) => l.startsWith('Ann T,'));
  assert.match(annRow, /^Ann T,1,0,1,/, 'one session, partial');
  const learnerCsv = await teacherAC.call(`${base}/export?learner=${ann.id}`);
  assert.match(learnerCsv.text, new RegExp(annSession.id));
  assert.equal((await teacherAC.call(`${base}/learner/${ann.id}`)).status, 200);
  assert.equal((await teacherAC.call(`${base}/session/${annSession.id}`)).status, 200);

  const other = await teacher(teacherB.email, PIN_B);
  for (const path of [base, `${base}/export`, `${base}/export?learner=${ann.id}`, `${base}/learner/${ann.id}`, `${base}/session/${annSession.id}`, `${base}/pins`]) {
    const r = await other.call(path);
    assert.equal(r.status, 404, `other teacher: ${path}`);
    assert.doesNotMatch(r.text, /Ann T/);
  }
  for (const action of [{ action: 'settings', settings: { letterSet: 'all', pace: 'easy', scope: 'full' } }, { action: 'enable-pins' }, { action: 'add-students', students: 'Eve X' }]) {
    assert.equal((await other.call('/api/instruct/typing', { method: 'POST', body: { classId: klass.id, ...action } })).status, 404);
  }
  const guest = client();
  assert.equal((await guest.call(base)).status, 307, 'guests are sent to sign in');
  assert.equal((await guest.call(`${base}/export`)).status, 404);
  // A student session is not an instructor session.
  assert.equal((await annC.call(`${base}/export`)).status, 404);
});

it('forged or legacy unsigned cookies are ignored', async () => {
  const forged = client();
  forged.jar.set('ll_instructor', encodeURIComponent(JSON.stringify({ instructorId: teacherA.id })));
  assert.equal((await forged.call(`/instruct/class/${klass.id}/typing/export`)).status, 404);
  forged.jar.set('ll_session', encodeURIComponent(JSON.stringify({ learnerId: ann.id, classId: klass.id, via: 'pin' })));
  const r = await forged.call('/api/typing/batch', { method: 'POST', body: batch(annTicket, session(), []) });
  assert.equal(r.json.code, 'signed-out');
});

it('name-only sign-in can play but does not record; PINs fix it', async () => {
  const open = await prisma.class.create({ data: { orgId: orgA.id, name: `Open ${tag}`, classCode: `OPEN-${tag}`.toUpperCase(), minAuthTier: 0 } });
  const assign = await teacherAC.call('/api/instruct/typing', { method: 'POST', body: { classId: open.id, action: 'assign' } });
  assert.equal(assign.status, 200, assign.text);
  // Registers on this device (verified), then a classmate signs in by typing the same name.
  const reg = client();
  assert.equal((await reg.call('/api/join', { method: 'POST', body: { classCode: open.classCode, name: 'Cy Open', create: true } })).status, 200);
  const regCfg = await ticketFor(reg);
  assert.ok(regCfg, 'registering on this device is a verified sign-in');
  const impostor = client();
  assert.equal((await impostor.call('/api/join', { method: 'POST', body: { classCode: open.classCode, name: 'Cy Open' } })).status, 200);
  const impostorCfg = await ticketFor(impostor);
  assert.deepEqual(Object.keys(impostorCfg), ['settings'], 'a name-only sign-in gets the practice settings but no ticket, key, or resume');
  const sneaky = await upload(impostor, batch(regCfg.ticket, session(), events([['session_start', { leap: 0, resumed: false }]])));
  assert.equal(sneaky.status, 403, 'a stolen ticket does not help a name-only sign-in');
  // Teacher turns on PINs: the class becomes PIN-only and everyone has one.
  assert.equal((await teacherAC.call('/api/instruct/typing', { method: 'POST', body: { classId: open.id, action: 'enable-pins' } })).status, 200);
  const after = await prisma.class.findUnique({ where: { id: open.id }, include: { roster: { include: { learner: true } } } });
  assert.equal(after.minAuthTier, 1);
  assert.ok(after.roster.every((r) => r.learner.pin));
  const byName = await client().call('/api/join', { method: 'POST', body: { classCode: open.classCode, name: 'Cy Open' } });
  assert.notEqual(byName.status, 200, 'name-only sign-in is no longer accepted');
});

it('repeated wrong PINs lock that learner out for a while', async () => {
  const c = client();
  const wrong = ann.pin === '0000' ? '1111' : '0000';
  for (let i = 0; i < 5; i++) assert.equal((await c.call('/api/join', { method: 'POST', body: { classCode: klass.classCode, learnerId: ann.id, pin: wrong } })).status, 401);
  const locked = await c.call('/api/join', { method: 'POST', body: { classCode: klass.classCode, learnerId: ann.id, pin: ann.pin } });
  assert.equal(locked.status, 429);
  await prisma.signInFailure.deleteMany({ where: { learnerId: ann.id } });
});

it('a learner on two classes keeps separate queues; tickets never cross classes', async () => {
  const second = await prisma.class.create({ data: { orgId: orgA.id, name: `Second ${tag}`, classCode: `TWO-${tag}`.toUpperCase(), minAuthTier: 1 } });
  await prisma.rosterEntry.create({ data: { classId: second.id, learnerId: ann.id } });
  assert.equal((await teacherAC.call('/api/instruct/typing', { method: 'POST', body: { classId: second.id, action: 'assign' } })).status, 200);
  const inFirst = await ticketFor(await student(klass.classCode, ann.id, ann.pin));
  const inSecondC = await student(second.classCode, ann.id, ann.pin);
  const inSecond = await ticketFor(inSecondC);
  assert.notEqual(inFirst.k, inSecond.k, 'one device queue per learner and class');
  // Practice queued in the first class can't be uploaded while signed into the second.
  const r = await upload(inSecondC, batch(inFirst.ticket, session({ letterSet: 'home', pace: 'medium', scope: 'full' }), events([['session_start', { leap: 0, resumed: false }]])));
  assert.deepEqual([r.status, r.json.code], [409, 'other-learner']);
});

it('a resumed session reports its real last-activity time, not start + session clock', async () => {
  const s = { ...session({ letterSet: 'home', pace: 'medium', scope: 'full' }), startedAt: Date.now() - 4 * 3600_000 };
  const early = events([['session_start', { leap: 0, resumed: false }], ['target', { target: 'f', kind: 'letter', leap: 1 }]]).map((e) => ({ ...e, at: s.startedAt + e.t }));
  assert.equal((await upload(annC, batch(annTicket, s, early))).status, 200);
  // Resumed four hours later: the session clock continues (t is small), the wall clock doesn't.
  const later = events([['session_start', { leap: 0, resumed: true }], ['target', { target: 'j', kind: 'letter', leap: 1 }]], 2, 2000).map((e) => ({ ...e, at: Date.now() }));
  assert.equal((await upload(annC, batch(annTicket, s, later))).status, 200);
  const row = await prisma.typingSession.findUnique({ where: { id: s.id } });
  assert.ok(Date.now() - row.lastActivityAt.getTime() < 60_000, `lastActivityAt ${row.lastActivityAt.toISOString()}`);
  const page = await teacherAC.call(`/instruct/class/${klass.id}/typing/session/${s.id}`);
  assert.match(page.text, /in progress/);
});

it('parallel PIN guesses cannot get past the lockout', async () => {
  const wrong = bo.pin === '0000' ? '1111' : '0000';
  const tries = await Promise.all(Array.from({ length: 15 }, () =>
    client().call('/api/join', { method: 'POST', body: { classCode: klass.classCode, learnerId: bo.id, pin: wrong } })));
  const checked = tries.filter((r) => r.status === 401).length;
  assert.ok(checked <= 5, `${checked} guesses were checked`);
  assert.equal(tries.filter((r) => r.status === 429).length, 15 - checked);
  await prisma.signInFailure.deleteMany({ where: { learnerId: bo.id } });
});

it('a name-only sign-in cannot read the typing record it signed in as', async () => {
  const open = await prisma.class.findFirst({ where: { classCode: `OPEN-${tag}`.toUpperCase() } });
  await prisma.class.update({ where: { id: open.id }, data: { minAuthTier: 0 } });
  const reg = client();
  assert.equal((await reg.call('/api/join', { method: 'POST', body: { classCode: open.classCode, name: 'Dee Open', create: true } })).status, 200);
  const cfg = await ticketFor(reg);
  const s = session();
  assert.equal((await upload(reg, batch(cfg.ticket, s, events([['session_start', { leap: 0, resumed: false }]])))).status, 200);
  const byName = client();
  assert.equal((await byName.call('/api/join', { method: 'POST', body: { classCode: open.classCode, name: 'Dee Open' } })).status, 200);
  assert.equal((await byName.call(`/api/typing/session/${s.id}`)).status, 403);
  assert.doesNotMatch((await byName.call('/play/letter-leaper')).text, /reached leap/);
  assert.equal((await reg.call(`/api/typing/session/${s.id}`)).status, 200);
});

// Decodes the iframe's #cfg= (or null when the page passes no config).
async function cfgOf(c) {
  const page = await c.call('/play/letter-leaper');
  assert.equal(page.status, 200);
  const src = page.text.match(/src="(\/games\/letter-leaper\/index\.html[^"]*)"/)[1];
  const m = src.match(/#cfg=([A-Za-z0-9_-]+)/);
  return { page, cfg: m ? JSON.parse(Buffer.from(m[1], 'base64url').toString()) : null };
}

it('name-only players get the teacher settings but no tracking credentials', async () => {
  const open = await prisma.class.create({ data: { orgId: orgA.id, name: `Words ${tag}`, classCode: `WRD-${tag}`.toUpperCase(), minAuthTier: 0 } });
  const set = await teacherAC.call('/api/instruct/typing', { method: 'POST', body: { classId: open.id, action: 'settings', settings: { letterSet: 'top', pace: 'hard', scope: 'words' } } });
  assert.equal(set.status, 200, set.text);
  const reg = client();
  assert.equal((await reg.call('/api/join', { method: 'POST', body: { classCode: open.classCode, name: 'Eli Words', create: true } })).status, 200);
  const byName = client();
  assert.equal((await byName.call('/api/join', { method: 'POST', body: { classCode: open.classCode, name: 'Eli Words' } })).status, 200);

  const nameOnly = await cfgOf(byName);
  assert.deepEqual(nameOnly.cfg, { settings: { letterSet: 'top', pace: 'hard', scope: 'words' } }, 'settings only: no ticket, key, or resume');
  assert.match(nameOnly.page.text, /Words to the stars \(50\)/);
  assert.match(nameOnly.page.text, /set by your teacher/);
  assert.match(nameOnly.page.text, /Sign in with your PIN to see your saved progress/);

  const verified = await cfgOf(reg);
  assert.deepEqual(verified.cfg.settings, { letterSet: 'top', pace: 'hard', scope: 'words' });
  assert.ok(verified.cfg.ticket && verified.cfg.k, 'verified players keep recording');
  // The name-only player can't use the verified player's ticket either.
  const r = await upload(byName, batch(verified.cfg.ticket, session({ letterSet: 'top', pace: 'hard', scope: 'words' }), events([['session_start', { leap: 100, resumed: false }]])));
  assert.equal(r.status, 403);
});

it('classes without teacher settings let players choose (no config for name-only players)', async () => {
  const free = await prisma.class.create({ data: { orgId: orgA.id, name: `Free ${tag}`, classCode: `FRE-${tag}`.toUpperCase(), minAuthTier: 0 } });
  const mod = await prisma.module.findFirst({ where: { orgId: orgA.id, title: 'Letter Leaper: Moonbound' } });
  await prisma.classModule.create({ data: { classId: free.id, moduleId: mod.id } }); // assigned the Windsor way: no TypingAssignment
  const reg = client();
  assert.equal((await reg.call('/api/join', { method: 'POST', body: { classCode: free.classCode, name: 'Fay Free', create: true } })).status, 200);
  const byName = client();
  assert.equal((await byName.call('/api/join', { method: 'POST', body: { classCode: free.classCode, name: 'Fay Free' } })).status, 200);
  const nameOnly = await cfgOf(byName);
  assert.equal(nameOnly.cfg, null, 'unchanged from before: the game alone, players choose');
  assert.match(nameOnly.page.text, /Choose your letters and difficulty in the game/);
  const verified = await cfgOf(reg);
  assert.equal(verified.cfg.settings, null);
  assert.ok(verified.cfg.ticket);
  // A free-choice session records what was actually played.
  const s = session({ letterSet: 'bottom', pace: 'medium', scope: 'full' });
  assert.equal((await upload(reg, batch(verified.cfg.ticket, s, events([['session_start', { leap: 0, resumed: false }]])))).status, 200);
  const row = await prisma.typingSession.findUnique({ where: { id: s.id } });
  assert.deepEqual([row.letterSet, row.pace], ['bottom', 'medium']);
});

it('org wipes (used by every seed) still work once typing data exists', async () => {
  const { wipeOrg } = await import('../prisma/org-wipe.mjs');
  assert.ok(await prisma.typingSession.count({ where: { class: { orgId: orgA.id } } }) > 0);
  await wipeOrg(prisma, orgA.name);
  assert.equal(await prisma.org.count({ where: { id: orgA.id } }), 0);
  assert.equal(await prisma.typingSession.count({ where: { classId: klass.id } }), 0);
  await wipeOrg(prisma, orgB.name);
});

