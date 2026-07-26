"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Approve / revoke buttons for one criterion. The decision is saved server-side
// and the page re-fetched, so the pill and badge state stay authoritative.
export default function CriterionDecision({
  learnerId,
  criterionId,
  met,
}: {
  learnerId: string;
  criterionId: string;
  met: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function decide(nextMet: boolean) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/instruct/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learnerId, criterionId, met: nextMet }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Didn't save — try again.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Didn't save — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      {met ? (
        <button onClick={() => decide(false)} disabled={busy} className="btn-ghost h-9 px-4 text-sm">
          {busy ? "Saving…" : "Revoke"}
        </button>
      ) : (
        <button onClick={() => decide(true)} disabled={busy} className="btn-primary h-9 px-4 text-sm">
          {busy ? "Saving…" : "Approve"}
        </button>
      )}
      {error && (
        <span className="max-w-40 text-right text-xs" style={{ color: "var(--danger)" }}>
          {error}
        </span>
      )}
    </div>
  );
}
