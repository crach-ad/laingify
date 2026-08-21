// 📊 Insights view for one class (ANALYTICS.md Phase B2). Server component —
// all charts are inline SVG/CSS in the existing design language; no client JS.

import Link from "next/link";
import { loadClassInsights } from "@/lib/insights";

function BarChart({ data, height = 96 }: { data: { label: string; value: number; sub?: number }[]; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const bw = 100 / data.length;
  return (
    <div>
      <svg viewBox={`0 0 100 40`} className="w-full" style={{ height }} preserveAspectRatio="none" role="img">
        {data.map((d, i) => {
          const h = (d.value / max) * 36;
          const sh = ((d.sub ?? 0) / max) * 36;
          return (
            <g key={i}>
              <rect x={i * bw + bw * 0.15} y={40 - h} width={bw * 0.7} height={h} rx="1" fill="var(--accent)" opacity="0.45" />
              {sh > 0 && <rect x={i * bw + bw * 0.15} y={40 - sh} width={bw * 0.7} height={sh} rx="1" fill="var(--accent)" />}
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex">
        {data.map((d, i) => (
          <span key={i} className="mono-label flex-1 text-center" style={{ fontSize: 9 }}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function Spark({ values }: { values: number[] }) {
  if (values.length === 0) return null;
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => `${values.length === 1 ? 50 : (i / (values.length - 1)) * 100},${28 - (v / max) * 24}`);
  return (
    <svg viewBox="0 0 100 30" className="h-7 w-24 shrink-0" preserveAspectRatio="none" role="img">
      <polyline points={pts.join(" ")} fill="none" stroke="var(--info)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1].split(",")[0]} cy={pts[pts.length - 1].split(",")[1]} r="3" fill="var(--info)" />
    </svg>
  );
}

function FunnelBar({ started, someEvidence, wrapUp, badge, total }: { started: number; someEvidence: number; wrapUp: number; badge: number; total: number }) {
  const w = (n: number) => (total === 0 ? 0 : (n / total) * 100);
  return (
    <div className="relative h-2.5 w-full overflow-hidden rounded-full" style={{ background: "var(--tile)" }}>
      <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${w(started)}%`, background: "#3a3f49" }} />
      <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${w(someEvidence)}%`, background: "var(--info)", opacity: 0.55 }} />
      <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${w(wrapUp)}%`, background: "var(--info)" }} />
      <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${w(badge)}%`, background: "var(--accent)" }} />
    </div>
  );
}

const TREND = { up: { icon: "↑", color: "var(--accent)" }, down: { icon: "↓", color: "var(--danger)" }, flat: { icon: "→", color: "var(--faint)" } } as const;

export default async function Insights({ classId, rosterCount }: { classId: string; rosterCount: number }) {
  const { weekly, funnel, writing, coverage, tracks, attention } = await loadClassInsights(classId);
  const activeFunnel = funnel.filter((f) => f.started > 0);
  const hasAnyData = weekly.weeks.some((w) => w.active > 0) || activeFunnel.length > 0;

  if (!hasAnyData) {
    return (
      <section className="animate-fade-up mt-8">
        <div className="card p-6">
          <p className="muted text-sm">
            No activity yet — insights light up as soon as learners start working. Check back after the first session.
          </p>
        </div>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Weekly engagement */}
      <section className="animate-fade-up mt-8">
        <div className="overline mb-3">Engagement</div>
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Active learners by week</h2>
          <span className="mono-label">
            {weekly.activeThisWeek}/{rosterCount} this week
            {weekly.retentionPct !== null && ` · ${weekly.retentionPct}% returned`}
          </span>
        </div>
        <div className="card mt-4 p-5">
          <BarChart data={weekly.weeks.map((w) => ({ label: w.week.slice(5), value: w.active, sub: w.returning }))} />
          <p className="muted mt-2 text-[12px]">
            Bright = learners who were also active the week before (returning); pale = all active learners.
          </p>
        </div>
      </section>

      {/* Needs attention */}
      {attention.length > 0 && (
        <section className="animate-fade-up">
          <div className="overline mb-3">Needs attention</div>
          <h2 className="text-xl font-semibold tracking-tight">Worth a check-in</h2>
          <div className="mt-4 flex flex-col gap-2.5">
            {attention.map((a) => (
              <Link key={a.learnerId} href={`/instruct/learner/${a.learnerId}`} className="block">
                <div className="card card-interactive flex items-center gap-4 p-4">
                  <span className="text-xl">👋</span>
                  <span className="min-w-0 flex-1">
                    <span className="display block text-sm font-semibold">{a.displayName}</span>
                    <span className="muted mt-0.5 block text-[13px]">{a.reasons.join(" · ")}</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Module funnel */}
      {activeFunnel.length > 0 && (
        <section className="animate-fade-up">
          <div className="overline mb-3">Completion funnel</div>
          <h2 className="text-xl font-semibold tracking-tight">Where each project stands</h2>
          <p className="muted mt-1.5 text-sm">
            Grey = started · pale blue = captured evidence · blue = wrap-up in · green = badge earned.
          </p>
          <div className="card mt-4 flex flex-col gap-4 p-5">
            {activeFunnel.map((f) => (
              <div key={f.moduleId} className="flex items-center gap-4">
                <span className="w-8 shrink-0 text-center text-xl">{f.badgeIcon}</span>
                <span className="w-56 shrink-0">
                  <span className="block truncate text-sm font-medium" style={{ color: "var(--body)" }}>{f.title}</span>
                  <span className="mono-label">
                    {f.badge}/{f.started} finished{f.medianMinutes !== null ? ` · ~${f.medianMinutes} min` : ""}
                  </span>
                </span>
                <span className="flex-1">
                  <FunnelBar started={f.started} someEvidence={f.someEvidence} wrapUp={f.wrapUp} badge={f.badge} total={Math.max(f.started, rosterCount)} />
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Writing growth */}
      {writing.length > 0 && (
        <section className="animate-fade-up">
          <div className="overline mb-3">Writing</div>
          <h2 className="text-xl font-semibold tracking-tight">Wrap-up writing over time</h2>
          <p className="muted mt-1.5 text-sm">Words per written wrap-up, oldest → newest.</p>
          <div className="card mt-4 flex flex-col gap-2 p-5">
            {writing.map((w) => {
              const t = w.trend ? TREND[w.trend] : null;
              const last = w.counts[w.counts.length - 1];
              return (
                <Link key={w.learnerId} href={`/instruct/learner/${w.learnerId}`} className="-mx-2 flex items-center gap-4 rounded-xl px-2 py-1 transition-colors hover:bg-[var(--card-hover)]">
                  <span className="w-36 truncate text-sm font-medium" style={{ color: "var(--body)" }}>{w.displayName}</span>
                  <Spark values={w.counts.map((c) => c.words)} />
                  <span className="mono-label flex-1">
                    {w.counts.length} wrap-up{w.counts.length === 1 ? "" : "s"} · last {last.words}w
                  </span>
                  {t && <span className="text-base font-semibold" style={{ color: t.color }}>{t.icon}</span>}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Strand coverage */}
      {coverage.rows.some((r) => r.total > 0) && (
        <section className="animate-fade-up">
          <div className="overline mb-3">Coverage</div>
          <h2 className="text-xl font-semibold tracking-tight">Badges by strand</h2>
          <div className="card mt-4 overflow-x-auto p-5">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="mono-label pb-2 pr-4 text-left font-normal">Learner</th>
                  {coverage.topics.map((t) => (
                    <th key={t} className="mono-label pb-2 px-2 text-center font-normal" title={t}>
                      {t.split(" ").map((w) => w[0]).join("").slice(0, 3)}
                    </th>
                  ))}
                  <th className="mono-label pb-2 pl-2 text-right font-normal">Total</th>
                </tr>
              </thead>
              <tbody>
                {coverage.rows.filter((r) => r.total > 0).map((r) => (
                  <tr key={r.learnerId}>
                    <td className="truncate py-1 pr-4 font-medium" style={{ color: "var(--body)", maxWidth: 160 }}>{r.displayName}</td>
                    {r.byTopic.map((n, i) => (
                      <td key={i} className="px-2 py-1 text-center">
                        {n > 0 ? (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-semibold" style={{ background: "rgba(182,242,77,.14)", color: "var(--accent)" }}>{n}</span>
                        ) : (
                          <span className="muted">·</span>
                        )}
                      </td>
                    ))}
                    <td className="mono-label py-1 pl-2 text-right">{r.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="muted mt-3 text-[12px]">Columns: {coverage.topics.join(" · ")}</p>
          </div>
        </section>
      )}

      {/* Track mix */}
      {tracks.length > 0 && (
        <section className="animate-fade-up">
          <div className="overline mb-3">Tracks</div>
          <h2 className="text-xl font-semibold tracking-tight">Difficulty tracks picked</h2>
          <div className="card mt-4 flex gap-6 p-5">
            {tracks.map((t) => (
              <span key={t.track}>
                <span className="display text-2xl font-semibold capitalize" style={{ color: "var(--accent)" }}>{t.count}</span>
                <span className="mono-label ml-2 capitalize">{t.track}</span>
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
