// An isolated instance of the deployed Letter Leaper rules engine
// (public/games/letter-leaper/core.js) for the 3D preview. The engine is a
// classic script written for one page; here its source runs inside a function
// scope, so every mount gets its own state, and its animation-frame loop can
// be stopped on unmount. There is no second copy of the rules: targets,
// accuracy, accepted input, timers, and tracking hooks all come from core.js.

export type HookType = "session_start" | "start" | "target" | "key" | "complete" | "timeout" | "pause" | "resume" | "stage" | "end" | "ignored";
export type Hook = (type: string, data: Record<string, unknown>, now: number) => void;
export type ViewEvent = (type: string, detail: Record<string, unknown>) => void;

export type LeaperCore = {
  readonly state: "intro" | "playing" | "paused" | "moon" | "finished";
  readonly steps: number;
  readonly target: string;
  readonly typed: number;
  readonly jumping: boolean;
  readonly attempts: number;
  readonly correct: number;
  readonly streak: number;
  readonly bestStreak: number;
  /** Rounded percent, as the game shows it. */
  accuracy(): number;
  /** Milliseconds counted as typing time (accepting input), paused, and animating. */
  clocks(): { active: number; pause: number; anim: number };
  jumpProgress(): number;
  start(settings: { set: string; pace: string }): void;
  input(key: string, src: "kbd" | "screen"): void;
  ignore(kind: string): void;
  requestPause(reason?: string): void;
  resume(): void;
  home(): void;
  setCalm(calm: boolean): void;
  onHook(fn: Hook): () => void;
  onView(fn: ViewEvent): () => void;
  dispose(): void;
};

export type CoreEnv = {
  now: () => number;
  requestFrame: (cb: (t: number) => void) => number;
  cancelFrame: (id: number) => void;
  prefersReducedMotion: boolean;
};

const browserEnv = (): CoreEnv => ({
  now: () => performance.now(),
  requestFrame: (cb) => requestAnimationFrame(cb),
  cancelFrame: (id) => cancelAnimationFrame(id),
  prefersReducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
});

// Live instances, for the leak check in development.
let live = 0;
export const liveCores = () => live;

export function createLeaperCore(source: string, env: CoreEnv = browserEnv()): LeaperCore {
  let disposed = false, frameId = 0;
  const raf = (cb: (t: number) => void) => (disposed ? 0 : (frameId = env.requestFrame(cb)));
  const fakePerformance = { now: env.now };
  const fakeMatchMedia = () => ({ matches: env.prefersReducedMotion, addEventListener() {}, removeEventListener() {} });
  // core.js may dispatch a "climb-complete" DOM event at 100/150 leaps; the
  // ten-leap preview never gets there, and nothing outside this instance listens.
  const fakeWindow = { dispatchEvent: () => true };
  const factory = new Function("requestAnimationFrame", "matchMedia", "performance", "window", `${source}
return {
  get state() { return state; }, get steps() { return steps; }, get target() { return target; }, get typed() { return typed; },
  get jumping() { return jumping; }, get attempts() { return attempts; }, get correct() { return correct; },
  get streak() { return streak; }, get bestStreak() { return bestStreak; },
  accuracy, jumpProgress, input, ignore, requestPause, resume, home,
  clocks: () => ({ active: activeNow(), pause: clock.pause + pausedFor(), anim: clock.anim }),
  start(s) { readSettings = () => s; start(); },
  setCalm(v) { calmChoice = v; },
  hooks, views,
};`);
  const inner = factory(raf, fakeMatchMedia, fakePerformance, fakeWindow);
  live++;
  const subscribe = <T,>(list: T[], fn: T) => { list.push(fn); return () => { const i = list.indexOf(fn); if (i >= 0) list.splice(i, 1); }; };
  return {
    get state() { return inner.state; }, get steps() { return inner.steps; }, get target() { return inner.target; }, get typed() { return inner.typed; },
    get jumping() { return inner.jumping; }, get attempts() { return inner.attempts; }, get correct() { return inner.correct; },
    get streak() { return inner.streak; }, get bestStreak() { return inner.bestStreak; },
    accuracy: () => inner.accuracy(),
    clocks: () => inner.clocks(),
    jumpProgress: () => inner.jumpProgress(),
    start: (s) => inner.start(s),
    input: (k, src) => inner.input(k, src),
    ignore: (kind) => inner.ignore(kind),
    requestPause: (reason) => inner.requestPause(reason),
    resume: () => inner.resume(),
    home: () => inner.home(),
    setCalm: (v) => inner.setCalm(v),
    onHook: (fn) => subscribe(inner.hooks, fn),
    onView: (fn) => subscribe(inner.views, fn),
    dispose() {
      if (disposed) return;
      disposed = true;
      env.cancelFrame(frameId);
      inner.hooks.length = 0;
      inner.views.length = 0;
      live--;
    },
  };
}
