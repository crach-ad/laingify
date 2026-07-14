"use client";

import { useEffect, useRef, useState } from "react";

type Turn = { role: "user" | "model"; text: string };
type SpriteInfo = { name: string; avatar: string; color: string };

// The Help Sprite: a learner's persistent companion, available on every learn
// page. It gives insight, never answers (PRD §8). UI only — the rules live
// server-side in lib/gemini.ts.
// (Supersedes SpriteWidget.tsx, which is OS-locked and can no longer be edited.)
export default function SpriteChat({
  sprite,
  moduleId,
}: {
  sprite: SpriteInfo;
  moduleId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [turns, open]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    const history = turns.slice();
    setTurns([...history, { role: "user", text }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/sprite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, message: text, history }),
      });
      const data = await res.json();
      const reply = res.ok
        ? data.reply
        : data.error || "I'm having trouble right now — try again in a moment.";
      setTurns((t) => [...t, { role: "model", text: reply }]);
    } catch {
      setTurns((t) => [...t, { role: "model", text: "I couldn't reach the network just now." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close your Sprite" : "Ask your Sprite"}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-2xl border text-2xl transition-transform hover:scale-105"
        style={{ background: "#0f1712", borderColor: sprite.color }}
      >
        {sprite.avatar}
      </button>

      {open && (
        <div className="card animate-fade-up fixed bottom-22 right-5 z-40 flex h-[28rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-[18px]">
          <div className="flex items-center gap-3 border-b border-[var(--border-soft)] px-4 py-3">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-[10px] border text-xl"
              style={{ background: "#0f1712", borderColor: sprite.color }}
            >
              {sprite.avatar}
            </span>
            <div>
              <p className="display font-semibold leading-tight">{sprite.name}</p>
              <p className="mono-label mt-0.5 text-[10px]">Hints, not answers</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {turns.length === 0 && (
              <p className="muted text-sm">
                Hi! Stuck on something? Ask me and I&apos;ll help you figure it out — I won&apos;t
                just hand over the answer.
              </p>
            )}
            {turns.map((t, i) => (
              <div key={i} className={t.role === "user" ? "text-right" : "text-left"}>
                <span
                  className="inline-block max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm"
                  style={
                    t.role === "user"
                      ? { background: "var(--accent)", color: "var(--bg)", fontWeight: 500 }
                      : { background: "var(--tile)", border: "1px solid var(--border-soft)", color: "var(--text)" }
                  }
                >
                  {t.text}
                </span>
              </div>
            ))}
            {busy && <p className="muted text-sm">{sprite.name} is thinking…</p>}
          </div>

          <form onSubmit={send} className="flex gap-2 border-t border-[var(--border-soft)] p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for a hint…"
              className="field flex-1 px-4 py-2 text-sm"
            />
            <button type="submit" disabled={busy || !input.trim()} className="btn-primary px-4 py-2 text-sm">
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
