"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Instructor reply into a learner's discussion thread.
export default function ReplyBox({ threadId }: { threadId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/instruct/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, message }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Didn't send — try again.");
      }
      setMessage("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Didn't send — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={send} className="mt-3">
      <div className="flex items-center gap-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Reply as instructor…"
          className="field flex-1 px-3.5 py-2.5 text-sm"
        />
        <button type="submit" disabled={busy || !message.trim()} className="btn-primary h-10 px-4 text-sm">
          {busy ? "Sending…" : "Reply"}
        </button>
      </div>
      {error && (
        <p className="mt-1.5 text-xs" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
    </form>
  );
}
