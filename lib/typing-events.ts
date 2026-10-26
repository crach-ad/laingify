// Letter Leaper event contract (measurement version 1) and the server-side
// validation for an upload batch. Pure — no database or Next imports — so it
// is unit-tested directly (tests/typing-progress.test.mjs). The contract is
// documented in docs/letter-leaper-progress.md; public/games/letter-leaper/
// tracker.js is the only producer.

export const MEASUREMENT_VERSION = 1;
export const LETTER_SETS = ["all", "home", "top", "bottom"] as const;
export const PACES = ["relaxed", "steady", "speedy"] as const;
// Paces a recorded session may have: the teacher-settable ones, plus "falls"
// (falling platforms: 7 s per letter, hints on), offered from a class link —
// never a teacher setting, and compared only with other falls sessions.
export const SESSION_PACES = [...PACES, "falls"] as const;
export const SCOPES = ["letters", "words", "full"] as const;
export const MAX_BATCH_EVENTS = 200;
export const MAX_BATCH_BYTES = 64 * 1024;
// A session may be uploaded (e.g. after a long offline stretch) for this long.
// Times, waits, and clocks are bounded by the same window: a relaxed target
// left on screen for an hour is real (the idle cap discounts it), not invalid.
export const MAX_SESSION_AGE_MS = 14 * 24 * 60 * 60 * 1000;
const MAX_RT_MS = MAX_SESSION_AGE_MS;
const MAX_T_MS = MAX_SESSION_AGE_MS;
// Device clocks can run fast; anything later than now is clamped at ingest.
const MAX_CLOCK_SKEW_MS = 24 * 60 * 60 * 1000;
const STAGES = ["jungle", "mountains", "clouds", "atmosphere", "moon", "stars"];
const PAUSE_REASONS = ["user", "hidden", "help", "moon", "leaderboard"];
const IGNORED_KINDS = ["repeat", "modifier", "composition", "paste", "nonletter", "busy"] as const;

export type LetterSet = (typeof LETTER_SETS)[number];
export type Pace = (typeof PACES)[number];
export type SessionPace = (typeof SESSION_PACES)[number];
export type Scope = (typeof SCOPES)[number];
export type IgnoredKind = (typeof IGNORED_KINDS)[number];

// Fields stored in TypingEvent.data, keyed by event type.
export type EventData =
  | { type: "session_start"; leap: number; resumed: boolean }
  | { type: "target"; target: string; kind: "letter" | "word"; leap: number }
  | { type: "key"; exp: string; got: string; pos: number; ok: boolean; rt: number; src: "kbd" | "screen" }
  | { type: "complete"; target: string; leap: number }
  | { type: "timeout"; target: string; pos: number; rt: number }
  | { type: "pause"; reason: string }
  | { type: "resume"; reason: string }
  | { type: "stage"; stage: string; leap: number }
  | { type: "end"; reason: "completed" | "exited"; leap: number }
  | { type: "connection"; state: "lost" | "restored" };

// `at` is the device's wall-clock time (epoch ms) — used for "last activity"
// and "ended at", since `t` continues across a resume and skips the gap.
export type TypingEventIn = EventData & { id: string; seq: number; t: number; at?: number };

export type SessionIn = {
  id: string;
  letterSet: LetterSet;
  pace: SessionPace;
  scope: Scope;
  hints: boolean;
  gameVersion: string;
  measurementVersion: number;
  startedAt: number;
};

export type Clocks = { activeMs: number; pauseMs: number; animationMs: number; hiddenMs: number };
export type Ignored = Record<IgnoredKind, number>;

export type BatchIn = {
  ticket: string;
  session: SessionIn;
  clocks: Clocks;
  ignored: Ignored;
  events: TypingEventIn[];
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isInt = (v: unknown, min: number, max: number): v is number =>
  Number.isSafeInteger(v) && (v as number) >= min && (v as number) <= max;
const isLetter = (v: unknown): v is string => typeof v === "string" && /^[a-z]$/.test(v);
const isTarget = (v: unknown): v is string => typeof v === "string" && /^[a-z]{1,3}$/.test(v);
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const oneOf = <T extends string>(v: unknown, list: readonly T[]): v is T => typeof v === "string" && list.includes(v as T);

// Returns the event's stored fields, or null when anything is off.
export function parseEventData(raw: Record<string, unknown>): EventData | null {
  switch (raw.type) {
    case "session_start":
      return isInt(raw.leap, 0, 149) && typeof raw.resumed === "boolean"
        ? { type: "session_start", leap: raw.leap, resumed: raw.resumed }
        : null;
    case "target":
      return isTarget(raw.target) && oneOf(raw.kind, ["letter", "word"] as const) && isInt(raw.leap, 1, 150) &&
        (raw.kind === "letter") === (raw.target.length === 1)
        ? { type: "target", target: raw.target, kind: raw.kind, leap: raw.leap }
        : null;
    case "key":
      return isLetter(raw.exp) && isLetter(raw.got) && isInt(raw.pos, 0, 2) && raw.ok === (raw.exp === raw.got) &&
        isInt(raw.rt, 0, MAX_RT_MS) && oneOf(raw.src, ["kbd", "screen"] as const)
        ? { type: "key", exp: raw.exp, got: raw.got, pos: raw.pos, ok: raw.ok as boolean, rt: raw.rt, src: raw.src }
        : null;
    case "complete":
      return isTarget(raw.target) && isInt(raw.leap, 1, 150) ? { type: "complete", target: raw.target, leap: raw.leap } : null;
    case "timeout":
      return isTarget(raw.target) && isInt(raw.pos, 0, raw.target.length - 1) && isInt(raw.rt, 0, MAX_RT_MS)
        ? { type: "timeout", target: raw.target, pos: raw.pos, rt: raw.rt }
        : null;
    case "pause":
    case "resume":
      return oneOf(raw.reason, PAUSE_REASONS) ? { type: raw.type, reason: raw.reason } : null;
    case "stage":
      return oneOf(raw.stage, STAGES) && isInt(raw.leap, 0, 150) ? { type: "stage", stage: raw.stage, leap: raw.leap } : null;
    case "end":
      return oneOf(raw.reason, ["completed", "exited"] as const) && isInt(raw.leap, 0, 150)
        ? { type: "end", reason: raw.reason, leap: raw.leap }
        : null;
    case "connection":
      return oneOf(raw.state, ["lost", "restored"] as const) ? { type: "connection", state: raw.state } : null;
    default:
      return null;
  }
}

export type BatchResult = { ok: true; batch: BatchIn } | { ok: false; error: string };

// Shape, size, and ordering checks for one upload. Plausibility against the
// stored session (seq overlap, clock regressions) happens at ingest.
export function parseBatch(raw: unknown, now = Date.now()): BatchResult {
  if (!isObj(raw)) return { ok: false, error: "Expected a JSON object." };
  if (typeof raw.ticket !== "string" || raw.ticket.length > 2048) return { ok: false, error: "Missing practice ticket." };

  const s = raw.session;
  if (!isObj(s)) return { ok: false, error: "Missing session." };
  if (typeof s.id !== "string" || !UUID.test(s.id)) return { ok: false, error: "Invalid session id." };
  if (!oneOf(s.letterSet, LETTER_SETS) || !oneOf(s.pace, SESSION_PACES) || !oneOf(s.scope, SCOPES) || typeof s.hints !== "boolean") {
    return { ok: false, error: "Invalid practice settings." };
  }
  if (s.hints !== (s.pace === "relaxed" || s.pace === "falls")) return { ok: false, error: "Hints follow the pace in this version." };
  if (typeof s.gameVersion !== "string" || !/^[\w.-]{1,32}$/.test(s.gameVersion)) return { ok: false, error: "Invalid game version." };
  if (s.measurementVersion !== MEASUREMENT_VERSION) return { ok: false, error: "Unsupported measurement version." };
  if (!isInt(s.startedAt, now - MAX_SESSION_AGE_MS, now + MAX_CLOCK_SKEW_MS)) return { ok: false, error: "Session start time is out of range." };

  const c = raw.clocks;
  if (!isObj(c) || !isInt(c.activeMs, 0, MAX_T_MS) || !isInt(c.pauseMs, 0, MAX_T_MS) || !isInt(c.animationMs, 0, MAX_T_MS) || !isInt(c.hiddenMs, 0, MAX_T_MS)) {
    return { ok: false, error: "Invalid clocks." };
  }
  const ig = raw.ignored;
  if (!isObj(ig) || !IGNORED_KINDS.every((k) => isInt(ig[k], 0, 1_000_000))) return { ok: false, error: "Invalid ignored-input counts." };

  if (!Array.isArray(raw.events) || raw.events.length > MAX_BATCH_EVENTS) return { ok: false, error: `Send 0–${MAX_BATCH_EVENTS} events per batch.` };
  const events: TypingEventIn[] = [];
  const ids = new Set<string>();
  for (const e of raw.events) {
    if (!isObj(e) || typeof e.id !== "string" || !UUID.test(e.id) || !isInt(e.seq, 0, 100_000) || !isInt(e.t, 0, MAX_T_MS) ||
      (e.at !== undefined && !isInt(e.at, now - MAX_SESSION_AGE_MS, now + MAX_CLOCK_SKEW_MS))) {
      return { ok: false, error: "Invalid event envelope." };
    }
    const data = parseEventData(e);
    if (!data) return { ok: false, error: `Invalid ${String(e.type).slice(0, 20)} event at seq ${e.seq}.` };
    const prev = events[events.length - 1];
    if (prev && e.seq !== prev.seq + 1) return { ok: false, error: "Events must be in consecutive sequence order." };
    if (prev && e.t < prev.t) return { ok: false, error: "Event times must not go backwards." };
    if (ids.has(e.id)) return { ok: false, error: "Duplicate event id in batch." };
    ids.add(e.id);
    events.push({ ...data, id: e.id, seq: e.seq, t: e.t, ...(e.at !== undefined ? { at: e.at as number } : {}) } as TypingEventIn);
  }
  if (events.length && events[0].seq === 0 && events[0].type !== "session_start") {
    return { ok: false, error: "A session's first event must be session_start." };
  }

  return {
    ok: true,
    batch: {
      ticket: raw.ticket,
      session: s as unknown as SessionIn,
      clocks: { activeMs: c.activeMs, pauseMs: c.pauseMs, animationMs: c.animationMs, hiddenMs: c.hiddenMs } as Clocks,
      ignored: Object.fromEntries(IGNORED_KINDS.map((k) => [k, ig[k]])) as Ignored,
      events,
    },
  };
}

// Which of an incoming batch's events are new, given what is already stored.
// Same id at the same seq = a retry (skip). A different id at a stored seq
// means two writers for one session — reject rather than guess.
export function planInsert(
  incoming: TypingEventIn[],
  stored: { id: string; seq: number }[],
): { ok: true; fresh: TypingEventIn[] } | { ok: false; error: string } {
  const bySeq = new Map(stored.map((e) => [e.seq, e.id]));
  const storedIds = new Set(stored.map((e) => e.id));
  const fresh: TypingEventIn[] = [];
  for (const e of incoming) {
    const existing = bySeq.get(e.seq);
    if (existing === e.id) continue;
    if (existing !== undefined || storedIds.has(e.id)) return { ok: false, error: `Event ${e.seq} conflicts with a stored event.` };
    fresh.push(e);
  }
  return { ok: true, fresh };
}
