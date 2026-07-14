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

  async function decide(nextMet: boolean) {
    setBusy(true);
    try {
      await fetch("/api/instruct/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learnerId, criterionId, met: nextMet }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return met ? (
    <button onClick={() => decide(false)} disabled={busy} className="btn-ghost h-9 px-4 text-sm">
      {busy ? "Saving…" : "Revoke"}
    </button>
  ) : (
    <button onClick={() => decide(true)} disabled={busy} className="btn-primary h-9 px-4 text-sm">
      {busy ? "Saving…" : "Approve"}
    </button>
  );
}
