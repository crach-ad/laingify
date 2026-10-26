// The ten-leap 3D preview session around the shared rules engine: start,
// pause, restart, the goal, and the celebration — plus a small store the HTML
// interface reads. Rendering reads the engine directly each frame; nothing
// here draws.
import type { LeaperCore } from "./core.ts";
import type { TrackingAdapter } from "./tracking.ts";

export const GOAL = 10;

export type Phase = "ready" | "playing" | "paused" | "celebrating";
export type Feedback = { type: "typed" | "miss" | "timeout" | "jump" | "land" | "celebrate"; n: number; detail: Record<string, unknown> };
export type Snapshot = {
  phase: Phase;
  leaps: number;
  target: string;
  typed: number;
  jumping: boolean;
  /** True only while the engine accepts an answer (the "your turn" signal). */
  inputOpen: boolean;
  attempts: number;
  correct: number;
  accuracy: number | null;
  feedback: Feedback | null;
};

export type Preview = {
  getSnapshot(): Snapshot;
  subscribe(fn: () => void): () => void;
  start(settings: { set: string; pace: string }): void;
  restart(settings: { set: string; pace: string }): void;
  togglePause(): void;
  pauseForHiddenTab(): void;
  input(letter: string, src: "kbd" | "screen"): void;
  ignore(reason: string): void;
  dispose(): void;
};

export function createPreview(core: LeaperCore, tracking: TrackingAdapter, schedule: (fn: () => void) => void = queueMicrotask): Preview {
  let phase: Phase = "ready";
  let finalRun: Pick<Snapshot, "leaps" | "attempts" | "correct" | "accuracy"> | null = null;
  let feedback: Feedback | null = null;
  let n = 0;
  const subs = new Set<() => void>();
  const build = (): Snapshot => {
    const live = core.state === "playing" || core.state === "paused";
    const run = phase === "celebrating" && finalRun ? finalRun : { leaps: core.steps, attempts: core.attempts, correct: core.correct, accuracy: core.attempts ? core.accuracy() : null };
    return {
      phase, ...run,
      target: live ? core.target : "",
      typed: live ? core.typed : 0,
      jumping: core.jumping,
      inputOpen: core.state === "playing" && !core.jumping && phase === "playing",
      feedback,
    };
  };
  let snapshot = build();
  const notify = () => { snapshot = build(); subs.forEach((f) => f()); };
  const onView = (type: string, detail: Record<string, unknown>) => {
    if (type === "typed" || type === "miss" || type === "timeout" || type === "jump" || type === "land") feedback = { type, n: ++n, detail };
    if (type === "pause") phase = "paused";
    if (type === "resume") phase = "playing";
    if (type === "land" && (detail.leap as number) >= GOAL) {
      // The goal is a preview concept, not a rule: end the run right after the
      // tenth landing (before another frame can count typing time). Deferred,
      // because core.js is still inside land() while it emits this event.
      finalRun = { leaps: GOAL, attempts: core.attempts, correct: core.correct, accuracy: core.attempts ? core.accuracy() : null };
      schedule(() => {
        core.home();
        phase = "celebrating";
        feedback = { type: "celebrate", n: ++n, detail: {} };
        notify();
      });
    }
    notify();
  };
  // Engine listeners attach when the preview is first used (subscribed to or
  // started), not on creation: React may build a throwaway instance during a
  // development double-render, and it must never record events. A dispose
  // followed by a new subscription (the development double-mount) reattaches.
  let detach: (() => void) | null = null;
  const attach = () => {
    if (detach) return;
    const offHook = core.onHook((type, data, now) => {
      // core.js announces the next target inside land(), before the deferred
      // goal ends the run; the eleventh target is never shown, so not recorded.
      if (type === "target" && (data.leap as number) > GOAL) return;
      tracking.record(type, data, now);
    });
    const offView = core.onView(onView);
    detach = () => { offHook(); offView(); detach = null; };
  };
  const start = (settings: { set: string; pace: string }) => {
    attach();
    finalRun = null;
    phase = "playing";
    core.start(settings);
    notify();
  };
  return {
    getSnapshot: () => snapshot,
    subscribe(fn) { attach(); subs.add(fn); snapshot = build(); return () => subs.delete(fn); },
    start,
    restart(settings) {
      core.home(); // ends a run in progress (an "exited" end event)
      start(settings);
    },
    togglePause() {
      if (core.state === "playing") core.requestPause("user");
      else if (core.state === "paused") core.resume();
    },
    pauseForHiddenTab() { if (core.state === "playing") core.requestPause("hidden"); },
    input(letter, src) { if (phase === "playing") core.input(letter, src); },
    ignore(reason) { core.ignore(reason); },
    dispose() { detach?.(); subs.clear(); },
  };
}
