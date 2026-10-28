// Browser regression tests for the real Letter Leaper game (teacher settings
// for name-only players; after-session feedback). Drives Chrome over the
// DevTools protocol against a running server and a LOCAL database:
//   chrome --headless=new --remote-debugging-port=9333 --user-data-dir=<tmp>
//   TYPING_IT_BASE=http://localhost:3124 TYPING_CDP=http://localhost:9333 \
//     DATABASE_URL=postgresql://…@localhost…/db node --test tests/letter-leaper-browser.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.TYPING_IT_BASE, CDP = process.env.TYPING_CDP;
const enabled = BASE && CDP && /@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL ?? '');
const it = enabled ? test : test.skip;
if (!enabled) console.log('letter-leaper-browser: set TYPING_IT_BASE, TYPING_CDP and a localhost DATABASE_URL to run.');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let prisma, tag, org, ws, id = 0;
const pending = new Map(), apiCalls = [], listeners = [];
let feedbackMode = 'pass'; // how /api/typing/session/* requests are treated: pass | hold:<ms> | fail
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
async function ev(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? 'evaluate failed');
  return r.result.result.value;
}
async function go(path) { await send('Page.navigate', { url: path.startsWith('http') ? path : BASE + path }); await sleep(1800); }
async function key(k) {
  const code = 'Key' + k.toUpperCase(), vk = k.toUpperCase().charCodeAt(0);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, text: k, windowsVirtualKeyCode: vk });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk });
}
const idle = async () => { for (let i = 0; i < 60 && (await ev("state==='playing'&&jumping")); i++) await sleep(50); };
async function leap() { await idle(); for (const c of await ev('target.slice(typed)')) { await key(c); await sleep(100); } await sleep(550); await idle(); }
async function wrongKey() { await idle(); const t = await ev('target[typed]'); await key(t === 'q' ? 'w' : 'q'); await sleep(150); }
async function exitEarly() { await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await sleep(250); await ev("$('restart').click()"); }
const overlayText = () => ev("document.getElementById('practice-overlay')?.textContent ?? ''");
async function joinAs(body) {
  await go('/join');
  const s = await ev(`fetch('/api/logout',{method:'POST'}).then(()=>fetch('/api/join',{method:'POST',headers:{'Content-Type':'application/json'},body:${JSON.stringify(JSON.stringify(body))}})).then(r=>r.status)`);
  assert.equal(s, 200);
}
async function openGame() {
  await go('/play/letter-leaper');
  const src = await ev("document.querySelector('iframe#game').getAttribute('src')");
  await go(src);
  return src;
}

before(async () => {
  if (!enabled) return;
  const { PrismaClient } = await import('@prisma/client');
  prisma = new PrismaClient();
  tag = Date.now().toString(36);
  org = await prisma.org.create({ data: { name: `Browser IT ${tag}` } });
  const tab = await (await fetch(`${CDP}/json/new?about:blank`, { method: 'PUT' })).json();
  ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === 'Network.requestWillBeSent' && m.params.request.url.includes('/api/')) apiCalls.push(m.params.request.url.replace(BASE, ''));
    if (m.method === 'Fetch.requestPaused') {
      const rid = m.params.requestId;
      if (feedbackMode === 'fail') send('Fetch.failRequest', { requestId: rid, errorReason: 'Failed' });
      else if (feedbackMode.startsWith('hold:')) setTimeout(() => send('Fetch.continueRequest', { requestId: rid }), Number(feedbackMode.slice(5)));
      else send('Fetch.continueRequest', { requestId: rid });
    }
    for (const l of listeners) l(m);
  };
  await send('Page.enable'); await send('Network.enable'); await send('Runtime.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*/api/typing/session/*' }] });
});
after(async () => {
  ws?.close();
  if (prisma) {
    // wipeOrg doesn't remove LearnerEvent rows (pre-existing), so clear ours first.
    await prisma.learnerEvent.deleteMany({ where: { learner: { roster: { some: { class: { orgId: org.id } } } } } });
    const { wipeOrg } = await import('../prisma/org-wipe.mjs');
    await wipeOrg(prisma, org.name);
    await prisma.$disconnect();
  }
});

async function teacherClass(settings, { pins }) {
  const t = await prisma.instructor.create({ data: { displayName: 'Browser Teacher', email: `bt-${tag}-${Math.random().toString(36).slice(2)}@test.local`, pin: '6161', orgId: org.id } });
  const login = await fetch(BASE + '/api/instruct/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: t.email, pin: '6161' }) });
  const cookie = login.headers.getSetCookie()[0].split(';')[0];
  const call = (body) => fetch(BASE + '/api/instruct/typing', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: BASE, Cookie: cookie }, body: JSON.stringify(body) }).then((r) => r.json());
  if (pins) {
    const { classId } = await call({ action: 'create-class', orgId: org.id, name: `Browser ${tag}`, band: 'YOUTH', students: 'Ivy B\nJon B', settings });
    return prisma.class.findUnique({ where: { id: classId }, include: { roster: { include: { learner: true } } } });
  }
  const k = await prisma.class.create({ data: { orgId: org.id, name: `Open ${tag}`, classCode: `BOP-${tag}`.toUpperCase(), minAuthTier: 0 } });
  await call({ classId: k.id, action: 'settings', settings });
  return k;
}

it('a name-only player follows the teacher settings (words, hard) and nothing is recorded', async () => {
  const k = await teacherClass({ letterSet: 'top', pace: 'hard', scope: 'words' }, { pins: false });
  await joinAs({ classCode: k.classCode, name: 'Kim Open', create: true });
  await joinAs({ classCode: k.classCode, name: 'Kim Open' }); // now name-only
  apiCalls.length = 0;
  const src = await openGame();
  assert.match(src, /#cfg=/);
  const setup = await ev("({pace:$('pace').value,paceLocked:$('pace').disabled,setHidden:$('letter-set').closest('label').hidden,note:document.querySelector('.track-note')?.textContent,tracked:document.body.classList.contains('tracked')})");
  assert.deepEqual(setup, { pace: 'hard', paceLocked: true, setHidden: true, note: 'Your teacher set this practice. Sign in with your PIN to save your progress.', tracked: false });
  await ev("$('username').value='KimO'"); await ev("$('start').click()"); await sleep(1500);
  assert.equal(await ev('steps'), 100, 'word practice starts at the moon');
  assert.equal(await ev('target.length > 1'), true, 'targets are words');
  await leap();
  assert.equal(await ev('steps'), 101);
  assert.deepEqual(apiCalls.filter((u) => u.startsWith('/api/typing')), [], 'no tracking requests');
  assert.equal(await prisma.typingSession.count({ where: { classId: k.id } }), 0);
});

let klass, ivy;
it('offline early exit: feedback shows that session’s own results, then uploads on reconnect', async () => {
  klass = await teacherClass({ letterSet: 'home', pace: 'easy', scope: 'words' }, { pins: true });
  ivy = klass.roster.find((r) => r.learner.displayName === 'Ivy B').learner;
  await joinAs({ classCode: klass.classCode, learnerId: ivy.id, pin: ivy.pin });
  await openGame();
  await ev("$('start').click()"); await sleep(500);
  await leap(); await leap();
  await send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await wrongKey(); await leap(); await leap();
  const before = await ev('leaper.snapshot()');
  assert.ok(before.attempts > before.correct, 'an incorrect answer was made');
  await exitEarly();
  assert.equal(await ev('steps'), 0, 'the game has reset its counters');
  await sleep(6800); // offline: fallback feedback after the upload wait
  const text = await overlayText();
  const pctRight = Math.round(before.correct / before.attempts * 100);
  assert.match(text, new RegExp(`Reached leap ${before.leap} · ${pctRight}% accuracy \\(${before.correct} of ${before.attempts} answers right\\)`), text);
  assert.match(text, /kept on this device/);
  assert.doesNotMatch(text, /no answers yet|Reached leap 0/);
  await send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await ev("document.getElementById('practice-overlay')?.querySelector('button')?.click()");
  await sleep(5000);
  const s = await prisma.typingSession.findFirst({ where: { learnerId: ivy.id }, orderBy: { startedAt: 'desc' } });
  assert.deepEqual([s.status, s.furthestLeap, s.attempts + s.timeouts - s.correct > 0], ['ENDED_EARLY', before.leap, true]);
});

it('a slow feedback request still shows the right session; a failed one falls back to its own numbers', async () => {
  feedbackMode = 'hold:3000';
  await ev("$('start').click()"); await sleep(500);
  await leap(); await wrongKey(); await leap();
  await exitEarly();
  await sleep(1200);
  assert.equal(await overlayText(), '', 'nothing shown before the slow request resolves');
  await sleep(3500);
  assert.match(await overlayText(), /Something that improved.*Try next/s);
  await ev("document.getElementById('practice-overlay').querySelector('button').click()");

  feedbackMode = 'fail';
  await ev("$('start').click()"); await sleep(500);
  await leap(); await leap(); await leap();
  const snap = await ev('leaper.snapshot()');
  await exitEarly(); await sleep(2500);
  const text = await overlayText();
  assert.match(text, new RegExp(`Reached leap ${snap.leap} · 100% accuracy \\(${snap.correct} of ${snap.attempts} answers right\\)`), text);
  assert.match(text, /saved to your learning record/);
  await ev("document.getElementById('practice-overlay').querySelector('button').click()");
  feedbackMode = 'pass';
});

it('starting another game before feedback resolves: no stale overlay, new counters untouched', async () => {
  feedbackMode = 'hold:4000';
  await ev("$('start').click()"); await sleep(500);
  await leap(); await leap();
  await exitEarly(); await sleep(300);
  await ev("$('start').click()"); await sleep(500); // new climb before feedback arrives
  await leap();
  await sleep(5000);
  assert.equal(await overlayText(), '', 'old feedback does not cover the new climb');
  const snap = await ev('leaper.snapshot()');
  assert.equal(snap.state, 'playing');
  assert.equal(snap.leap, 101, 'the new climb keeps its own progress');
  assert.ok(snap.correct >= 2 && snap.correct <= 3 && snap.attempts === snap.correct, `only the new climb's one word: ${JSON.stringify(snap)}`);
  feedbackMode = 'pass';
  await exitEarly(); await sleep(3000);
  await ev("document.getElementById('practice-overlay')?.querySelector('button')?.click()");
  const sessions = await prisma.typingSession.findMany({ where: { learnerId: ivy.id }, orderBy: { startedAt: 'asc' } });
  assert.equal(sessions.length, 5);
  assert.ok(sessions.every((s) => s.status === 'ENDED_EARLY'));
});

it('a completed climb shows its feedback in the finish screen', async () => {
  await ev("$('start').click()"); await sleep(500);
  const t0 = Date.now();
  while (Date.now() - t0 < 90_000 && (await ev("state!=='finished'"))) {
    await ev("if(state==='playing'&&!jumping)input(target[typed],'kbd')");
    await sleep(25);
  }
  await sleep(4000);
  const fin = await ev("({hidden:$('finish').hidden,text:$('finish').querySelector('.practice-feedback')?.textContent ?? ''})");
  assert.equal(fin.hidden, false);
  assert.match(fin.text, /YOUR PRACTICE.*50 leaps · 100% accuracy.*Something that improved.*Try next/s);
  const done = await prisma.typingSession.findFirst({ where: { learnerId: ivy.id }, orderBy: { startedAt: 'desc' } });
  assert.deepEqual([done.status, done.furthestLeap], ['COMPLETED', 150]);
});

it('free choice (no teacher settings): a verified player records what they chose, and a resume locks to it', async () => {
  const free = await prisma.class.create({ data: { orgId: org.id, name: `Free ${tag}`, classCode: `BFR-${tag}`.toUpperCase(), minAuthTier: 0 } });
  const mod = await prisma.module.findFirst({ where: { orgId: org.id, title: 'Letter Leaper: Moonbound' } });
  await prisma.classModule.create({ data: { classId: free.id, moduleId: mod.id } });
  await joinAs({ classCode: free.classCode, name: 'Lia Free', create: true }); // registered here: verified
  await openGame();
  assert.equal(await ev("$('pace').disabled || $('letter-set').disabled"), false, 'players choose');
  await ev("$('letter-set').value='top'; $('pace').value='medium'; $('start').click()"); await sleep(500);
  await leap(); await leap();
  await sleep(4500); // let it upload
  await openGame(); // leave mid-climb and come back
  await sleep(800);
  const offer = await ev("({label:$('start').textContent,set:$('letter-set').value,pace:$('pace').value,locked:$('pace').disabled})");
  assert.match(offer.label, /Resume at leap 2/);
  assert.deepEqual([offer.set, offer.pace, offer.locked], ['top', 'medium', true], 'locked to the climb being resumed');
  await ev("$('start-fresh').click()");
  assert.equal(await ev("$('pace').disabled"), false, 'starting fresh restores the choice');
  const s = await prisma.typingSession.findFirst({ where: { classId: free.id }, orderBy: { startedAt: 'asc' } });
  assert.deepEqual([s.letterSet, s.pace, s.furthestLeap], ['top', 'medium', 2]);
});
