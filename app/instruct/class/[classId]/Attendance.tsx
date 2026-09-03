"use client";

import { useEffect, useState } from "react";

type Row = {
  learnerId: string;
  displayName: string;
  photoUrl: string | null;
  status: string | null;
  note: string | null;
  activeToday: boolean;
};

const STATUSES: { key: string; label: string; color: string; soft: string; border: string }[] = [
  { key: "PRESENT", label: "Present", color: "var(--accent)", soft: "var(--accent-soft)", border: "var(--accent-border)" },
  { key: "LATE", label: "Late", color: "#f2b84d", soft: "rgba(242,184,77,0.12)", border: "rgba(242,184,77,0.3)" },
  { key: "ABSENT", label: "Absent", color: "var(--danger)", soft: "var(--danger-soft)", border: "var(--danger-border)" },
  { key: "EXCUSED", label: "Excused", color: "var(--info)", soft: "var(--info-soft)", border: "var(--info-border)" },
];

function todayLocal() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
}

export default function Attendance({ classId }: { classId: string }) {
  const [date, setDate] = useState(todayLocal);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetch(`/api/instruct/attendance?classId=${classId}&date=${date}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.roster) setRows(data.roster);
        else setError(data.error || "Could not load attendance.");
      })
      .catch(() => !cancelled && setError("Could not load attendance."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [classId, date]);

  async function save(records: { learnerId: string; status: string }[]) {
    const ids = new Set(records.map((r) => r.learnerId));
    setSaving((s) => new Set([...s, ...ids]));
    setError("");
    try {
      const res = await fetch("/api/instruct/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, date, records }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not save.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving((s) => {
        const next = new Set(s);
        ids.forEach((id) => next.delete(id));
        return next;
      });
    }
  }

  function setStatus(learnerId: string, status: string) {
    setRows((r) => r.map((row) => (row.learnerId === learnerId ? { ...row, status } : row)));
    save([{ learnerId, status }]);
  }

  // Login activity (lib/track.ts's session_start/etc. events) pre-suggests
  // Present for anyone who's touched the platform today, but only a real
  // record counts — this just confirms the suggestion in one click, leaving
  // everyone with no signal (hands-on work, or genuinely absent) for the
  // instructor to check by hand.
  function confirmSuggested() {
    const targets = rows.filter((r) => !r.status && r.activeToday).map((r) => r.learnerId);
    if (targets.length === 0) return;
    setRows((r) => r.map((row) => (!row.status && row.activeToday ? { ...row, status: "PRESENT" } : row)));
    save(targets.map((learnerId) => ({ learnerId, status: "PRESENT" })));
  }

  const counts = STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s.key] = rows.filter((r) => r.status === s.key).length;
    return acc;
  }, {});
  const unmarked = rows.filter((r) => !r.status).length;
  const suggested = rows.filter((r) => !r.status && r.activeToday).length;

  return (
    <section className="animate-fade-up mt-8">
      <div className="overline mb-3">Attendance</div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Take attendance</h2>
          <p className="muted mt-1.5 text-sm">
            {loading
              ? "Loading…"
              : rows.length === 0
              ? "No learners on this roster yet."
              : [
                  ...STATUSES.filter((s) => counts[s.key] > 0).map((s) => `${counts[s.key]} ${s.label.toLowerCase()}`),
                  unmarked > 0 ? `${unmarked} unmarked${suggested > 0 ? ` (${suggested} logged in)` : ""}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="field px-3 py-2 text-sm"
          />
          <button onClick={confirmSuggested} disabled={suggested === 0} className="btn-ghost px-4 py-2 text-sm">
            ✓ Confirm {suggested > 0 ? `${suggested} ` : ""}logged in as present
          </button>
        </div>
      </div>

      {error && (
        <p
          className="mt-4 rounded-xl border px-4 py-3 text-sm"
          style={{ borderColor: "var(--danger-border)", background: "var(--danger-soft)", color: "var(--danger)" }}
        >
          {error}
        </p>
      )}

      <div className="card mt-5 p-5">
        {loading ? (
          <p className="muted text-sm">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="muted text-sm">No learners on this roster yet.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {rows.map((r) => (
              <div key={r.learnerId} className="-mx-2 flex items-center gap-4 rounded-xl px-2 py-1.5">
                {r.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.photoUrl}
                    alt=""
                    className="h-8 w-8 shrink-0 rounded-full border border-[var(--border)] object-cover"
                  />
                ) : (
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-xs font-semibold"
                    style={{ background: "var(--tile)", color: "var(--accent)", fontFamily: "var(--font-grotesk)" }}
                  >
                    {r.displayName.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate text-sm font-medium" style={{ color: "var(--body)" }}>
                  {r.displayName}
                </span>
                {!r.status && r.activeToday && (
                  <span
                    className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium"
                    style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                    title="Has activity on the platform today — a hint, not a confirmed record"
                  >
                    🟢 logged in
                  </span>
                )}
                <div className="flex shrink-0 gap-1.5">
                  {STATUSES.map((s) => {
                    const active = r.status === s.key;
                    return (
                      <button
                        key={s.key}
                        onClick={() => setStatus(r.learnerId, s.key)}
                        disabled={saving.has(r.learnerId)}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40"
                        style={{
                          background: active ? s.soft : "var(--tile)",
                          color: active ? s.color : "var(--faint)",
                          border: `1px solid ${active ? s.border : "var(--border-soft)"}`,
                        }}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
