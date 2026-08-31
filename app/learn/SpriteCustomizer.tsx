"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const AVATARS = ["✨", "🦊", "🐢", "🐙", "🦉", "🐝", "🚀", "🌟", "🐲", "🦕", "🐱", "🤖"];
const COLORS = ["#b6f24d", "#6ea8ff", "#22c55e", "#f97316", "#ec4899", "#eab308"];
const PERSONALITIES = ["friendly", "playful", "calm", "curious", "encouraging"];

type Sprite = { name: string; avatar: string; color: string; personality: string };

// Learners name and design their Sprite; it persists across every class (PRD §8).
export default function SpriteCustomizer({ sprite }: { sprite: Sprite }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Sprite>(sprite);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/sprite/customize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Could not save your Sprite. Please try again.");
      }
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your Sprite. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="card card-interactive flex w-full items-center gap-6 rounded-[18px] px-6 py-5">
        <span
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[15px] border text-3xl"
          style={{ background: "#0f1712", borderColor: "var(--accent-border)" }}
        >
          {sprite.avatar}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2.5">
            <span className="display text-lg font-semibold">{sprite.name}</span>
            <span
              className="rounded-md border px-2 py-0.5 text-[10px]"
              style={{
                fontFamily: "var(--font-jetbrains)",
                letterSpacing: "0.04em",
                color: "var(--accent)",
                background: "var(--accent-soft)",
                borderColor: "rgba(182,242,77,0.2)",
              }}
            >
              YOUR SPRITE
            </span>
          </span>
          <span className="muted mt-1.5 block text-sm">
            Give your companion a new look, voice, and color.
          </span>
        </span>
        <button
          onClick={() => {
            setDraft(sprite);
            setError(null);
            setOpen(true);
          }}
          className="btn-primary shrink-0 px-4.5 py-2.5 text-sm"
        >
          Customize
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12h14M13 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="card animate-fade-up w-full max-w-md rounded-[18px] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold">Design your Sprite</h2>

            <div className="mt-5 flex items-center gap-4">
              <span
                className="flex h-16 w-16 items-center justify-center rounded-[15px] border text-3xl"
                style={{ background: "#0f1712", borderColor: draft.color }}
              >
                {draft.avatar}
              </span>
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                maxLength={40}
                placeholder="Name your Sprite"
                className="field flex-1 px-4 py-2.5 text-lg"
              />
            </div>

            <p className="mono-label mt-6">Look</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  onClick={() => setDraft({ ...draft, avatar: a })}
                  className="tile flex h-11 w-11 items-center justify-center text-2xl transition-transform hover:scale-105"
                  style={
                    draft.avatar === a
                      ? { borderColor: "var(--accent-border)", background: "var(--accent-soft)" }
                      : undefined
                  }
                >
                  {a}
                </button>
              ))}
            </div>

            <p className="mono-label mt-6">Color</p>
            <div className="mt-2 flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setDraft({ ...draft, color: c })}
                  style={{ background: c }}
                  className={`h-9 w-9 rounded-full transition-transform hover:scale-105 ${
                    draft.color === c ? "ring-2 ring-white/80" : ""
                  }`}
                />
              ))}
            </div>

            <p className="mono-label mt-6">Personality</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {PERSONALITIES.map((p) => (
                <button
                  key={p}
                  onClick={() => setDraft({ ...draft, personality: p })}
                  className={`rounded-lg px-4 py-2 text-sm capitalize ${
                    draft.personality === p ? "btn-primary" : "btn-ghost"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {error && (
              <p className="mt-5 text-sm" style={{ color: "#f87171" }}>
                {error}
              </p>
            )}

            <div className="mt-7 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="muted rounded-lg px-4 py-2 font-medium transition-colors hover:text-[var(--text)]"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={busy || !draft.name.trim()}
                className="btn-primary px-5 py-2 text-sm"
              >
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
