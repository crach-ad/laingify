"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Instructor reply into a learner's discussion thread.
export default function ReplyBox({ threadId }: { threadId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setBusy(true);
    try {
      await fetch("/api/instruct/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, message }),
      });
      setMessage("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={send} className="mt-3 flex items-center gap-2">
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Reply as instructor…"
        className="field flex-1 px-3.5 py-2.5 text-sm"
      />
      <button type="submit" disabled={busy || !message.trim()} className="btn-primary h-10 px-4 text-sm">
        {busy ? "Sending…" : "Reply"}
      </button>
    </form>
  );
}
