'use strict';
// Letter Leaper rules engine: targets, timers, scoring, states, and the
// tracking hooks (tracker.js). No DOM and no drawing — ui.js renders the
// HTML around the game, and a scene renderer (scene-phaser.js or
// scene-classic.js) draws the world. Renderers only follow `emit` events and
// read state; they never change the rules or the clocks.
//
// Top-level names (state, steps, target, typed, input, start, …) stay global
// on purpose: leaderboard.js, tracker.js, and the browser tests read them.
/* eslint-disable @typescript-eslint/no-unused-vars -- these names are used by ui.js, the scenes, and tracker.js (shared script scope) */

const sets = { all: 'abcdefghijklmnopqrstuvwxyz', home: 'asdfghjkl', top: 'qwertyuiop', bottom: 'zxcvbnm' };
const MOON = 100, TOTAL = 150, WORDS3_FROM = 120;
const GAME_VERSION = '2026.10.2';
const words2 = ['an','at','as','am','be','by','do','go','he','hi','if','in','is','it','me','my','no','of','on','or','so','to','up','us','we'];
const words3 = ['ant','bat','bed','bee','big','box','bug','bus','car','cat','cow','cup','dog','dot','dry','egg','fan','far','fig','fin','fit','fly','fox','fun','hat','hen','hop','hot','ice','jam','jar','jet','joy','key','leg','lip','log','map','mat','mix','mud','net','new','nut','old','owl','pan','pen','pet','pig','pot','red','row','run','sad','sea','sky','sit','six','sun','tap','tea','ten','tin','top','toy','two','van','vet','wet','win','yes','zip','zoo'];
// Six environments of the climb. `at` = leaps landed when the environment
// begins (so leaps 1–20 are the jungle). Ids are the stage ids the classroom
// backend accepts, so they can't be renamed: "moon" is the near-space
// approach that arrives on the moon at leap 100, and "stars" is the journey
// from the moon into the starfield.
const terrains = [
  { at: 0, id: 'jungle', name: 'THE JUNGLE CANOPY', message: 'Let’s go, Milo!' },
  { at: 20, id: 'mountains', name: 'MISTY MOUNTAINS', message: 'Into the misty mountains!' },
  { at: 40, id: 'clouds', name: 'CLOUD PEAKS', message: 'Above the clouds!' },
  { at: 60, id: 'atmosphere', name: 'HIGH ATMOSPHERE', message: 'Look down. That’s Earth!' },
  { at: 80, id: 'moon', name: 'NEAR SPACE', message: 'Into space! The moon is close.' },
  { at: 100, id: 'stars', name: 'MOON TO THE STARS', message: 'One hundred leaps. Moon landing!' },
];
const terrainFor = n => terrains.findLast(t => n >= t.at);
const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
// Calm mode = the OS setting or the in-game toggle (ui.js sets calmChoice).
let calmChoice = false;
const reducedMotion = () => motionQuery.matches || calmChoice;
const jumpMs = () => (reducedMotion() ? 80 : 410);

let typed = 0, correct = 0;
let state = 'intro', steps = 0, attempts = 0, streak = 0, bestStreak = 0, target = 'f', lastLetter = '', set = 'all', pace = 'relaxed',
  jumpStart = 0, jumpDuration = 410, jumping = false, elapsed = 0, remaining = 0, lastFrame = performance.now(), scope = 'full', pendingResume = null;
function accuracy() { return attempts ? Math.round(correct / attempts * 100) : 0; }

// ---- tracking hooks (contract unchanged; consumed by tracker.js) -------------
// The active clock only runs while the game accepts answers.
const hooks = [], clock = { active: 0, anim: 0, pause: 0 };
let readyAt = 0, pausedAt = 0, pauseReason = 'user';
function hook(type, data = {}) { for (const h of hooks) try { h(type, data, performance.now()); } catch (err) { console.error(err); } }
function activeNow() { return clock.active + (state === 'playing' && !jumping ? Math.min(performance.now() - lastFrame, 1000) : 0); }
function ready() { readyAt = activeNow(); }
function rt() { return Math.max(0, Math.round(activeNow() - readyAt)); }
function pausedFor() { return state === 'paused' || state === 'moon' ? performance.now() - pausedAt : 0; }

// ---- view events (for ui.js and the scene renderers; never affect rules) -----
const views = [];
function emit(type, detail = {}) { for (const v of views) try { v(type, detail); } catch (err) { console.error(err); } }
// Settings come from the HTML form; ui.js replaces this.
let readSettings = () => ({ set: 'all', pace: 'relaxed' });

function pick() {
  const pool = steps < MOON ? sets[set].split('') : steps < WORDS3_FROM ? words2 : words3;
  const choices = pool.filter(w => w !== lastLetter);
  target = choices[Math.floor(Math.random() * choices.length)];
  lastLetter = target;
  typed = 0;
  remaining = (pace === 'steady' ? 8000 : pace === 'speedy' ? 4000 : Infinity) * target.length;
  hook('target', { target, kind: target.length > 1 ? 'word' : 'letter', leap: steps + 1 });
  ready();
  emit('target', { target, leap: steps + 1 });
}
function start() {
  ({ set, pace } = readSettings());
  const r = pendingResume;
  pendingResume = null;
  steps = r ? r.leap : scope === 'words' ? MOON : 0;
  attempts = r ? r.attempts : 0; correct = r ? r.correct : 0; streak = r ? r.streak : 0; bestStreak = r ? r.bestStreak : 0;
  elapsed = r ? r.elapsed : 0; typed = 0;
  clock.active = r ? r.clocks.active : 0; clock.anim = r ? r.clocks.anim : 0; clock.pause = r ? r.clocks.pause : 0;
  jumping = false; state = 'playing'; lastLetter = ''; lastFrame = performance.now();
  hook('start', { leap: steps, resumed: !!r });
  emit('start', { leap: steps, resumed: !!r });
  pick();
  lastFrame = performance.now();
}
function miss(key, timeout = false) {
  attempts++;
  streak = 0;
  if (timeout) {
    const missed = target;
    hook('timeout', { target, pos: typed, rt: rt() });
    emit('timeout', { target: missed });
    pick();
  } else emit('miss', { key, pos: typed, expected: target[typed] });
}
function input(key, src = 'kbd') {
  if (state !== 'playing' || jumping || !/^[a-z]$/.test(key)) return;
  const ok = key === target[typed];
  hook('key', { exp: target[typed], got: key, pos: typed, ok, rt: rt(), src });
  ready();
  if (!ok) { miss(key); return; }
  attempts++; correct++; typed++;
  emit('typed', { pos: typed - 1, done: typed === target.length });
  if (typed < target.length) return;
  hook('complete', { target, leap: steps + 1 });
  streak++;
  bestStreak = Math.max(bestStreak, streak);
  jumping = true;
  jumpStart = performance.now();
  jumpDuration = jumpMs();
  emit('jump', { from: steps, to: steps + 1, duration: jumpDuration, streak });
}
// Ignored input is never an attempt; it's only counted by kind (ui.js decides the kind).
function ignore(kind) { if (state === 'playing') hook('ignored', { kind }); }
function land() {
  steps++;
  jumping = false;
  if (steps === TOTAL || (scope === 'letters' && steps === MOON)) { emit('land', { leap: steps }); finish(); return; }
  pick();
  if (steps === MOON) {
    state = 'moon';
    pausedAt = performance.now();
    hook('pause', { reason: 'moon' });
  }
  emit('land', { leap: steps });
  if (steps === MOON) emit('moon');
  const terrain = terrains.find(t => t.at === steps);
  if (terrain) {
    hook('stage', { stage: terrain.id, leap: steps });
    emit('stage', { terrain, leap: steps });
  }
}
function continueStars() {
  if (state !== 'moon') return;
  clock.pause += pausedFor();
  hook('resume', { reason: 'moon' });
  state = 'playing';
  lastFrame = performance.now();
  emit('continue');
}
function finish() {
  if (state === 'finished') return;
  state = 'finished';
  hook('end', { reason: 'completed', leap: steps });
  emit('finish', { scope, accuracy: accuracy(), bestStreak, elapsed });
  if (scope === 'full')
    window.dispatchEvent(new CustomEvent('climb-complete', { detail: { id: crypto.randomUUID(), practice: set, pace, leaps: steps, correct, attempts, streak: bestStreak, elapsed: Math.round(elapsed) } }));
}
function pause(reason = 'user') {
  if (state !== 'playing') return;
  state = 'paused';
  pausedAt = performance.now();
  pauseReason = reason;
  hook('pause', { reason });
  emit('pause', { reason });
}
let pausedJump = 0;
function resume() {
  if (state !== 'paused') return;
  clock.pause += pausedFor();
  hook('resume', { reason: pauseReason });
  state = 'playing';
  if (jumping) jumpStart = performance.now() - pausedJump;
  lastFrame = performance.now();
  emit('resume');
}
function requestPause(reason) {
  if (state === 'playing') {
    pausedJump = jumping ? performance.now() - jumpStart : 0;
    pause(typeof reason === 'string' ? reason : 'user');
  } else if (state === 'paused') resume();
}
function home() {
  if (state === 'playing' || state === 'paused' || state === 'moon') {
    clock.pause += pausedFor();
    hook('end', { reason: 'exited', leap: steps });
  }
  state = 'intro';
  steps = attempts = correct = typed = streak = 0;
  jumping = false;
  emit('home');
}
// 0 → 1 through the current leap (frozen while paused). Renderers animate from this.
function jumpProgress() {
  if (!jumping) return 0;
  const now = state === 'paused' ? pausedAt : performance.now();
  return Math.min(1, (now - jumpStart) / jumpDuration);
}
let countdownShown = 0;
function frame(now) {
  const real = Math.min(now - lastFrame, 1000), dt = Math.min(real, 100);
  lastFrame = now;
  if (state === 'playing') {
    elapsed += dt;
    if (jumping) {
      clock.anim += real;
      if (now - jumpStart >= jumpDuration) land();
    } else {
      clock.active += real;
      if (Number.isFinite(remaining)) {
        remaining -= dt;
        if (remaining <= 0) miss('', true);
        else if (Math.ceil(remaining / 1000) !== countdownShown) { countdownShown = Math.ceil(remaining / 1000); emit('countdown', { seconds: countdownShown }); }
      }
    }
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
