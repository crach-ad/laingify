// Rules-engine tests for public/games/letter-leaper/core.js, run in Node with
// a fake clock: journey length, milestones, modes, word boundaries, timers,
// exactly-once tracking hooks, and typing time that excludes animation,
// pauses, and celebrations. The renderers can't change any of this.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../public/games/letter-leaper/core.js', import.meta.url), 'utf8');

function game({ reduced = false } = {}) {
  let now = 1000, rafCb = null;
  const events = [];
  const ctx = vm.createContext({
    performance: { now: () => now },
    requestAnimationFrame: (cb) => { rafCb = cb; },
    matchMedia: () => ({ matches: reduced, addEventListener() {} }),
    window: { dispatchEvent: (e) => events.push(['dom', e.type, e.detail]) },
    CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init?.detail; } },
    crypto: { randomUUID: () => '00000000-0000-4000-8000-000000000000' },
    console,
    Math,
  });
  vm.runInContext(source, ctx);
  const run = (code) => vm.runInContext(code, ctx);
  run('hooks.push((type, data) => __hooks.push([type, data]))'.replace('__hooks', 'globalThis.__hooks'));
  ctx.__hooks = [];
  run('views.push((type, d) => globalThis.__views.push(type))');
  ctx.__views = [];
  // Advance the fake clock in animation frames.
  const advance = (ms, step = 16) => { for (let t = 0; t < ms; t += step) { now += Math.min(step, ms - t); rafCb(now); } };
  const api = {
    run, advance, ctx,
    get hooks() { return ctx.__hooks; },
    get views() { return ctx.__views; },
    get state() { return run('state'); },
    get steps() { return run('steps'); },
    get target() { return run('target'); },
    get typed() { return run('typed'); },
    get jumping() { return run('jumping'); },
    start(opts = {}) {
      run(`readSettings = () => (${JSON.stringify({ set: opts.set ?? 'all', pace: opts.pace ?? 'easy' })}); scope = ${JSON.stringify(opts.scope ?? 'full')};`);
      run('start()');
    },
    type(ch, src = 'kbd') { run(`input(${JSON.stringify(ch)}, ${JSON.stringify(src)})`); },
    // Type the current target correctly (thinking `think` ms per letter), then land.
    leap(think = 100) {
      for (const ch of api.target.slice(api.typed)) { advance(think); api.type(ch); }
      advance(500);
    },
    count: (type) => ctx.__hooks.filter(([t]) => t === type).length,
  };
  return api;
}

test('full journey: letters to the moon at 100 (with a celebration pause), words to the stars at 150', () => {
  const g = game();
  g.start();
  const lengths = [];
  while (g.state !== 'finished') {
    if (g.state === 'moon') {
      assert.equal(g.steps, 100, 'the moon milestone is leap 100');
      g.advance(3000); // celebration time
      g.run('continueStars()');
      continue;
    }
    lengths.push([g.steps + 1, g.target.length]);
    g.leap();
  }
  assert.equal(g.steps, 150);
  for (const [leap, len] of lengths) assert.equal(len, leap <= 100 ? 1 : leap <= 120 ? 2 : 3, `leap ${leap}`);
  assert.equal(g.count('target'), 150);
  assert.equal(g.count('complete'), 150);
  assert.equal(g.count('key'), 100 + 20 * 2 + 30 * 3, 'one key event per accepted character, exactly once');
  assert.equal(g.count('end'), 1);
  assert.deepEqual(g.hooks.filter(([t]) => t === 'stage').map(([, d]) => [d.stage, d.leap]),
    [['mountains', 20], ['clouds', 40], ['atmosphere', 60], ['moon', 80], ['stars', 100]], 'five environment changes, backend stage ids');
  assert.deepEqual(g.hooks.filter(([t]) => t === 'pause').map(([, d]) => d.reason), ['moon']);
  assert.deepEqual(g.views.filter((v) => v === 'moon' || v === 'finish'), ['moon', 'finish']);
});

test('letter-only practice finishes at the moon; word-only practice starts there and finishes at the stars', () => {
  const letters = game();
  letters.start({ scope: 'letters', set: 'home' });
  while (letters.state === 'playing') {
    assert.ok('asdfghjkl'.includes(letters.target), `home row only: ${letters.target}`);
    letters.leap();
  }
  assert.deepEqual([letters.state, letters.steps, letters.count('pause')], ['finished', 100, 0]);

  const words = game();
  words.start({ scope: 'words', set: 'home' });
  assert.equal(words.steps, 100);
  while (words.state === 'playing') { assert.ok(words.target.length >= 2); words.leap(); }
  assert.deepEqual([words.state, words.steps, words.count('complete')], ['finished', 150, 50]);
});

test('words need each letter in order; a wrong key keeps progress and resets the streak', () => {
  const g = game();
  g.start({ scope: 'words' });
  g.leap(); g.leap();
  assert.equal(g.run('streak'), 2);
  const word = g.target;
  g.type(word[0]);
  g.type(word[1] === 'q' ? 'z' : 'q'); // wrong key mid-word
  assert.equal(g.typed, 1, 'correct letters stay typed');
  assert.equal(g.run('streak'), 0);
  g.type(word[1]);
  assert.equal(g.typed, 2);
  const keys = g.hooks.filter(([t]) => t === 'key').slice(-3).map(([, d]) => [d.pos, d.ok]);
  assert.deepEqual(keys, [[0, true], [1, false], [1, true]]);
});

test('input during a jump is not an attempt and produces no event', () => {
  const g = game();
  g.start();
  const t = g.target;
  g.advance(200); g.type(t);
  assert.equal(g.jumping, true);
  const before = g.hooks.length;
  g.type('a'); g.type(t);
  assert.equal(g.hooks.length, before);
  assert.equal(g.run('attempts'), 1);
});

test('typing time counts only accepting-input time: jumps, pauses, hidden tabs, and celebrations are excluded', () => {
  const g = game();
  g.start({ scope: 'full' });
  g.advance(1200);
  g.type(g.target);
  assert.ok(Math.abs(g.hooks.find(([t]) => t === 'key')[1].rt - 1200) <= 16, 'rt = thinking time');
  g.advance(410); // the jump
  const c1 = g.run('({ ...clock })');
  assert.ok(Math.abs(c1.active - 1200) <= 16, `active ${c1.active}`);
  assert.ok(Math.abs(c1.anim - 410) <= 32, `anim ${c1.anim}`);
  // Pause mid-target (user), then hidden tab: neither counts.
  g.advance(300);
  g.run("requestPause('user')"); g.advance(5000); g.run('resume()');
  g.run("requestPause('hidden')"); g.advance(7000); g.run('resume()');
  g.advance(300);
  g.type(g.target);
  const k = g.hooks.filter(([t]) => t === 'key')[1][1];
  assert.ok(Math.abs(k.rt - 600) <= 32, `rt after pauses ${k.rt}`);
  const c2 = g.run('({ ...clock })');
  assert.ok(c2.pause >= 12000 && c2.pause < 12100, `pause ${c2.pause}`);
  assert.ok(Math.abs(c2.active - 1800) <= 48, `active ${c2.active}`);
  // The moon celebration is a pause too.
  const m = game();
  m.start({ scope: 'full' });
  while (m.state !== 'moon') m.leap(50);
  const activeAtMoon = m.run('clock.active');
  m.advance(4000);
  m.run('continueStars()');
  assert.ok(m.run('clock.active') - activeAtMoon < 20, 'celebration time is not typing time');
  assert.ok(m.run('clock.pause') >= 4000);
});

test('a jump paused midway resumes where it was; landing still happens once', () => {
  const g = game();
  g.start();
  g.type(g.target);
  g.advance(200);
  g.run("requestPause('user')");
  const p = g.run('jumpProgress()');
  g.advance(3000);
  assert.equal(g.run('jumpProgress()'), p, 'frozen while paused');
  g.run('resume()');
  g.advance(300);
  assert.equal(g.steps, 1);
  assert.equal(g.count('target'), 2);
});

test('medium and hard time out per letter (8 s, 4 s): one timeout (not a keystroke), then a fresh target after the fall', () => {
  const g = game();
  g.start({ pace: 'medium' });
  g.advance(7900);
  assert.equal(g.count('timeout'), 0);
  g.advance(200);
  assert.equal(g.count('timeout'), 1);
  assert.equal(g.count('key'), 0);
  assert.equal(g.run('streak'), 0);
  g.advance(1600);
  assert.equal(g.count('target'), 2);
  const w = game();
  w.start({ pace: 'hard', scope: 'words' });
  w.advance(3900);
  w.type(w.target[0]);
  w.advance(3900);
  assert.equal(w.count('timeout'), 0, 'each letter of a word gets its own 4 s');
  w.advance(200);
  assert.equal(w.count('timeout'), 1);
});

test('easy never times out or falls, and old pace names map onto the difficulties', () => {
  const g = game();
  g.start({ pace: 'easy' });
  g.advance(60000);
  for (let i = 0; i < 5; i++) g.type(g.target === 'q' ? 'w' : 'q');
  assert.equal(g.count('timeout'), 0);
  assert.equal(g.jumping, false);
  assert.equal(g.count('key'), 5);
  for (const [old, now] of [['relaxed', 'easy'], ['steady', 'medium'], ['speedy', 'hard'], ['falls', 'medium'], ['nonsense', 'easy']]) {
    const o = game();
    o.start({ pace: old });
    assert.equal(o.run('pace'), now);
  }
});

test('reduced motion shortens the jump without changing what is measured', () => {
  const g = game({ reduced: true });
  g.start();
  g.type(g.target);
  g.advance(96);
  assert.equal(g.steps, 1);
  assert.ok(g.run('clock.anim') <= 96 && g.run('clock.active') < 20);
});

test('leaving early ends the session once; returning home resets for a new climb', () => {
  const g = game();
  g.start();
  g.leap(); g.leap();
  g.run('home()');
  g.run('home()');
  assert.deepEqual(g.hooks.filter(([t]) => t === 'end').map(([, d]) => [d.reason, d.leap]), [['exited', 2]]);
  assert.deepEqual([g.state, g.steps], ['intro', 0]);
});
