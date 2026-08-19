// Shared presentational pieces for the instructor console: header, review
// queue list, and roster progress list. Server-compatible (no client state).

import Link from "next/link";
import Logo from "@/components/Logo";
import LogoutButton from "./LogoutButton";
import type { QueueItem, RosterRow } from "@/lib/instructor-data";

export function ConsoleHeader({ orgLabel, instructorName }: { orgLabel: string; instructorName: string }) {
  return (
    <header className="flex items-center justify-between border-b border-[var(--border-soft)] pb-8">
      <div className="flex items-center gap-3.5">
        <Logo />
        <div className="flex items-baseline gap-3">
          <Link href="/instruct" className="display text-base font-semibold">
            Instructor Console
          </Link>
          <span className="mono-label">{orgLabel}</span>
        </div>
      </div>
      <div className="flex items-center gap-5">
        <span className="text-sm font-medium" style={{ color: "var(--body)" }}>
          {instructorName}
        </span>
        <LogoutButton />
      </div>
    </header>
  );
}

export function ReviewQueue({ queue, showClass }: { queue: QueueItem[]; showClass: boolean }) {
  return (
    <div className="mt-5 flex flex-col gap-3">
      {queue.map((q) => (
        <Link key={`${q.learnerId}:${q.moduleId}`} href={`/instruct/review/${q.learnerId}/${q.moduleId}`} className="block">
          <div className="card card-interactive flex items-center gap-5 p-5">
            <span className="tile flex h-11 w-11 shrink-0 items-center justify-center text-xl">{q.badgeIcon}</span>
            <span className="min-w-0 flex-1">
              <span className="display block text-base font-semibold">
                {q.learnerName} · {q.moduleTitle}
              </span>
              <span className="muted mt-1 block text-[13px]">
                {showClass ? `${q.className} — ` : ""}needs: {q.pending.join(", ")}
              </span>
            </span>
            <span className="pill pill-warn shrink-0">{q.pending.length} to review</span>
          </div>
        </Link>
      ))}
      {queue.length === 0 && (
        <div className="card p-6">
          <p className="muted text-sm">Nothing to review right now — you&apos;re all caught up.</p>
        </div>
      )}
    </div>
  );
}

export function RosterList({ roster }: { roster: RosterRow[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      {roster.map((r) => {
        const pct = r.total === 0 ? 0 : Math.round((r.done / r.total) * 100);
        return (
          <div key={r.learnerId} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-1">
          <Link
            href={`/instruct/learner/${r.learnerId}`}
            className="flex min-w-0 flex-1 items-center gap-4 rounded-xl transition-colors hover:bg-[var(--card-hover)]"
          >
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
            <span className="w-36 truncate text-sm font-medium" style={{ color: "var(--body)" }}>
              {r.displayName}
            </span>
            <span className="bar max-w-[220px] flex-1">
              <span
                style={{
                  width: `${pct}%`,
                  background: pct === 100 ? "var(--accent)" : r.inProgress > 0 ? "var(--info)" : "#3a3f49",
                }}
              />
            </span>
            <span className="mono-label w-28 text-right">
              {r.done}/{r.total} done{r.inProgress > 0 ? ` · ${r.inProgress} active` : ""}
            </span>
          </Link>
          <Link
            href={`/instruct/learner/${r.learnerId}/portfolio`}
            className="btn-ghost h-9 shrink-0 px-3 text-xs"
            title={`${r.displayName}'s full portfolio — all completed projects`}
          >
            📖 Portfolio
          </Link>
          </div>
        );
      })}
      {roster.length === 0 && <p className="muted text-sm">No learners on this roster yet.</p>}
    </div>
  );
}
