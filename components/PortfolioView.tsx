// Shared portfolio renderer: a chronological timeline of everything a learner
// made in one module — photos, voice notes, written work, and feedback —
// crowned by the badge if the module is complete. Print-friendly (see the
// `.portfolio` rules in globals.css); "download" = print to PDF.

type TimelineItem = {
  id: string;
  kind: "evidence" | "submission";
  type?: string; // evidence: TEXT | AUDIO | PHOTO | FILE
  text?: string | null;
  url?: string | null;
  caption?: string | null;
  feedbackSummary?: string | null;
  createdAt: Date;
};

export type PortfolioData = {
  learner: { displayName: string; photoUrl: string | null };
  module: { title: string; summary: string; badgeName: string; badgeIcon: string };
  orgName: string;
  complete: boolean;
  projectSummary: string | null;
  items: TimelineItem[];
};

const TIME_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function ItemBody({ item }: { item: TimelineItem }) {
  if (item.kind === "submission") {
    return (
      <>
        <div className="mono-label mb-2">✍️ Written reflection</div>
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
        <div className="mono-label mb-2">📸 Photo</div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.url}
          alt={item.caption ?? "Work photo"}
          className="max-h-72 rounded-lg border border-[var(--border-soft)]"
        />
        {item.caption && <p className="muted mt-2 text-[13px]">{item.caption}</p>}
      </>
    );
  }
  if (item.type === "AUDIO") {
    return (
      <>
        <div className="mono-label mb-2">🎙️ Voice note</div>
        {item.url && <audio controls src={item.url} className="portfolio-audio w-full max-w-sm" />}
        {item.text && (
          <p className="muted mt-2 text-[13px] italic">Transcript: {item.text}</p>
        )}
        {item.caption && <p className="muted mt-1 text-[13px]">{item.caption}</p>}
        <p className="portfolio-print-only muted text-[12px]">
          (Audio recording — listen in the online portfolio)
        </p>
      </>
    );
  }
  return (
    <>
      <div className="mono-label mb-2">📝 Note</div>
      {item.text && (
        <p className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: "var(--body)" }}>
          {item.text}
        </p>
      )}
      {item.caption && <p className="muted mt-1 text-[13px]">{item.caption}</p>}
    </>
  );
}

export default function PortfolioView({ data }: { data: PortfolioData }) {
  const { learner, module, orgName, complete, projectSummary, items } = data;
  return (
    <div className="portfolio">
      {/* Cover */}
      <header className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-5 p-7">
          {learner.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={learner.photoUrl}
              alt={learner.displayName}
              className="h-20 w-20 rounded-2xl border border-[var(--border)] object-cover"
            />
          ) : (
            <span
              className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[var(--border)] text-3xl font-semibold"
              style={{ background: "var(--tile)", color: "var(--accent)", fontFamily: "var(--font-grotesk)" }}
            >
              {learner.displayName.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="overline mb-1">{orgName} · Portfolio</div>
            <h1 className="text-3xl font-semibold tracking-tight">{learner.displayName}</h1>
            <p className="muted mt-1 text-sm">{module.title}</p>
          </div>
          {complete && (
            <div
              className="flex items-center gap-3 rounded-xl border px-4 py-3"
              style={{ borderColor: "var(--accent-border)", background: "var(--accent-soft)" }}
            >
              <span className="text-3xl">{module.badgeIcon}</span>
              <div>
                <div className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
                  {module.badgeName}
                </div>
                <div className="mono-label text-[10px]">Badge earned</div>
              </div>
            </div>
          )}
        </div>
        {projectSummary && (
          <div className="border-t px-7 py-4" style={{ borderColor: "var(--border-soft)" }}>
            <p className="muted text-sm leading-relaxed">{projectSummary}</p>
          </div>
        )}
      </header>

      {/* Timeline */}
      <section className="mt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold">Timeline</h2>
          <span className="mono-label">
            {items.length} moment{items.length === 1 ? "" : "s"}
          </span>
        </div>
        <ol className="relative mt-5 flex flex-col gap-6 border-l pl-6" style={{ borderColor: "var(--border)" }}>
          {items.map((item) => (
            <li key={`${item.kind}-${item.id}`} className="portfolio-item relative">
              <span
                className="absolute -left-[30px] top-1.5 h-2.5 w-2.5 rounded-full"
                style={{ background: item.kind === "submission" ? "var(--accent)" : "var(--info)" }}
              />
              <div className="mono-label mb-2">{TIME_FMT.format(item.createdAt)}</div>
              <div className="card p-5">
                <ItemBody item={item} />
              </div>
            </li>
          ))}
          {items.length === 0 && <p className="muted text-sm">Nothing captured yet.</p>}
        </ol>
      </section>
    </div>
  );
}
