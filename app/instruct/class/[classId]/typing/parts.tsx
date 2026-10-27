// Presentational pieces for the Letter Leaper instructor pages. Server
// components; charts are inline SVG (no chart library — see ANALYTICS.md),
// each with a text equivalent.

import Link from "next/link";
import type { TypingFilters } from "@/lib/typing-data";
import { MIN_KEY_SAMPLES, type KeyRow, type Trend } from "@/lib/typing-report";
import { KEY_ROWS, day, delta, num, pct } from "@/lib/typing-format";

export function Stat({ value, label, color }: { value: string | number; label: string; color?: string }) {
  return (
    <span className="card px-4 py-3">
      <span className="display text-2xl font-semibold" style={color ? { color } : undefined}>
        {value}
      </span>
      <span className="mono-label ml-2">{label}</span>
    </span>
  );
}

export function NotEnough({ children }: { children: React.ReactNode }) {
  return <span className="mono-label" style={{ color: "var(--faint)" }}>{children}</span>;
}

// GET form: the URL is the filter state, so links and exports can carry it.
export function Filters({ action, f }: { action: string; f: TypingFilters }) {
  const select = (name: keyof TypingFilters, label: string, options: [string, string][]) => (
    <label className="flex flex-col gap-1">
      <span className="mono-label">{label}</span>
      <select name={name} defaultValue={f[name] ?? ""} className="field h-10 px-3 text-sm">
        <option value="">Any</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </label>
  );
  return (
    <form method="get" action={action} className="card mt-6 flex flex-wrap items-end gap-3 p-4">
      <label className="flex flex-col gap-1">
        <span className="mono-label">From</span>
        <input type="date" name="from" defaultValue={f.from ?? ""} className="field h-10 px-3 text-sm" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="mono-label">To</span>
        <input type="date" name="to" defaultValue={f.to ?? ""} className="field h-10 px-3 text-sm" />
      </label>
      {select("phase", "Practice", [["letter", "Letters"], ["word", "Words"]])}
      {select("letterSet", "Keys", [["all", "All letters"], ["home", "Home row"], ["top", "Top row"], ["bottom", "Bottom row"]])}
      {select("pace", "Difficulty", [["easy", "Easy"], ["medium", "Medium"], ["hard", "Hard"], ["relaxed", "Relaxed (older)"], ["steady", "Steady (older)"], ["speedy", "Speedy (older)"], ["falls", "Falling platforms (older)"]])}
      {select("input", "Input", [["keyboard", "Keyboard"], ["touch", "On-screen keys"], ["mixed", "Mixed"]])}
      <button type="submit" className="btn-primary h-10 px-4 text-sm">Apply</button>
      <Link href={action} className="btn-ghost flex h-10 items-center px-4 text-sm">Clear</Link>
    </form>
  );
}

const heat = (rate: number) =>
  rate >= 0.3 ? "var(--danger)" : rate >= 0.15 ? "var(--warn)" : rate > 0.05 ? "var(--info)" : "var(--accent)";

// Per-key accuracy laid out as a keyboard; keys under MIN_KEY_SAMPLES are
// shown dashed and unrated, so small samples aren't read as findings.
export function KeyboardHeatmap({ keys }: { keys: KeyRow[] }) {
  const byKey = new Map(keys.map((k) => [k.key, k]));
  return (
    <div>
      <div className="flex flex-col items-center gap-1.5" role="img" aria-label="Keyboard heatmap of per-key accuracy; the table below lists the same numbers.">
        {KEY_ROWS.map((row, i) => (
          <div key={row} className="flex gap-1.5" style={{ marginLeft: i * 14 }}>
            {row.split("").map((k) => {
              const s = byKey.get(k);
              const rated = s && s.samples >= MIN_KEY_SAMPLES;
              return (
                <span
                  key={k}
                  title={s ? `${k.toUpperCase()}: ${pct(1 - s.errorRate)} right of ${s.samples} (${s.errors} wrong, ${s.timeouts} timeouts)` : `${k.toUpperCase()}: no samples`}
                  className="flex h-12 w-9 flex-col items-center justify-center rounded-lg text-sm font-semibold sm:w-11"
                  style={{
                    border: `1px ${rated ? "solid" : "dashed"} ${rated ? heat(s.errorRate) : "var(--border)"}`,
                    background: rated ? `color-mix(in srgb, ${heat(s.errorRate)} 22%, transparent)` : "transparent",
                    color: s ? "var(--text)" : "var(--faint)",
                  }}
                >
                  {k.toUpperCase()}
                  <span className="text-[10px] font-normal" style={{ color: "var(--muted)" }}>{s ? s.samples : "–"}</span>
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <p className="muted mt-3 text-center text-xs">
        Small number = samples (attempts + timeouts). Colour shows the miss rate once a key has {MIN_KEY_SAMPLES}+ samples:
        <span style={{ color: "var(--accent)" }}> ≤5%</span> · <span style={{ color: "var(--info)" }}>5–15%</span> ·
        <span style={{ color: "var(--warn)" }}> 15–30%</span> · <span style={{ color: "var(--danger)" }}>30%+</span>
      </p>
    </div>
  );
}

export function KeyTable({ keys }: { keys: KeyRow[] }) {
  const rows = keys.filter((k) => k.samples > 0).sort((a, b) => b.errorRate - a.errorRate || b.samples - a.samples);
  if (!rows.length) return <p className="muted text-sm">No keys recorded yet.</p>;
  return (
    <div className="max-h-72 overflow-auto">
      <table className="w-full text-left text-sm">
        <thead className="mono-label">
          <tr><th className="py-1.5">Key</th><th>Samples</th><th>Right</th><th>Wrong key</th><th>Timeouts</th><th>Miss rate</th></tr>
        </thead>
        <tbody>
          {rows.map((k) => (
            <tr key={k.key} className="border-t border-[var(--border-soft)]">
              <td className="py-1.5 font-semibold">{k.key.toUpperCase()}</td>
              <td>{k.samples}{k.samples < MIN_KEY_SAMPLES ? <span className="muted"> (few)</span> : null}</td>
              <td>{k.attempts - k.errors}</td>
              <td>{k.errors}</td>
              <td>{k.timeouts}</td>
              <td>{pct(k.errorRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Accuracy (lime, left scale 0–100%) and correct CPM (blue, right scale) per
// comparable session, with the comparison and sample sizes spelled out.
export function TrendChart({ trend }: { trend: Trend }) {
  const W = 560, H = 150, P = 28;
  const pts = trend.points;
  const maxCpm = Math.max(10, ...pts.map((p) => p.correctCpm ?? 0));
  const x = (i: number) => (pts.length === 1 ? W / 2 : P + (i * (W - 2 * P)) / (pts.length - 1));
  const yAcc = (a: number) => H - P - a * (H - 2 * P);
  const yCpm = (c: number) => H - P - (c / maxCpm) * (H - 2 * P);
  const line = (ys: (number | null)[]) => ys.map((y, i) => (y === null ? "" : `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y.toFixed(1)}`)).join(" ");
  const c = trend.change;
  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-semibold">{trend.label}</span>
        {c.status === "ok" ? (
          <span className="mono-label">
            {delta(c.accuracyPts, "pts accuracy")} · {delta(c.correctCpm, "correct CPM")} — last {c.recentN} vs previous {c.earlierN} sessions ({c.recentAttempts} vs {c.earlierAttempts} attempts)
          </span>
        ) : (
          <NotEnough>Not enough data: {c.reason}</NotEnough>
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" role="img" aria-label={`${trend.label}: accuracy and correct characters per minute over ${pts.length} sessions`}>
        {[0, 0.5, 1].map((g) => (
          <line key={g} x1={P} x2={W - P} y1={yAcc(g)} y2={yAcc(g)} stroke="var(--border-soft)" />
        ))}
        <text x={2} y={yAcc(1) + 4} fontSize="10" fill="var(--muted)">100%</text>
        <text x={2} y={yAcc(0) + 4} fontSize="10" fill="var(--muted)">0%</text>
        <text x={W - 2} y={yCpm(maxCpm) + 4} fontSize="10" fill="var(--info)" textAnchor="end">{Math.round(maxCpm)}</text>
        <path d={line(pts.map((p) => yAcc(p.accuracy)))} fill="none" stroke="var(--accent)" strokeWidth="2" />
        <path d={line(pts.map((p) => (p.correctCpm === null ? null : yCpm(p.correctCpm))))} fill="none" stroke="var(--info)" strokeWidth="2" strokeDasharray="5 4" />
        {pts.map((p, i) => (
          <g key={p.sessionId}>
            <circle cx={x(i)} cy={yAcc(p.accuracy)} r="3.5" fill="var(--accent)">
              <title>{`${day(p.date)}: ${pct(p.accuracy)} accuracy, ${num(p.correctCpm)} CPM, ${p.attempts} attempts`}</title>
            </circle>
            {p.correctCpm !== null && <circle cx={x(i)} cy={yCpm(p.correctCpm)} r="3" fill="var(--info)" />}
          </g>
        ))}
      </svg>
      <p className="muted mt-1 text-xs">
        <span style={{ color: "var(--accent)" }}>— accuracy</span> · <span style={{ color: "var(--info)" }}>- - correct characters/min</span> ·{" "}
        {pts.map((p) => `${day(p.date)} (${p.attempts})`).join(", ")}
      </p>
    </div>
  );
}

// Where a session's time went. Only "counted response" feeds speed figures.
export function TimeBar({ parts }: { parts: { label: string; ms: number; color: string }[] }) {
  const total = parts.reduce((n, p) => n + p.ms, 0) || 1;
  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full" style={{ background: "var(--tile)" }}>
        {parts.map((p) => (
          <span key={p.label} style={{ width: `${(p.ms / total) * 100}%`, background: p.color }} title={p.label} />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {parts.map((p) => (
          <span key={p.label} className="muted">
            <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: p.color }} />
            {p.label}: {(p.ms / 60_000).toFixed(1)} min
          </span>
        ))}
      </div>
    </div>
  );
}
