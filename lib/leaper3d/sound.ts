// Optional preview sounds: short, soft synthesized tones (no audio files).
// The AudioContext is only created when the player turns sound on (a user
// gesture), so nothing plays or even starts before that.
type Kind = "correct" | "takeoff" | "land" | "miss" | "celebrate";
const RECIPES: Record<Kind, { notes: [number, number, number][]; type: OscillatorType; gain: number }> = {
  correct: { notes: [[880, 0, 0.09]], type: "sine", gain: 0.08 },
  takeoff: { notes: [[520, 0, 0.08], [780, 0.05, 0.1]], type: "triangle", gain: 0.05 },
  land: { notes: [[180, 0, 0.12]], type: "sine", gain: 0.1 },
  miss: { notes: [[300, 0, 0.14], [250, 0.08, 0.14]], type: "sine", gain: 0.06 },
  celebrate: { notes: [[523, 0, 0.18], [659, 0.12, 0.18], [784, 0.24, 0.18], [1047, 0.36, 0.4]], type: "triangle", gain: 0.07 },
};

export function createSound() {
  let ctx: AudioContext | null = null;
  return {
    enable() { ctx ??= new AudioContext(); if (ctx.state === "suspended") void ctx.resume(); },
    play(kind: Kind) {
      if (!ctx) return;
      const r = RECIPES[kind], t0 = ctx.currentTime;
      for (const [freq, at, dur] of r.notes) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = r.type; o.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, t0 + at);
        g.gain.exponentialRampToValueAtTime(r.gain, t0 + at + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + dur);
        o.connect(g).connect(ctx.destination);
        o.start(t0 + at); o.stop(t0 + at + dur + 0.02);
      }
    },
    close() { void ctx?.close(); ctx = null; },
  };
}
