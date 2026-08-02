// Shared portfolio renderer: the learner's work grouped by tutorial step —
// photos, voice notes, written work, and interactive 3D models — crowned by
// the badge when the module is complete. Print-friendly (see `.portfolio`
// rules in globals.css); the standalone-download route reuses this exact
// structure server-side.

import StlViewer from "@/components/StlViewer";

export const isStlItem = (item: { type?: string; caption?: string | null }) =>
  item.type === "FILE" && /\.stl\b/i.test(item.caption ?? "");

export type PortfolioItem = {
  id: string;
  kind: "evidence" | "submission";
  type?: string; // evidence: TEXT | AUDIO | PHOTO | FILE
  text?: string | null;
  url?: string | null;
  caption?: string | null;
  feedbackSummary?: string | null;
  createdAt: Date;
};

export type PortfolioSection = { title: string; items: PortfolioItem[] };

export type PortfolioData = {
  learner: { displayName: string; photoUrl: string | null };
  module: { title: string; summary: string; badgeName: string; badgeIcon: string };
  orgName: string;
  complete: boolean;
  progress: { met: number; required: number };
  projectSummary: string | null;
  sections: PortfolioSection[];
  stats: { photoCount: number; audioCount: number; wordCount: number };
  finishedAt: Date | null;
};

const DATE_FMT = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" });
const TIME_FMT = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

function ItemBody({ item }: { item: PortfolioItem }) {
  if (item.kind === "submission") {
    return (
      <>
        <p className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: "var(--body)" }}>
          {item.text}
        </p>
        {item.feedbackSummary && (
          <p className="muted mt-3 border-l-2 pl-3 text-[13px] italic" style={{ borderColor: "var(--accent-border)" }}>
            Feedback: {item.feedbackSummary}
          </p>
        )}
      </>
    );
  }
  if (item.type === "PHOTO" && item.url) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.url}
          alt={item.caption ?? "Work photo"}
          className="max-h-80 rounded-lg border border-[var(--border-soft)]"
        />
        {item.caption && <p className="muted mt-2 text-[13px]">{item.caption}</p>}
      </>
    );
  }
  if (isStlItem(item) && item.url) {
    return (
      <>
        <StlViewer url={item.url} />
        <p className="muted mt-2 text-[13px]">
          {item.caption} — drag to spin, scroll to zoom. This is the actual designed object.
        </p>
        <p className="portfolio-print-only muted text-[12px]">(Interactive 3D model — view in the online portfolio)</p>
      </>
    );
  }
  if (item.type === "AUDIO") {
    return (
      <>
        {item.url && <audio controls src={item.url} className="portfolio-audio w-full max-w-sm" />}
        {item.text && (
          <>
            <p className="mono-label mt-3">Transcript</p>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed" style={{ color: "var(--body)" }}>
              {item.text}
            </p>
          </>
        )}
        {item.caption && <p className="muted mt-2 text-[13px]">{item.caption}</p>}
        {!item.text && (
          <p className="portfolio-print-only muted text-[12px]">(Voice note — listen in the online portfolio)</p>
        )}
      </>
    );
  }
  return (
    <>
      {item.text && (
        <p className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: "var(--body)" }}>
          {item.text}
        </p>
      )}
      {item.caption && <p className="muted mt-1 text-[13px]">{item.caption}</p>}
    </>
  );
}

const KIND_LABEL = (item: PortfolioItem) =>
  item.kind === "submission"
    ? "✍️ Writing"
    : item.type === "PHOTO"
      ? "📸 Photo"
      : item.type === "AUDIO"
        ? "🎙️ Voice note"
        : isStlItem(item)
          ? "🧊 3D model"
          : "📝 Note";

export default function PortfolioView({ data }: { data: PortfolioData }) {
  const { learner, module, orgName, complete, progress, projectSummary, sections, stats, finishedAt } = data;
  return (
    <div className="portfolio">
      {/* Cover */}
      <header
        className="card overflow-hidden"
        style={complete ? { borderColor: "var(--accent-border)" } : undefined}
      >
        <div className="flex flex-wrap items-center gap-5 p-7">
          {learner.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={learner.photoUrl}
              alt={learner.displayName}
              className="h-24 w-24 rounded-2xl border border-[var(--border)] object-cover"
            />
          ) : (
            <span
              className="flex h-24 w-24 items-center justify-center rounded-2xl border border-[var(--border)] text-4xl font-semibold"
              style={{ background: "var(--tile)", color: "var(--accent)", fontFamily: "var(--font-grotesk)" }}
            >
              {learner.displayName.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="overline mb-1">{orgName} · Portfolio</div>
            <h1 className="text-4xl font-semibold tracking-tight">{learner.displayName}</h1>
            <p className="muted mt-1.5 text-sm">
              {module.title}
              {finishedAt && <> · {complete ? "" : "updated "}{DATE_FMT.format(finishedAt)}</>}
            </p>
          </div>
          {complete ? (
            <div
              className="flex items-center gap-3 rounded-xl border px-5 py-4"
              style={{ borderColor: "var(--accent-border)", background: "var(--accent-soft)" }}
            >
              <span className="text-4xl">{module.badgeIcon}</span>
              <div>
                <div className="text-base font-semibold" style={{ color: "var(--accent)" }}>
                  {module.badgeName}
                </div>
                <div className="mono-label text-[10px]">Badge earned</div>
              </div>
            </div>
          ) : (
            <div
              className="flex items-center gap-3 rounded-xl border px-5 py-4"
              style={{ borderColor: "var(--border)", background: "var(--tile)" }}
            >
              <span className="text-4xl">🛠️</span>
              <div>
                <div className="text-base font-semibold" style={{ color: "var(--info-text)" }}>
                  Work in progress
                </div>
                <div className="mono-label text-[10px]">
                  {progress.met} of {progress.required} steps done
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Stats strip */}
        <div
          className="flex flex-wrap gap-6 border-t px-7 py-4"
          style={{ borderColor: "var(--border-soft)", background: "var(--tile)" }}
        >
          {[
            { v: stats.photoCount, l: stats.photoCount === 1 ? "photo" : "photos" },
            { v: stats.audioCount, l: stats.audioCount === 1 ? "voice note" : "voice notes" },
            { v: stats.wordCount, l: "words written" },
          ].map((s) => (
            <div key={s.l} className="flex items-baseline gap-2">
              <span className="display text-xl font-semibold" style={{ color: "var(--accent)" }}>
                {s.v}
              </span>
              <span className="mono-label">{s.l}</span>
            </div>
          ))}
        </div>
        {projectSummary && (
          <div className="border-t px-7 py-4" style={{ borderColor: "var(--border-soft)" }}>
            <p className="muted text-sm leading-relaxed">{projectSummary}</p>
          </div>
        )}
      </header>

      {/* Work, grouped by tutorial step */}
      {sections.map((section, si) => (
        <section key={section.title} className="mt-9">
          <div className="flex items-baseline gap-3">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold"
              style={{ background: "var(--accent)", color: "var(--bg)", fontFamily: "var(--font-grotesk)" }}
            >
              {si + 1}
            </span>
            <h2 className="text-lg font-semibold">{section.title}</h2>
          </div>
          <div className="mt-4 flex flex-col gap-4 border-l pl-6" style={{ borderColor: "var(--border)" }}>
            {section.items.map((item) => (
              <div key={`${item.kind}-${item.id}`} className="portfolio-item card p-5">
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="mono-label">{KIND_LABEL(item)}</span>
                  <span className="mono-label">{TIME_FMT.format(item.createdAt)}</span>
                </div>
                <ItemBody item={item} />
              </div>
            ))}
          </div>
        </section>
      ))}
      {sections.length === 0 && <p className="muted mt-8 text-sm">Nothing captured yet.</p>}
    </div>
  );
}
