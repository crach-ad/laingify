"use client";

import { useState } from "react";

function todayLocal() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
}

// Generates a funder/stakeholder report for one class session: the
// instructor describes the lesson, the server combines it with that date's
// attendance, badges earned, and submissions, and opens the resulting report
// in a new tab (app/api/instruct/session-report/route.ts) — ready to read or
// print to PDF, same pattern as the portfolio downloads.
export default function SessionReport({ classId }: { classId: string }) {
  const [date, setDate] = useState(todayLocal);
  const [lessonDescription, setLessonDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    if (lessonDescription.trim().length < 10) {
      setError("Describe the session in a bit more detail first (a sentence or two).");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const url = `/api/instruct/session-report?classId=${encodeURIComponent(classId)}&date=${encodeURIComponent(
        date,
      )}&lessonDescription=${encodeURIComponent(lessonDescription.trim())}`;
      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not generate the report.");
      }
      const html = await res.text();
      const win = window.open("", "_blank");
      if (win) {
        win.document.open();
        win.document.write(html);
        win.document.close();
      } else {
        setError("Your browser blocked the pop-up — allow pop-ups for this site and try again.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate the report.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="animate-fade-up mt-8">
      <div className="overline mb-3">Session Report</div>
      <h2 className="text-xl font-semibold tracking-tight">Generate a stakeholder report</h2>
      <p className="muted mt-1.5 text-sm">
        Describe what happened in one session and get a funder-ready report: your description, attendance, badges
        earned, and highlights from what participants wrote — with Gemini drafting the narrative when it's available.
      </p>

      <div className="card mt-5 flex flex-col gap-4 p-5">
        <label className="flex flex-col gap-1.5">
          <span className="mono-label">Session date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="field w-fit px-3 py-2 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="mono-label">What happened this session?</span>
          <textarea
            value={lessonDescription}
            onChange={(e) => setLessonDescription(e.target.value)}
            placeholder="e.g. We covered variables and selection using the micro:bit sensor project — most of the group got their temperature alarm working, and a few extended it to log readings over time."
            rows={5}
            className="field px-3 py-2 text-sm"
          />
        </label>

        {error && (
          <p
            className="rounded-xl border px-4 py-3 text-sm"
            style={{ borderColor: "var(--danger-border)", background: "var(--danger-soft)", color: "var(--danger)" }}
          >
            {error}
          </p>
        )}

        <div>
          <button onClick={generate} disabled={busy} className="btn-primary px-5 py-2.5 text-sm disabled:opacity-50">
            {busy ? "Generating…" : "📄 Generate report"}
          </button>
        </div>
      </div>
    </section>
  );
}
