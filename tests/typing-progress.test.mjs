// Unit tests for Letter Leaper progress: metric formulas, event validation,
// deduplication, comparable trends, feedback rules, and token signing.
// Run: node --test tests/typing-progress.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarizeSession, phaseMetrics, poolPhases, inputMethodOf, IDLE_CAP_MS } from '../lib/typing-metrics.ts';
import { parseBatch, planInsert, MEASUREMENT_VERSION } from '../lib/typing-events.ts';
import { trends, difficultKeys, teachingSuggestion, learnerFeedback, comparableKey, sessionState, resumableSession, STALE_MS } from '../lib/typing-report.ts';

process.env.SESSION_SECRET = 'test-secret';
const { signToken, verifyToken } = await import('../lib/signed-token.ts');

// ---- helpers --------------------------------------------------------------
// A tiny script language for events: each call appends with increasing seq/t.
function script() {
  const ev = [];
  let seq = 0, t = 0;
  const add = (type, data, dt = 100) => { t += dt; ev.push({ seq: seq++, t, type, ...data }); };
  const api = {
    ev,
    start: (leap = 0) => (add('session_start', { leap, resumed: false }, 0), api),
    target: (target, leap) => (add('target', { target, kind: target.length > 1 ? 'word' : 'letter', leap }), api),
    key: (exp, got, pos, rt, src = 'kbd') => (add('key', { exp, got, pos, ok: exp === got, rt, src }), api),
    complete: (target, leap) => (add('complete', { target, leap }), api),
    timeout: (target, pos, rt) => (add('timeout', { target, pos, rt }), api),
    pause: (reason = 'user') => (add('pause', { reason }, 5000), api),
    resume: (reason = 'user') => (add('resume', { reason }, 60000), api),
    end: (reason, leap) => (add('end', { reason, leap }), api),
  };
  return api;
}
// Letter target typed right first time.
const clean = (s, letter, leap, rt = 1000) => s.target(letter, leap).key(letter, letter, 0, rt).complete(letter, leap);

const row = (summary, extra = {}) => ({
  id: crypto.randomUUID(), learnerId: 'L1', startedAt: new Date('2026-10-01T10:00:00Z'), lastActivityAt: new Date('2026-10-01T10:10:00Z'),
  endedAt: null, status: 'COMPLETED', endReason: 'completed', letterSet: 'all', pace: 'relaxed', scope: 'full', hints: true,
  inputMethod: inputMethodOf(summary), startLeap: 0, furthestLeap: summary.furthestLeap, activeMs: 600000, pauseMs: 0, animationMs: 0, hiddenMs: 0,
  summary, ...extra,
});

// A letter session with `n` targets where `bad` letters are each mistyped once.
function letterSession({ n = 30, bad = {}, rt = 1000, src = 'kbd' } = {}) {
  const s = script().start();
  const letters = 'asdfghjklqwertyuiopzxcvbnm';
  for (let i = 0; i < n; i++) {
    const L = letters[i % letters.length];
    s.target(L, i + 1);
    if (bad[L]) s.key(L, bad[L], 0, rt, src);
    s.key(L, L, 0, rt, src).complete(L, i + 1);
  }
  return summarizeSession(s.ev);
}

// ---- metric formulas -------------------------------------------------------
test('counts correct, incorrect, and first-try targets from key events', () => {
  const s = script().start();
  clean(s, 'f', 1, 1000);
  s.target('j', 2).key('j', 'k', 0, 800).key('j', 'j', 0, 600).complete('j', 2);
  const sum = summarizeSession(s.ev);
  const p = sum.phases.letter;
  assert.equal(p.attempts, 3);
  assert.equal(p.correct, 2);
  assert.equal(p.firstTry, 1);
  assert.equal(p.targetsResolved, 2);
  assert.deepEqual(p.confusions, { j: { k: 1 } });
  assert.deepEqual(p.keys.j, { n: 2, c: 1, to: 0 });
  const m = phaseMetrics(p);
  assert.equal(m.accuracy, 2 / 3);
  assert.equal(m.firstAttemptAccuracy, 0.5);
  // 2 correct over 2.4 s of response time = 50 correct chars/minute.
  assert.equal(p.responseMs, 2400);
  assert.equal(m.correctCpm, 50);
  assert.equal(m.attemptedCpm, 75);
  assert.equal(m.recoveryRate, 1);
  assert.equal(sum.furthestLeap, 2);
});

test('timeouts are separate from wrong keys and never invent a keystroke', () => {
  const s = script().start().target('g', 1).timeout('g', 0, 8000).target('h', 2);
  s.key('h', 'h', 0, 1000).complete('h', 2);
  const p = summarizeSession(s.ev).phases.letter;
  assert.equal(p.attempts, 1, 'only the real keystroke is an attempt');
  assert.equal(p.timeouts, 1);
  assert.deepEqual(p.confusions, {});
  assert.deepEqual(p.keys.g, { n: 0, c: 0, to: 1 });
  assert.equal(p.responseMs, 9000, 'the timed-out wait is active practice time');
  const m = phaseMetrics(p);
  assert.equal(m.timeoutRate, 0.5);
  assert.equal(m.firstAttemptAccuracy, 0.5);
  assert.equal(m.accuracy, 1);
});

test('pauses do not touch response time (the game clock stops); idle waits are capped', () => {
  const paused = script().start().target('a', 1).pause().resume().key('a', 'a', 0, 1200).complete('a', 1);
  const p = summarizeSession(paused.ev).phases.letter;
  assert.equal(p.responseMs, 1200, 'a 60 s pause between events adds nothing');
  const idle = script().start().target('a', 1).key('a', 'a', 0, IDLE_CAP_MS + 45000).complete('a', 1);
  const q = summarizeSession(idle.ev).phases.letter;
  assert.equal(q.responseMs, IDLE_CAP_MS);
  assert.equal(q.idleMs, 45000);
  assert.deepEqual(q.firstCharRt, [], 'idle waits stay out of timing medians');
});

test('word metrics: CWPM, inter-character timing, and phases kept apart', () => {
  const s = script().start(100);
  s.target('cat', 101).key('c', 'c', 0, 900).key('a', 'a', 1, 300).key('t', 't', 2, 500).complete('cat', 101);
  s.target('go', 102).key('g', 'g', 0, 1100).key('o', 'p', 1, 400).key('o', 'o', 1, 200).complete('go', 102);
  const sum = summarizeSession(s.ev);
  const w = sum.phases.word;
  assert.equal(sum.phases.letter.attempts, 0);
  assert.equal(w.wordsCompleted, 2);
  assert.equal(w.firstTry, 1);
  assert.deepEqual(w.firstCharRt, [900, 1100]);
  assert.deepEqual(w.interCharRt, [300, 500], 'the letter after an error is recovery, not fluency');
  const m = phaseMetrics(w);
  assert.equal(m.medianFirstCharMs, 1000);
  assert.equal(m.medianInterCharMs, 400);
  assert.equal(Math.round(m.correctWpm * 100) / 100, Math.round(2 / (3400 / 60000) * 100) / 100);
});

test('streaks follow the game: wrong keys and timeouts reset them', () => {
  const s = script().start();
  clean(s, 'a', 1); clean(s, 's', 2);
  s.target('d', 3).timeout('d', 0, 4000);
  clean(s, 'f', 3);
  const sum = summarizeSession(s.ev);
  assert.equal(sum.bestStreak, 2);
  assert.equal(sum.streak, 1);
});

test('events that do not match the target on screen are skipped and counted', () => {
  const s = script().start().target('a', 1).key('b', 'b', 0, 500).key('a', 'a', 0, 500).complete('a', 1);
  const sum = summarizeSession(s.ev);
  assert.equal(sum.inconsistent, 1);
  assert.equal(sum.phases.letter.attempts, 1);
});

test('input method distinguishes keyboard, on-screen keys, and mixed sessions', () => {
  assert.equal(inputMethodOf(letterSession({ n: 2 })), 'keyboard');
  assert.equal(inputMethodOf(letterSession({ n: 2, src: 'screen' })), 'touch');
  const mixed = script().start();
  mixed.target('a', 1).key('a', 'a', 0, 500, 'kbd').complete('a', 1).target('s', 2).key('s', 's', 0, 500, 'screen').complete('s', 2);
  assert.equal(inputMethodOf(summarizeSession(mixed.ev)), 'mixed');
});

// ---- validation and dedupe -------------------------------------------------
const now = Date.parse('2026-10-26T12:00:00Z');
const batch = (events, extra = {}) => ({
  ticket: 'v1.x.y',
  session: { id: '0d5f1c5e-4a8b-4c33-9a65-1a2b3c4d5e6f', letterSet: 'all', pace: 'relaxed', scope: 'full', hints: true, gameVersion: '2026.10.1', measurementVersion: MEASUREMENT_VERSION, startedAt: now - 60000 },
  clocks: { activeMs: 1000, pauseMs: 0, animationMs: 0, hiddenMs: 0 },
  ignored: { repeat: 0, modifier: 0, composition: 0, paste: 0, nonletter: 0, busy: 0 },
  events: events.map((e) => ({ id: crypto.randomUUID(), ...e })),
  ...extra,
});

test('parseBatch accepts a valid batch and rejects malformed or implausible ones', () => {
  const ok = script().start().target('a', 1).key('a', 'a', 0, 500).complete('a', 1).ev;
  assert.equal(parseBatch(batch(ok), now).ok, true);
  const bad = [
    batch(ok.map((e, i) => (i === 2 ? { ...e, ok: false } : e))), // ok must equal exp === got
    batch(ok.map((e, i) => (i === 2 ? { ...e, got: '1' } : e))), // letters only
    batch([ok[1], ok[0]]), // out of sequence
    batch(ok.map((e, i) => (i === 3 ? { ...e, t: 1 } : e))), // time goes backwards
    batch([{ ...ok[1], seq: 0 }]), // a session's first event must be session_start
  ];
  assert.equal(parseBatch(batch(ok.slice(1)), now).ok, true, 'later batches start mid-session');
  bad.push(batch(ok, { session: { ...batch(ok).session, hints: false } })); // hints follow pace
  bad.push(batch(ok, { session: { ...batch(ok).session, startedAt: now - 30 * 864e5 } })); // too old
  bad.push(batch(ok, { session: { ...batch(ok).session, letterSet: 'numbers' } }));
  bad.push(batch(Array.from({ length: 201 }, (_, i) => ({ ...ok[0], seq: i }))));
  for (const b of bad) assert.equal(parseBatch(b, now).ok, false, JSON.stringify(b.events?.slice(0, 2)));
});

test('planInsert makes retries idempotent and rejects conflicting writers', () => {
  const evs = batch(script().start().target('a', 1).ev).events;
  const stored = evs.map((e) => ({ id: e.id, seq: e.seq }));
  const retry = planInsert(evs, stored);
  assert.deepEqual(retry, { ok: true, fresh: [] });
  const more = { ...evs[1], id: crypto.randomUUID(), seq: 2 };
  assert.deepEqual(planInsert([...evs, more], stored), { ok: true, fresh: [more] });
  const clash = { ...evs[1], id: crypto.randomUUID() };
  assert.equal(planInsert([clash], stored).ok, false, 'a different event at a stored seq');
  assert.equal(planInsert([{ ...evs[0], seq: 9 }], stored).ok, false, 'a stored event id at a new seq');
});

// ---- comparable trends, keys, suggestions, feedback -------------------------
test('trends only compare like-for-like sessions and say when data is thin', () => {
  const day = (d) => new Date(`2026-10-${String(d).padStart(2, '0')}T10:00:00Z`);
  const rows = [
    row(letterSession({ bad: { a: 's', f: 'g', j: 'k' } }), { startedAt: day(1) }),
    row(letterSession({ bad: { a: 's' } }), { startedAt: day(2) }),
    row(letterSession(), { startedAt: day(3), pace: 'steady', hints: false }), // different pace
    row(letterSession({ src: 'screen' }), { startedAt: day(4) }), // different input
  ];
  const groups = trends(rows);
  assert.equal(groups.length, 3);
  const relaxedKbd = groups.find((g) => g.key === comparableKey(rows[0], 'letter'));
  assert.equal(relaxedKbd.points.length, 2);
  assert.equal(relaxedKbd.change.status, 'ok');
  assert.ok(relaxedKbd.change.accuracyPts > 0, 'fewer errors in the later session');
  assert.equal(relaxedKbd.change.recentAttempts, 32, "30 letters cycle a 26-letter alphabet, so 'a' is mistyped twice");
  for (const g of groups.filter((x) => x !== relaxedKbd)) assert.equal(g.change.status, 'not-enough-data');
  // Too-small phases don't count at all.
  assert.equal(trends([row(letterSession({ n: 5 }))]).length, 0);
});

test('difficult keys need enough samples and rank by miss rate (errors + timeouts)', () => {
  const rows = [1, 2, 3].map((d) => row(letterSession({ n: 78, bad: { f: 'd', g: 'h' } }), { startedAt: new Date(`2026-10-0${d}T10:00:00Z`) }));
  const keys = difficultKeys(rows);
  assert.deepEqual(keys.map((k) => k.key).sort(), ['f', 'g']);
  assert.equal(keys[0].samples, 18); // 3 targets × 3 sessions × (wrong + right)
  assert.equal(difficultKeys([row(letterSession({ n: 3, bad: { a: 's' } }))]).length, 0, 'a=2 samples is below the minimum');
});

test('teaching suggestion cites the keys and the comparable sessions', () => {
  const rows = [1, 2, 3].map((d) => row(letterSession({ n: 78, bad: { f: 'd', g: 'h' } }), { startedAt: new Date(`2026-10-0${d}T10:00:00Z`) }));
  const s = teachingSuggestion(rows);
  assert.match(s.text, /^Practise [FG] and [FG] in relaxed mode; these keys had the highest error rate across the last 3 comparable sessions/);
  assert.match(s.basis, /F: 50% of 18/);
  assert.match(teachingSuggestion([row(letterSession({ n: 5 }))]).text, /^Not enough data/);
  const timed = [1, 2].map((d) => {
    const sc = script().start();
    for (let i = 0; i < 30; i++) { const L = 'asdfghjkl'[i % 9]; if (i % 3 === 0) sc.target(L, i + 1).timeout(L, 0, 4000); else clean(sc, L, i + 1); }
    return row(summarizeSession(sc.ev), { startedAt: new Date(`2026-10-0${d}T10:00:00Z`), pace: 'speedy', hints: false });
  });
  assert.match(teachingSuggestion(timed).text, /^Try relaxed pace for a while: 33% of targets timed out/);
});

test('learner feedback: one improvement, one next step, a short summary', () => {
  const before = row(letterSession({ bad: { a: 's', f: 'g', j: 'k', d: 'f' } }), { startedAt: new Date('2026-10-01T10:00:00Z') });
  const after = row(letterSession({ bad: { f: 'g' } }), { startedAt: new Date('2026-10-02T10:00:00Z'), activeMs: 240000 });
  const fb = learnerFeedback(after, [before]);
  // before: a, d, f each appear twice (letters cycle) + j → 7 errors: 30/37; after: f twice → 30/32.
  assert.match(fb.improved, /^Your accuracy went up from 81% to 94%\.$/);
  assert.equal(fb.next, 'Practise the F key next. Look for it on the home row.');
  assert.equal(fb.summary, '30 leaps · 94% accuracy · about 4 minutes of practice');
  const first = learnerFeedback(row(letterSession({ n: 12 })), []);
  assert.match(first.improved, /^Great start/);
  assert.match(learnerFeedback(row(letterSession({ n: 2 }), { activeMs: 30000 }), []).improved, /^You made 2 leaps/);
});

test('session state: unfinished sessions go stale as interrupted; resume candidates', () => {
  const r = row(letterSession({ n: 10 }), { status: 'ACTIVE', endReason: null, lastActivityAt: new Date(now - STALE_MS - 1) });
  assert.equal(sessionState(r, now), 'interrupted');
  assert.equal(sessionState({ ...r, lastActivityAt: new Date(now - 1000) }, now), 'in progress');
  const settings = { letterSet: 'all', pace: 'relaxed', scope: 'full' };
  assert.equal(resumableSession([r], settings, now)?.id, r.id);
  assert.equal(resumableSession([r], { ...settings, pace: 'steady' }, now), null, 'settings changed since');
  assert.equal(resumableSession([{ ...r, lastActivityAt: new Date(now - 2 * 864e5) }], settings, now), null, 'too old');
});

test('pooled phases sum counts and merge per-key tables', () => {
  const a = letterSession({ n: 3, bad: { a: 's' } }).phases.letter;
  const pooled = poolPhases([a, a]);
  assert.equal(pooled.attempts, 8);
  assert.deepEqual(pooled.keys.a, { n: 4, c: 2, to: 0 });
  assert.deepEqual(pooled.confusions, { a: { s: 2 } });
});

// ---- signing -----------------------------------------------------------------
test('signed tokens reject tampering, other purposes, and unsigned JSON', () => {
  const t = signToken('learner', { learnerId: 'A', classId: 'C', via: 'pin' });
  assert.deepEqual(verifyToken('learner', t), { learnerId: 'A', classId: 'C', via: 'pin' });
  assert.equal(verifyToken('instructor', t), null, 'purpose is bound into the MAC');
  const [v, body, sig] = t.split('.');
  const forged = Buffer.from(JSON.stringify({ learnerId: 'B', classId: 'C', via: 'pin' })).toString('base64url');
  assert.equal(verifyToken('learner', `${v}.${forged}.${sig}`), null);
  assert.equal(verifyToken('learner', JSON.stringify({ learnerId: 'A', classId: 'C' })), null, 'legacy unsigned cookies');
  assert.equal(verifyToken('learner', `${v}.${body}.${sig.slice(0, -2)}xx`), null);
});

// ---- review regressions --------------------------------------------------------
test('long idle waits, long-lived tabs, and fast device clocks are accepted (not dropped)', () => {
  const ev = script().start().target('a', 1).key('a', 'a', 0, 45 * 60_000).complete('a', 1).ev; // 45 min on one target
  const b = batch(ev, { clocks: { activeMs: 46 * 60_000, pauseMs: 3 * 864e5, animationMs: 400, hiddenMs: 3 * 864e5 } }); // tab open over a weekend
  b.session.startedAt = now + 2 * 3600_000; // device clock 2 h fast
  b.events = b.events.map((e) => ({ ...e, at: now + 2 * 3600_000 }));
  assert.equal(parseBatch(b, now).ok, true);
  const q = summarizeSession(ev).phases.letter;
  assert.equal(q.responseMs, IDLE_CAP_MS, 'the idle cap, not validation, discounts the long wait');
  assert.equal(parseBatch(batch(ev.map((e) => ({ ...e, at: 'yesterday' }))), now).ok, false);
});

test('"highest yet" only compares the same kind of climb', () => {
  const words = row(summarizeSession(script().start(100).ev), { startedAt: new Date('2026-10-01T10:00:00Z'), scope: 'words' });
  words.summary.furthestLeap = 140;
  const letters = row(letterSession({ n: 40 }), { startedAt: new Date('2026-10-02T10:00:00Z'), scope: 'letters' });
  const earlierLetters = row(letterSession({ n: 12 }), { startedAt: new Date('2026-10-01T09:00:00Z'), scope: 'letters' });
  assert.match(learnerFeedback(letters, [words, earlierLetters]).improved, /leap 40 — your highest yet|accuracy|faster|kept your accuracy/);
  assert.doesNotMatch(learnerFeedback(letters, [words]).improved, /highest yet/, 'no comparable earlier climb');
});
