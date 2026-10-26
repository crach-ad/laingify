// Keyboard classification for the 3D preview — the same rules as the 2D
// game's ui.js, so "accepted input" means the same thing in both:
//   forms and dialogs are never read; shortcuts (Ctrl/Cmd/Alt), IME
//   composition, held-key repeats, non-letters, and letters pressed mid-leap
//   are ignored (counted by kind only, never as attempts); Escape pauses.
export type KeyLike = {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  repeat: boolean;
  isComposing: boolean;
  keyCode?: number;
  target?: EventTarget | { tagName?: string; isContentEditable?: boolean } | null;
};

export type KeyAction =
  | { kind: "none" } // not ours to handle (forms, non-typing keys)
  | { kind: "pause" }
  | { kind: "letter"; letter: string }
  | { kind: "ignored"; reason: "modifier" | "composition" | "repeat" | "nonletter" | "busy" };

export function classifyKey(e: KeyLike, game: { live: boolean; jumping: boolean }): KeyAction {
  const el = (e.target ?? null) as { tagName?: string; isContentEditable?: boolean } | null;
  if (/^(INPUT|SELECT|TEXTAREA)$/.test(el?.tagName ?? "") || el?.isContentEditable) return { kind: "none" };
  const char = e.key.length === 1;
  if (e.ctrlKey || e.metaKey || e.altKey) return game.live && char ? { kind: "ignored", reason: "modifier" } : { kind: "none" };
  if (e.isComposing || e.keyCode === 229) return game.live ? { kind: "ignored", reason: "composition" } : { kind: "none" };
  if (e.repeat) return game.live && char ? { kind: "ignored", reason: "repeat" } : { kind: "none" };
  if (e.key === "Escape") return { kind: "pause" };
  if (!game.live || !char) return { kind: "none" };
  if (/^[a-z]$/i.test(e.key)) return game.jumping ? { kind: "ignored", reason: "busy" } : { kind: "letter", letter: e.key.toLowerCase() };
  return { kind: "ignored", reason: "nonletter" };
}
