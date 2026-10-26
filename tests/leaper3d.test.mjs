// 3D preview session logic in Node with a fake clock: the shared rules
// engine (core.js) inside an isolated instance, the ten-leap goal, input
// rules, typing-time exclusions, and the preview tracking adapter.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createLeaperCore, liveCores } from '../lib/leaper3d/core.ts';
import { createPreview, GOAL } from '../lib/leaper3d/preview.ts';
import { previewAdapter } from '../lib/leaper3d/tracking.ts';
import { classifyKey } from '../lib/leaper3d/input.ts';

const source = fs.readFileSync(new URL('../public/games/letter-leaper/core.js', import.meta.url), 'utf8');

function harness({ reduced = false } = {}) {
  let now = 1000, cb = null, frames = 0;
  const env = { now: () => now, requestFrame: (f) => { cb = f; return ++frames; }, cancelFrame: () => { cb = null; }, prefersReducedMotion: reduced };
  const core = createLeaperCore(source, env);
  const tracking = previewAdapter();
  const tasks = [];
  const preview = createPreview(core, tracking, (fn) => tasks.push(fn));
  const advance = (ms, step = 16) => { for (let t = 0; t < ms; t += step) { now += Math.min(step, ms - t); cb?.(now); while (tasks.length) tasks.shift()(); } };
  const type = (letter) => { preview.input(letter, 'kbd'); while (tasks.length) tasks.shift()(); };
  const leap = (think = 300) => { advance(think); type(core.target); advance(450); };
  const events = (t) => tracking.events().filter((e) => e.type === t);
  return { core, preview, tracking, advance, type, leap, events, snap: () => preview.getSnapshot() };
}
const settings = { set: 'all', pace: 'relaxed' };

test('ten correct answers make exactly ten leaps, then the preview celebrates and stops', () => {
  const g = harness();
  g.preview.start(settings);
  for (let i = 0; i < GOAL; i++) g.leap();
  const s = g.snap();
  assert.equal(s.phase, 'celebrating');
  assert.equal(s.leaps, 10);
  assert.equal(s.accuracy, 100);
  assert.equal(g.events('complete').length, 10);
  assert.equal(g.events('key').length, 10, 'one key event per accepted key');
  assert.deepEqual(g.events('end').map((e) => e.data), [{ reason: 'exited', leap: 10 }]);
  assert.equal(g.events('target').length, 10, 'the never-shown eleventh target is not recorded');
  // Nothing more counts once celebrating.
  const activeAtEnd = g.core.clocks().active;
  g.advance(5000);
  g.type('a');
  assert.equal(g.core.clocks().active, activeAtEnd, 'celebration is not typing time');
  assert.equal(g.events('key').length, 10);
});

test('wrong keys never advance; they are recorded as incorrect attempts', () => {
  const g = harness();
  g.preview.start(settings);
  const t = g.core.target, wrong = t === 'q' ? 'w' : 'q';
  g.advance(200); g.type(wrong); g.type(wrong); g.advance(500);
  assert.equal(g.snap().leaps, 0);
  assert.equal(g.core.jumping, false);
  assert.deepEqual(g.events('key').map((e) => e.data.ok), [false, false]);
  assert.equal(g.snap().accuracy, 0);
  g.type(t); g.advance(450);
  assert.equal(g.snap().leaps, 1);
  assert.equal(g.snap().accuracy, 33);
});

test('keys pressed during a leap cannot queue extra leaps', () => {
  const g = harness();
  g.preview.start(settings);
  g.advance(200);
  const t = g.core.target;
  g.type(t);
  assert.equal(g.snap().jumping, true);
  assert.equal(g.snap().inputOpen, false, 'input is closed while leaping');
  for (const k of 'abcdefghijklmnopqrstuvwxyz') g.type(k);
  g.advance(450);
  assert.equal(g.snap().leaps, 1);
  assert.equal(g.events('key').length, 1);
  assert.equal(g.snap().inputOpen, true);
});

test('pausing and hidden tabs stop progress and typing time; restart resets cleanly', () => {
  const g = harness();
  g.preview.start(settings);
  g.advance(400);
  g.preview.togglePause();
  assert.equal(g.snap().phase, 'paused');
  const a = g.core.clocks().active;
  g.advance(6000);
  g.type(g.core.target);
  assert.equal(g.snap().leaps, 0, 'no progress while paused');
  assert.equal(g.core.clocks().active, a);
  g.preview.togglePause();
  g.advance(300);
  g.preview.pauseForHiddenTab();
  g.advance(9000);
  assert.ok(g.core.clocks().active - a < 340, 'hidden time excluded');
  assert.deepEqual(g.events('pause').map((e) => e.data.reason), ['user', 'hidden']);
  g.preview.togglePause();
  g.leap(); g.leap();
  g.preview.restart(settings);
  const s = g.snap();
  assert.deepEqual([s.phase, s.leaps, s.attempts, s.correct], ['playing', 0, 0, 0]);
  assert.deepEqual(g.events('end').map((e) => e.data.reason), ['exited']);
  assert.equal(g.events('start').length, 2);
});

test('typing time counts only while a target is ready: jumps are animation time', () => {
  const g = harness();
  g.preview.start(settings);
  g.advance(1000); g.type(g.core.target); g.advance(410);
  const c = g.core.clocks();
  assert.ok(Math.abs(c.active - 1000) <= 16, `active ${c.active}`);
  assert.ok(Math.abs(c.anim - 410) <= 32, `anim ${c.anim}`);
});

test('reduced motion shortens leaps without changing what is measured', () => {
  const g = harness({ reduced: true });
  g.preview.start(settings);
  g.advance(300); g.type(g.core.target); g.advance(96);
  assert.equal(g.snap().leaps, 1);
});

test('instances are isolated and stop their loop when disposed', () => {
  const before = liveCores();
  const a = harness(), b = harness();
  a.preview.start(settings); b.preview.start(settings);
  a.leap();
  assert.equal(a.snap().leaps, 1);
  assert.equal(b.snap().leaps, 0, 'separate state per instance');
  assert.equal(liveCores(), before + 2);
  a.core.dispose(); b.core.dispose();
  assert.equal(liveCores(), before);
});

test('key classification matches the 2D game: forms, shortcuts, repeats, composition, non-letters, mid-leap', () => {
  const k = (key, extra = {}) => ({ key, ctrlKey: false, metaKey: false, altKey: false, repeat: false, isComposing: false, target: { tagName: 'BODY' }, ...extra });
  const live = { live: true, jumping: false };
  assert.deepEqual(classifyKey(k('F'), live), { kind: 'letter', letter: 'f' });
  assert.deepEqual(classifyKey(k('f', { repeat: true }), live), { kind: 'ignored', reason: 'repeat' });
  assert.deepEqual(classifyKey(k('f', { ctrlKey: true }), live), { kind: 'ignored', reason: 'modifier' });
  assert.deepEqual(classifyKey(k('Process', { isComposing: true }), live), { kind: 'ignored', reason: 'composition' });
  assert.deepEqual(classifyKey(k('5'), live), { kind: 'ignored', reason: 'nonletter' });
  assert.deepEqual(classifyKey(k('f'), { live: true, jumping: true }), { kind: 'ignored', reason: 'busy' });
  assert.deepEqual(classifyKey(k('f', { target: { tagName: 'INPUT' } }), live), { kind: 'none' });
  assert.deepEqual(classifyKey(k('f', { target: { tagName: 'SELECT' } }), live), { kind: 'none' });
  assert.deepEqual(classifyKey(k('Shift'), live), { kind: 'none' });
  assert.deepEqual(classifyKey(k('Escape'), live), { kind: 'pause' });
  assert.deepEqual(classifyKey(k('f'), { live: false, jumping: false }), { kind: 'none' });
});

test('the preview tracking adapter keeps events in memory and has no network path', () => {
  // Executable code only (the header comment names the API it does NOT use).
  const src = fs.readFileSync(new URL('../lib/leaper3d/tracking.ts', import.meta.url), 'utf8').replace(/^\s*\/\/.*$/gm, '');
  assert.equal(/fetch\(|sendBeacon|XMLHttpRequest|\/api\//.test(src), false);
  const t = previewAdapter(3);
  for (let i = 0; i < 5; i++) t.record('key', { i }, i);
  assert.deepEqual(t.events().map((e) => e.data.i), [2, 3, 4]);
  assert.equal(t.mode, 'preview');
});

test('a disposed preview reconnects when the interface subscribes again (development double-mount)', () => {
  const g = harness();
  const unsub = g.preview.subscribe(() => {});
  unsub(); g.preview.dispose();
  g.preview.subscribe(() => {});
  g.preview.start(settings);
  g.leap();
  assert.equal(g.snap().leaps, 1);
  assert.equal(g.snap().target, g.core.target);
  assert.equal(g.events('complete').length, 1, 'tracking listener attached once, not twice');
  g.preview.subscribe(() => {});
  g.leap();
  assert.equal(g.events('complete').length, 2);
});

test('a throwaway preview on the same engine (development double-render) records nothing', () => {
  const g = harness();
  createPreview(g.core, g.tracking); // built, never used
  g.preview.start(settings);
  g.leap();
  assert.equal(g.events('start').length, 1);
  assert.equal(g.events('key').length, 1);
});
