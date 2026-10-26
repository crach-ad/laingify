// Falling-platform preview rules in public/games/letter-leaper/core.js, run in
// Node with a fake clock: the seven-second deadline on the active clock,
// wrong-letter falls, timeout collapses, recovery to the same leap, deadline
// races, pauses, and exactly-once tracking. Falls are opt-in (off by default).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../public/games/letter-leaper/core.js', import.meta.url), 'utf8');

function game({ reduced = false, falls = true } = {}) {
  let now = 1000, rafCb = null;
  const ctx = vm.createContext({
    performance: { now: () => now },
    requestAnimationFrame: (cb) => { rafCb = cb; },
    matchMedia: () => ({ matches: reduced, addEventListener() {} }),
    window: { dispatchEvent: (e) => { ctx.__dom.push(e.type); } },
    CustomEvent: class { constructor(type) { this.type = type; } },
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
    start(opts = {}) { run(`readSettings = () => (${JSON.stringify({ set: 'all', pace: opts.pace ?? 'relaxed', falls })}); scope = ${JSON.stringify(opts.scope ?? 'full')};`); run('start()'); },
    type(ch) { run(`input(${JSON.stringify(ch)}, 'kbd')`); },
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
const FALL = 1500;

test('falls are off unless asked for: no deadline, wrong keys never fall', () => {
  const g = game({ falls: false });
  g.start();
  assert.equal(g.left, Infinity);
  g.advance(20000);
  g.type(g.wrong());
  assert.equal(g.views('fall').length, 0);
  assert.equal(g.hooks('timeout').length, 0);
  assert.equal(g.run('jumping'), false);
});

test('a correct letter before the deadline leaps exactly once', () => {
  const g = game();
  g.start();
  g.advance(3000);
  g.type(g.target);
  g.advance(500);
  assert.equal(g.steps, 1);
  assert.equal(g.hooks('complete').length, 1);
  assert.equal(g.views('fall').length, 0);
  // The next target gets a fresh seven seconds.
  assert.ok(g.left > 6900 && g.left <= 7000, `left ${g.left}`);
});

test('a wrong letter: one incorrect attempt, a fall, no leap, then the same leap again', () => {
  const g = game();
  g.start();
  g.leap = () => { g.type(g.target); g.advance(500); };
  g.leap(); g.leap(); // progress already earned is kept
  const before = g.target;
  g.advance(1200);
  g.type(g.wrong());
  assert.equal(g.views('fall').length, 1);
  assert.equal(g.views('fall')[0][1].kind, 'miss');
  const keys = g.hooks('key');
  assert.equal(keys.at(-1)[1].ok, false);
  assert.equal(g.run('attempts'), 3);
  // Input during the failed jump and fall is ignored (not attempts, not keys).
  g.type(before); g.type(g.wrong());
  assert.equal(g.hooks('key').length, keys.length);
  g.advance(FALL + 32);
  assert.equal(g.views('recover').length, 1);
  assert.equal(g.steps, 2, 'leap counter unchanged');
  assert.equal(g.hooks('complete').length, 2, 'no leap awarded for the fall');
  assert.equal(g.hooks('timeout').length, 0, 'a wrong letter is not a timeout');
  assert.equal(g.hooks('target').at(-1)[1].leap, 3, 'a fresh target for the same leap');
  assert.ok(g.left > 6900, 'the timer restarts once Milo is back');
});

test('the deadline: the platform falls at seven seconds of typing time, recorded once as a timeout', () => {
  const g = game();
  g.start();
  g.advance(6900);
  assert.equal(g.views('fall').length, 0);
  g.advance(200);
  assert.equal(g.views('fall').length, 1);
  assert.equal(g.views('fall')[0][1].kind, 'timeout');
  assert.equal(g.hooks('timeout').length, 1);
  assert.equal(g.hooks('key').length, 0, 'no invented keystroke');
  assert.equal(g.run('attempts'), 1);
  g.advance(FALL + 32);
  assert.equal(g.steps, 0);
  assert.equal(g.hooks('timeout').length, 1, 'only once');
  g.advance(6800);
  assert.equal(g.hooks('timeout').length, 1, 'the new seven seconds started at recovery');
});

test('deadline races: just before is a leap; at or after seven seconds is a timeout, and the key is not recorded', () => {
  const early = game();
  early.start();
  early.advance(6992);
  early.pass(7); // 6999 ms
  early.type(early.target);
  early.advance(500);
  assert.equal(early.steps, 1);
  assert.equal(early.hooks('timeout').length, 0);

  const late = game();
  late.start();
  late.advance(6992);
  late.pass(8); // exactly 7000 ms, before the next frame
  late.type(late.target);
  assert.equal(late.hooks('timeout').length, 1);
  assert.equal(late.hooks('key').length, 0);
  assert.equal(late.views('fall')[0][1].kind, 'timeout');
  late.advance(FALL + 500);
  assert.equal(late.steps, 0);
  assert.equal(late.hooks('complete').length, 0);
});

test('pausing and hidden tabs stop the deadline; falls and recovery are not typing time', () => {
  const g = game();
  g.start();
  g.advance(5000);
  g.run("requestPause('user')");
  g.advance(20000);
  assert.equal(g.hooks('timeout').length, 0);
  g.run('resume()');
  g.advance(1800);
  g.run("requestPause('hidden')");
  g.advance(20000);
  g.run('resume()');
  assert.equal(g.hooks('timeout').length, 0);
  g.advance(300);
  assert.equal(g.hooks('timeout').length, 1, 'falls after seven seconds of typing time in total');
  const active = g.active;
  while (g.views('recover').length === 0) g.advance(16); // until Milo is back
  assert.ok(g.active - active < 40, `the fall and recovery add no typing time (${g.active - active} ms)`);
  // A pause during a fall freezes it.
  g.advance(1200);
  g.type(g.wrong());
  g.advance(300);
  g.run("requestPause('user')");
  g.advance(10000);
  assert.equal(g.views('recover').length, 1);
  g.run('resume()');
  g.advance(FALL);
  assert.equal(g.views('recover').length, 2);
});

test('repeated key presses: one fall, one incorrect attempt', () => {
  const g = game();
  g.start();
  g.advance(500);
  const w = g.wrong();
  for (let i = 0; i < 5; i++) g.type(w);
  assert.equal(g.views('fall').length, 1);
  assert.equal(g.hooks('key').length, 1);
  assert.equal(g.run('attempts'), 1);
});

test('words: each letter has its own seven seconds; a wrong letter mid-word falls and brings a fresh word', () => {
  const g = game();
  g.start({ scope: 'words' });
  assert.equal(g.steps, 100);
  const word = g.target;
  g.advance(6000); g.type(word[0]);
  g.advance(6000);
  assert.equal(g.hooks('timeout').length, 0, 'the second letter has its own seven seconds');
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

test('mixed run: every failure recorded once, only correct answers advance', () => {
  const g = game();
  g.start();
  let ok = 0, wrong = 0, timeouts = 0;
  for (let i = 0; i < 30; i++) {
    const r = i % 3;
    if (r === 0) { g.advance(800); g.type(g.target); g.advance(500); ok++; }
    else if (r === 1) { g.advance(800); g.type(g.wrong()); g.advance(FALL + 32); wrong++; }
    else { g.advance(7100); g.advance(FALL + 32); timeouts++; }
  }
  assert.equal(g.steps, ok);
  assert.equal(g.hooks('complete').length, ok);
  assert.equal(g.hooks('key').filter(([, d]) => !d.ok).length, wrong);
  assert.equal(g.hooks('timeout').length, timeouts);
  assert.equal(g.run('attempts'), ok + wrong + timeouts);
  assert.equal(g.run('correct'), ok);
  assert.equal(g.views('recover').length, wrong + timeouts);
});

test('a finished falling-platform climb is not sent to the paced leaderboard', () => {
  const run = (falls) => {
    const g = game({ falls });
    g.start();
    for (let i = 0; i < 150; i++) {
      if (g.run('state') === 'moon') g.run('continueStars()');
      for (const ch of g.target.slice(g.run('typed'))) { g.advance(100); g.type(ch); }
      g.advance(500);
    }
    assert.equal(g.run('state'), 'finished');
    return g;
  };
  const paced = run(false), fell = run(true);
  assert.deepEqual(paced.run('globalThis.__dom'), ['climb-complete']);
  assert.deepEqual(fell.run('globalThis.__dom'), []);
});
