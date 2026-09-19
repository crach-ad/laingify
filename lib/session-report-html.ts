// Render a stakeholder/funder session report as a self-contained HTML
// document — printable to PDF from any browser. Visual design matches the
// template agreed on in Claude Design (editorial report style: Spectral
// headlines, Public Sans body, IBM Plex Mono labels/meta). Branded per org
// where we have brand assets (IgniteHer); a neutral palette otherwise.

import IGNITE_HER_LOGO_BASE64 from "@/lib/ignite-her-logo";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

type Branding = {
  logo?: { base64: string; mime: string }; // bare base64, no data: prefix
  paper: string;
  ink: string; // headlines, participant names
  inkBody: string; // narrative/body copy
  inkMuted: string; // mono labels, meta
  hairline: string; // rules/borders
  accentA: string; // primary accent (present dot, odd stat numbers, kicker 01)
  accentB: string; // secondary accent (late dot, even stat numbers, kicker 02)
};

const IGNITEHER_BRANDING: Branding = {
  logo: { base64: IGNITE_HER_LOGO_BASE64, mime: "image/jpeg" },
  paper: "#FFFFFF",
  ink: "#5E1029",
  inkBody: "#3A2430",
  inkMuted: "#7A5566",
  hairline: "#F0DCE4",
  accentA: "#E8125C",
  accentB: "#FA6F05",
};

const DEFAULT_BRANDING: Branding = {
  paper: "#FFFFFF",
  ink: "#22303C",
  inkBody: "#33414E",
  inkMuted: "#657485",
  hairline: "#E2E8EE",
  accentA: "#0F7A6E",
  accentB: "#B4600C",
};

function brandingFor(orgName: string): Branding {
  return orgName === "IgniteHer" ? IGNITEHER_BRANDING : DEFAULT_BRANDING;
}

const FONTS_LINK =
  "https://fonts.googleapis.com/css2?family=Spectral:wght@400;500;600;700&family=Public+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap";

function css(b: Branding): string {
  return `
  :root { color-scheme: light; }
  * { box-sizing: border-box; margin: 0; }
  body { background: ${b.paper}; color: ${b.inkBody}; font-family: 'Public Sans', -apple-system, 'Segoe UI', sans-serif; line-height: 1.55; padding: 40px 16px 64px; }
  .wrap { max-width: 816px; margin: 0 auto; background: ${b.paper}; padding: 24px 40px 40px; }
  .logo { width: 220px; height: auto; display: block; margin-bottom: 4px; }
  .label { font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: ${b.inkMuted}; font-family: ui-monospace, 'IBM Plex Mono', Menlo, monospace; }
  h1 { font-family: 'Spectral', Georgia, serif; font-size: 38px; font-weight: 600; letter-spacing: -.01em; color: ${b.ink}; margin: 0; }
  .muted { color: ${b.inkMuted}; font-size: 13px; }
  header.cover { padding-bottom: 28px; border-bottom: 1px solid ${b.hairline}; display: flex; flex-direction: column; gap: 16px; }
  .meta-row { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 12px; }
  .statsbar { display: flex; gap: 48px; padding: 28px 0; border-bottom: 1px solid ${b.hairline}; }
  .stat b { display: block; font-family: 'Spectral', Georgia, serif; font-size: 42px; font-weight: 600; line-height: 1; margin-bottom: 4px; }
  section { margin-top: 34px; }
  .kicker { font-family: ui-monospace, 'IBM Plex Mono', Menlo, monospace; font-size: 12px; letter-spacing: .1em; text-transform: uppercase; margin-bottom: 14px; font-weight: 500; }
  .narrative { font-size: 16px; line-height: 1.68; color: ${b.inkBody}; white-space: pre-wrap; max-width: 660px; }
  .fallback-note { margin-top: 14px; font-size: 12.5px; font-style: italic; color: ${b.inkMuted}; }
  .highlights { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 28px; }
  figure.highlight { margin: 0; break-inside: avoid; }
  figure.highlight img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 10px; border: 1px solid ${b.hairline}; display: block; background: ${b.hairline}; }
  figure.highlight figcaption { margin-top: 10px; }
  figure.highlight .quote { font-size: 14px; font-style: italic; line-height: 1.5; color: ${b.inkBody}; }
  figure.highlight .quote.empty { color: ${b.inkMuted}; }
  figure.highlight .name { margin-top: 6px; font-family: ui-monospace, 'IBM Plex Mono', Menlo, monospace; font-size: 12px; letter-spacing: .04em; color: ${b.inkMuted}; }
  .no-highlights { font-size: 14px; color: ${b.inkMuted}; font-style: italic; }
  .foot { margin-top: 40px; padding-top: 28px; border-top: 1px solid ${b.hairline}; display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 8px; font-family: ui-monospace, 'IBM Plex Mono', Menlo, monospace; font-size: 12px; color: ${b.inkMuted}; }
  .download-btn { position: fixed; top: 20px; right: 20px; display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 999px; border: none; background: ${b.ink}; color: ${b.paper}; font-family: 'Public Sans', -apple-system, sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,.18); }
  .download-btn:hover { opacity: .9; }
  @page { margin: 0.2in; }
  @media print {
    body { padding: 0; font-size: 13px; }
    /* Margin is baked into .wrap's own padding, not left to @page — @page
       margin support is inconsistent outside Chrome (Safari in particular),
       so this guarantees real whitespace regardless of what print engine
       renders it. */
    .wrap { max-width: 100%; width: 100%; margin: 0; padding: 0.3in; }
    .logo { width: 160px; }
    h1 { font-size: 28px; }
    header.cover { padding-bottom: 18px; gap: 10px; }
    .statsbar { gap: 32px; padding: 16px 0; }
    .stat b { font-size: 28px; margin-bottom: 2px; }
    section { margin-top: 18px; }
    .kicker { margin-bottom: 8px; }
    .narrative { font-size: 12.5px; line-height: 1.5; max-width: none; }
    .fallback-note { margin-top: 8px; }
    .highlights { gap: 14px; }
    figure.highlight img { aspect-ratio: 16 / 10; border-radius: 6px; }
    figure.highlight figcaption { margin-top: 6px; }
    figure.highlight .quote { font-size: 11px; line-height: 1.4; }
    figure.highlight .name { margin-top: 3px; font-size: 10px; }
    .foot { margin-top: 20px; padding-top: 14px; }
    .download-btn { display: none; }
  }
`;
}

export type SessionHighlight = {
  displayName: string;
  photoUrl: string; // stored evidence photo, typically a data: URL
  quote?: string;
};

export type SessionReportData = {
  orgName: string;
  className: string;
  dateLabel: string;
  lessonDescription: string;
  narrative: string;
  aiUsed: boolean;
  preparedBy: string;
  totals: { present: number; badgesEarned: number; submissions: number };
  highlights: SessionHighlight[];
};

export function renderSessionReportHtml(data: SessionReportData): string {
  const b = brandingFor(data.orgName);

  const highlightCards = data.highlights
    .map(
      (h) => `<figure class="highlight">
      <img src="${h.photoUrl}" alt="${esc(h.displayName)}'s work">
      <figcaption>
        <div class="quote${h.quote ? "" : " empty"}">${h.quote ? `"${esc(h.quote)}"` : "No written reflection captured."}</div>
        <div class="name">${esc(h.displayName)}</div>
      </figcaption>
    </figure>`,
    )
    .join("");

  const logoHtml = b.logo
    ? `<img class="logo" src="data:${b.logo.mime};base64,${b.logo.base64}" alt="${esc(data.orgName)}">`
    : `<div class="label" style="color:${b.accentA}">${esc(data.orgName)}</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(data.className)} — Session Report — ${esc(data.dateLabel)}</title>
<link rel="stylesheet" href="${FONTS_LINK}">
<style>${css(b)}</style>
</head>
<body>
<button class="download-btn" onclick="window.print()" type="button">⬇ Download PDF</button>
<div class="wrap">
  <header class="cover">
    ${logoHtml}
    <h1>Program Activity Report</h1>
    <div class="meta-row">
      <div style="font-size:16px; color:${b.inkMuted}">${esc(data.className)}</div>
      <div class="label">${esc(data.dateLabel)}</div>
    </div>
  </header>

  <div class="statsbar">
    <div class="stat"><b style="color:${b.accentA}">${data.totals.present}</b><span class="label">Present</span></div>
  </div>

  <section>
    <div class="kicker" style="color:${b.accentB}">01 — Session Summary</div>
    <div class="narrative">${esc(data.narrative)}</div>
    ${data.aiUsed ? `<p class="fallback-note">Narrative drafted with AI assistance from program data.</p>` : ""}
  </section>

  <section>
    <div class="kicker" style="color:${b.accentB}">02 — Session Highlights</div>
    ${
      data.highlights.length > 0
        ? `<div class="highlights">${highlightCards}</div>`
        : `<p class="no-highlights">No photos were captured for this session yet.</p>`
    }
  </section>

  <footer class="foot">
    <div>Prepared by ${esc(data.preparedBy)} · ${esc(data.orgName)}</div>
    <div>Generated ${new Date().toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}</div>
  </footer>
</div>
</body>
</html>`;
}

export function sessionReportFilename(className: string, dateLabel: string): string {
  const clean = (s: string) => s.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "");
  return `${clean(className)}-session-report-${clean(dateLabel)}.html`;
}
