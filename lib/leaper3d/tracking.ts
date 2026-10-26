// Tracking boundary for the 3D preview. The renderer never owns session
// logic: rules-engine hooks (the deployed event contract — target, key,
// complete, timeout, pause, resume, stage, end, ignored) go to an adapter.
//
// The only adapter here is the preview recorder: it keeps events in memory
// for the development inspector and sends nothing anywhere. Classroom
// tracking (public/games/letter-leaper/tracker.js and /api/typing/*) is not
// connected to the prototype; connecting it later means writing a second
// adapter that forwards the same hooks, not changing the renderer.
export type TrackedEvent = { seq: number; type: string; data: Record<string, unknown>; t: number };

export interface TrackingAdapter {
  readonly mode: "preview";
  record(type: string, data: Record<string, unknown>, now: number): void;
  events(): readonly TrackedEvent[];
  subscribe(fn: () => void): () => void;
  reset(): void;
}

export function previewAdapter(limit = 500): TrackingAdapter {
  let list: TrackedEvent[] = [];
  let seq = 0;
  const subs = new Set<() => void>();
  const notify = () => subs.forEach((f) => f());
  return {
    mode: "preview",
    record(type, data, now) {
      list = [...list.slice(-(limit - 1)), { seq: seq++, type, data: { ...data }, t: Math.round(now) }];
      notify();
    },
    events: () => list,
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
    reset() { list = []; seq = 0; notify(); },
  };
}
