// Falling-platform rules for the medium and hard difficulties in
// public/games/letter-leaper/core.js, run in Node with a fake clock: the
// per-letter deadline on the active clock (medium 8 s, hard 4 s), wrong-letter
// falls (medium on the third miss, hard on the first), timeout collapses,
// recovery to the same leap, deadline races, pauses, and exactly-once
// tracking. A fall sends Milo 10 leaps down. Hard is words from the first
// leap, 2 → 5 letters. Easy never falls.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../public/games/letter-leaper/core.js', import.meta.url), 'utf8');

function game({ reduced = false, pace = 'hard' } = {}) {
  let now = 1000, rafCb = null;
  const ctx = vm.createContext({
    performance: { now: () => now },
    requestAnimationFrame: (cb) => { rafCb = cb; },
    matchMedia: () => ({ matches: reduced, addEventListener() {} }),
    window: { dispatchEvent: (e) => { ctx.__dom.push(e.type); } },
    CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init?.detail; } },
    crypto: { randomUUID: () => '00000000-0000-4000-8000-000000000000' },
    console,
    Math,
  });
  vm.runInContext(source, ctx);
  const run = (code) => vm.runInContext(code, ctx);
  ctx.__hooks = []; ctx.__views = []; ctx.__dom = [];
  run('hooks.push((type, data) => globalThis.__hooks.push([type, data]))');
  run('views.push((type, d) => globalThis.__views.push([type, d]))');
  const g = {
    run,
    // Animation frames every `step` ms.
    advance(ms, step = 16) { for (let t = 0; t < ms; t += step) { now += Math.min(step, ms - t); rafCb(now); } },
    // Time passes with no frame (an input arriving between frames).
    pass(ms) { now += ms; },
    start(opts = {}) { run(`readSettings = () => (${JSON.stringify({ set: opts.set ?? 'all', pace })}); scope = ${JSON.stringify(opts.scope ?? 'full')};`); run('start()'); },
    type(ch) { run(`input(${JSON.stringify(ch)}, 'kbd')`); },
    // The rest of the current target, letter by letter.
    word() { for (const ch of g.target.slice(g.run('typed'))) g.type(ch); },
    wrong() { const t = run('target[typed]'); return t === 'q' ? 'w' : 'q'; },
    hooks: (type) => ctx.__hooks.filter(([t]) => t === type),
    views: (type) => ctx.__views.filter(([t]) => t === type),
    get steps() { return run('steps'); },
    get target() { return run('target'); },
    get left() { return run('deadlineLeft()'); },
    get active() { return run('clock.active'); },
  };
  return g;
}
const FALL = 1500, MEDIUM = 8000, HARD = 4000;

test('easy never falls: no deadline, wrong keys are ordinary misses', () => {
  const g = game({ pace: 'easy' });
  g.start();
  assert.equal(g.left, Infinity);
  g.advance(20000);
  for (let i = 0; i < 4; i++) g.type(g.wrong());
  assert.equal(g.views('fall').length, 0);
  assert.equal(g.views('miss').length, 4);
  assert.equal(g.hooks('timeout').length, 0);
  assert.equal(g.run('jumping'), false);
});

test('a correct letter before the deadline leaps exactly once', () => {
  const g = game({ pace: 'medium' });
  g.start();
  g.advance(5000);
  g.word();
  g.advance(500);
  assert.equal(g.steps, 1);
  assert.equal(g.hooks('complete').length, 1);
  assert.equal(g.views('fall').length, 0);
  // The next target gets a fresh eight seconds.
  assert.ok(g.left > MEDIUM - 100 && g.left <= MEDIUM, `left ${g.left}`);
});

test('hard: one wrong letter is one incorrect attempt and a fall, then down to the bottom (fewer than 10 leaps up)', () => {
  const g = game();
  g.start();
  g.leap = () => { g.word(); g.advance(500); };
  g.leap(); g.leap();
  const before = g.target[0];
  g.advance(1200);
  g.type(g.wrong());
  assert.equal(g.views('fall').length, 1);
  assert.equal(g.views('fall')[0][1].kind, 'miss');
  const keys = g.hooks('key');
  assert.equal(keys.at(-1)[1].ok, false);
  assert.equal(g.run('attempts'), 5, 'two 2-letter words, then one wrong letter');
  // Input during the failed jump and fall is ignored (not attempts, not keys).
  g.type(before); g.type(g.wrong());
  assert.equal(g.hooks('key').length, keys.length);
  g.advance(FALL + 32);
  assert.equal(g.views('recover').length, 1);
  assert.deepEqual([g.views('recover')[0][1].from, g.views('recover')[0][1].leap], [2, 0]);
  assert.equal(g.steps, 0, 'back to the bottom');
  assert.equal(g.hooks('complete').length, 2, 'no leap awarded for the fall');
  assert.equal(g.hooks('timeout').length, 0, 'a wrong letter is not a timeout');
  assert.equal(g.hooks('target').at(-1)[1].leap, 1, 'a fresh target for the first leap');
  assert.equal(g.target.length, 2, 'two-letter words again');
  assert.ok(g.left > HARD - 100, 'the timer restarts once Milo is back');
});

test('medium: the third wrong letter on a target is the fall; the first two are misses with a warning count', () => {
  const g = game({ pace: 'medium' });
  g.start();
  g.type(g.wrong());
  g.type(g.wrong());
  assert.deepEqual(g.views('miss').map(([, d]) => d.left), [2, 1]);
  assert.equal(g.views('fall').length, 0);
  assert.equal(g.run('jumping'), false, 'still on the platform');
  g.type(g.wrong());
  assert.equal(g.views('fall').length, 1);
  assert.equal(g.views('fall')[0][1].kind, 'miss');
  assert.equal(g.run('attempts'), 3);
  assert.equal(g.hooks('key').filter(([, d]) => !d.ok).length, 3);
  // Misses count per target: a fresh target (after the fall, or after a leap) starts again at zero.
  g.advance(FALL + 32);
  g.type(g.wrong()); g.type(g.wrong());
  assert.equal(g.views('fall').length, 1);
  g.word();
  g.advance(500);
  g.type(g.wrong()); g.type(g.wrong());
  assert.equal(g.views('fall').length, 1);
  assert.equal(g.steps, 1);
});

test('the deadline: the platform falls at 8 s (medium) or 4 s (hard) of typing time, recorded once as a timeout', () => {
  for (const [pace, limit] of [['medium', MEDIUM], ['hard', HARD]]) {
    const g = game({ pace });
    g.start();
    g.advance(limit - 100);
    assert.equal(g.views('fall').length, 0, pace);
    g.advance(200);
    assert.equal(g.views('fall').length, 1, pace);
    assert.equal(g.views('fall')[0][1].kind, 'timeout');
    assert.equal(g.hooks('timeout').length, 1);
    assert.equal(g.hooks('key').length, 0, 'no invented keystroke');
    assert.equal(g.run('attempts'), 1);
    g.advance(FALL + 32);
    assert.equal(g.steps, 0);
    assert.equal(g.hooks('timeout').length, 1, 'only once');
    g.advance(limit - 200);
    assert.equal(g.hooks('timeout').length, 1, 'the new time started at recovery');
  }
});

test('deadline races: just before is a leap; at or after the deadline is a timeout, and the key is not recorded', () => {
  const early = game();
  early.start();
  early.advance(HARD - 8);
  early.pass(7); // 3999 ms
  early.word();
  early.advance(500);
  assert.equal(early.steps, 1);
  assert.equal(early.hooks('timeout').length, 0);

  const late = game();
  late.start();
  late.advance(HARD - 8);
  late.pass(8); // exactly 4000 ms, before the next frame
  late.type(late.target[0]);
  assert.equal(late.hooks('timeout').length, 1);
  assert.equal(late.hooks('key').length, 0);
  assert.equal(late.views('fall')[0][1].kind, 'timeout');
  late.advance(FALL + 500);
  assert.equal(late.steps, 0);
  assert.equal(late.hooks('complete').length, 0);
});

test('pausing and hidden tabs stop the deadline; falls and recovery are not typing time', () => {
  const g = game({ pace: 'medium' });
  g.start();
  g.advance(5000);
  g.run("requestPause('user')");
  g.advance(20000);
  assert.equal(g.hooks('timeout').length, 0);
  g.run('resume()');
  g.advance(2800);
  g.run("requestPause('hidden')");
  g.advance(20000);
  g.run('resume()');
  assert.equal(g.hooks('timeout').length, 0);
  g.advance(300);
  assert.equal(g.hooks('timeout').length, 1, 'falls after eight seconds of typing time in total');
  const active = g.active;
  while (g.views('recover').length === 0) g.advance(16); // until Milo is back
  assert.ok(g.active - active < 40, `the fall and recovery add no typing time (${g.active - active} ms)`);
  // A pause during a fall freezes it.
  g.advance(1200);
  g.type(g.wrong()); g.type(g.wrong()); g.type(g.wrong());
  g.advance(300);
  g.run("requestPause('user')");
  g.advance(10000);
  assert.equal(g.views('recover').length, 1);
  g.run('resume()');
  g.advance(FALL);
  assert.equal(g.views('recover').length, 2);
});

test('repeated key presses after a fall: one fall, one incorrect attempt', () => {
  const g = game();
  g.start();
  g.advance(500);
  const w = g.wrong();
  for (let i = 0; i < 5; i++) g.type(w);
  assert.equal(g.views('fall').length, 1);
  assert.equal(g.hooks('key').length, 1);
  assert.equal(g.run('attempts'), 1);
});

test('words: each letter has its own time; a falling wrong letter mid-word brings a fresh word', () => {
  const g = game({ pace: 'medium' });
  g.start({ scope: 'words' });
  assert.equal(g.steps, 100);
  const word = g.target;
  g.advance(7000); g.type(word[0]);
  g.advance(7000);
  assert.equal(g.hooks('timeout').length, 0, 'the second letter has its own eight seconds');
  g.type(g.wrong()); g.type(g.wrong());
  assert.equal(g.run('typed'), 1, 'misses keep the letters already typed');
  g.type(g.wrong());
  assert.equal(g.views('fall').at(-1)[1].kind, 'miss');
  g.advance(FALL + 32);
  assert.equal(g.run('typed'), 0);
  assert.equal(g.steps, 100);
});

test('calm motion shortens the fall', () => {
  const g = game({ reduced: true });
  g.start();
  g.advance(200);
  g.type(g.wrong());
  assert.equal(g.views('fall')[0][1].duration, 700);
  g.advance(732);
  assert.equal(g.views('recover').length, 1);
});

test('mixed run on hard: every failure recorded once, only correct answers advance, each fall restarts', () => {
  const g = game();
  g.start();
  let ok = 0, wrong = 0, timeouts = 0;
  for (let i = 0; i < 30; i++) {
    const r = i % 3;
    if (r === 0) { g.advance(800); g.word(); g.advance(500); ok++; }
    else if (r === 1) { g.advance(800); g.type(g.wrong()); g.advance(FALL + 32); wrong++; }
    else { g.advance(HARD + 100); g.advance(FALL + 32); timeouts++; }
  }
  assert.equal(g.steps, 0, 'never more than 10 leaps up, so every fall lands at the bottom');
  assert.equal(g.hooks('complete').length, ok);
  assert.equal(g.hooks('key').filter(([, d]) => !d.ok).length, wrong);
  assert.equal(g.hooks('timeout').length, timeouts);
  assert.equal(g.run('attempts') - g.run('correct'), wrong + timeouts);
  assert.equal(g.views('recover').length, wrong + timeouts);
});

test('a finished climb is posted to its own difficulty’s leaderboard', () => {
  for (const pace of ['easy', 'medium', 'hard']) {
    const g = game({ pace });
    g.run('globalThis.__done = []; window.dispatchEvent = (e) => globalThis.__done.push(e.detail.pace)');
    g.start();
    for (let i = 0; i < 150; i++) {
      if (g.run('state') === 'moon') g.run('continueStars()');
      for (const ch of g.target.slice(g.run('typed'))) { g.advance(100); g.type(ch); }
      g.advance(500);
    }
    assert.equal(g.run('state'), 'finished');
    assert.equal(g.run('globalThis.__done.join()'), pace);
  }
});

test('medium: a fall sends Milo 10 leaps down, never below the bottom of the practice', () => {
  const g = game({ pace: 'medium' });
  g.start();
  for (let i = 0; i < 25; i++) { g.word(); g.advance(500); }
  assert.equal(g.steps, 25);
  g.advance(MEDIUM + 50);
  g.advance(FALL + 32);
  assert.equal(g.steps, 15);
  assert.deepEqual([g.views('recover')[0][1].from, g.views('recover')[0][1].leap], [25, 15]);
  assert.equal(g.hooks('target').at(-1)[1].leap, 16);
  assert.match(g.run('terrainFor(steps).id'), /jungle/, 'back below the mountains');
  for (let i = 0; i < 3; i++) g.type(g.wrong());
  g.advance(FALL + 32);
  assert.equal(g.steps, 5);
  g.advance(MEDIUM + 50);
  g.advance(FALL + 32);
  assert.equal(g.steps, 0, 'not below leap 0');
  const w = game({ pace: 'medium' });
  w.start({ scope: 'words' });
  for (let i = 0; i < 5; i++) { w.word(); w.advance(500); }
  w.type(w.wrong()); w.type(w.wrong()); w.type(w.wrong());
  w.advance(FALL + 32);
  assert.equal(w.steps, 100, 'a words-only practice never drops below the moon');
});

test('hard: a fall high up drops 10 leaps and the word length follows', () => {
  const g = game();
  g.start();
  for (let i = 0; i < 80; i++) { if (g.run('state') === 'moon') g.run('continueStars()'); g.word(); g.advance(500); }
  assert.equal(g.target.length, 4);
  g.type(g.wrong());
  g.advance(FALL + 32);
  assert.equal(g.steps, 70);
  assert.equal(g.target.length, 3);
});

test('hard: words from the first leap, ignoring the letter row, growing from 2 to 5 letters', () => {
  const g = game();
  g.start({ set: 'home' });
  const lengths = new Map();
  for (let i = 0; i < 150; i++) {
    if (g.run('state') === 'moon') g.run('continueStars()');
    lengths.set(g.steps, g.target.length);
    g.word(); g.advance(500);
  }
  assert.equal(g.run('state'), 'finished');
  const at = (n) => lengths.get(n);
  assert.deepEqual([at(0), at(37), at(38), at(74), at(75), at(112), at(113), at(149)], [2, 2, 3, 3, 4, 4, 5, 5]);
  // Words-only and letters-only practice spread the same ladder over their own climb.
  const words = game(); words.start({ scope: 'words' });
  assert.equal(words.target.length, 2);
  assert.equal(words.run('wordLength(149)'), 5);
  const letters = game(); letters.start({ scope: 'letters' });
  assert.deepEqual(letters.run('[wordLength(0), wordLength(24), wordLength(25), wordLength(99)].join()'), '2,2,3,5');
});
