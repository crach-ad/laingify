// Render a stakeholder/funder session report as a self-contained HTML
// document — printable to PDF from any browser. Visual design matches the
// template agreed on in Claude Design (editorial report style: Spectral
// headlines, Public Sans body, IBM Plex Mono labels/meta). Branded per org
// where we have brand assets (IgniteHer); a neutral palette otherwise.

import type { SessionParticipant } from "@/lib/gemini";
import IGNITE_HER_LOGO_BASE64 from "@/lib/ignite-her-logo";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const STATUS_LABEL: Record<string, string> = {
  PRESENT: "Present",
  LATE: "Late",
  ABSENT: "Absent",
  EXCUSED: "Excused",
};

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
  .statsbar { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 32px; padding: 28px 0; border-bottom: 1px solid ${b.hairline}; }
  .stat b { display: block; font-family: 'Spectral', Georgia, serif; font-size: 42px; font-weight: 600; line-height: 1; margin-bottom: 4px; }
  section { margin-top: 34px; }
  .kicker { font-family: ui-monospace, 'IBM Plex Mono', Menlo, monospace; font-size: 12px; letter-spacing: .1em; text-transform: uppercase; margin-bottom: 14px; font-weight: 500; }
  .narrative { font-size: 16px; line-height: 1.68; color: ${b.inkBody}; white-space: pre-wrap; max-width: 660px; }
  .fallback-note { margin-top: 14px; font-size: 12.5px; font-style: italic; color: ${b.inkMuted}; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  th { text-align: left; font-family: ui-monospace, 'IBM Plex Mono', Menlo, monospace; font-size: 11px; letter-spacing: .06em; text-transform: uppercase; color: ${b.inkMuted}; font-weight: 500; padding: 0 12px 10px 0; border-bottom: 1.5px solid ${b.ink}; }
  td { padding: 14px 12px 14px 0; border-bottom: 1px solid ${b.hairline}; font-size: 13.5px; color: ${b.inkMuted}; vertical-align: top; }
  td.name { font-size: 14.5px; font-weight: 600; color: ${b.ink}; }
  td.quote { font-style: italic; }
  tr:last-child td { border-bottom: none; }
  .pill { display: inline-flex; align-items: center; gap: 6px; font-size: 13.5px; }
  .dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
  .foot { margin-top: 40px; padding-top: 28px; border-top: 1px solid ${b.hairline}; display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 8px; font-family: ui-monospace, 'IBM Plex Mono', Menlo, monospace; font-size: 12px; color: ${b.inkMuted}; }
  @media print {
    body { padding: 0; }
    .wrap { max-width: none; padding: 0; }
    table { break-inside: avoid; }
  }
`;
}

export type SessionReportData = {
  orgName: string;
  className: string;
  dateLabel: string;
  lessonDescription: string;
  narrative: string;
  aiUsed: boolean;
  preparedBy: string;
  totals: { present: number; badgesEarned: number; submissions: number };
  participants: SessionParticipant[];
};

function statusVisual(b: Branding, status: string | null): { color: string; text: string } {
  if (!status) return { color: b.inkMuted, text: "No record" };
  if (status === "PRESENT") return { color: b.accentA, text: "Present" };
  if (status === "LATE") return { color: b.accentB, text: "Late" };
  return { color: b.inkMuted, text: STATUS_LABEL[status] ?? status };
}

export function renderSessionReportHtml(data: SessionReportData): string {
  const b = brandingFor(data.orgName);

  const rows = data.participants
    .map((p) => {
      const status = statusVisual(b, p.attendanceStatus);
      return `<tr>
      <td class="name">${esc(p.displayName)}</td>
      <td><span class="pill" style="color:${status.color}"><span class="dot" style="background:${status.color}"></span>${esc(status.text)}</span></td>
      <td>${p.badgesToday.length ? esc(p.badgesToday.join(", ")) : "—"}</td>
      <td class="quote">${p.submissionExcerpts.length ? `"${esc(p.submissionExcerpts[0])}"` : "—"}</td>
    </tr>`;
    })
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
    <div class="stat"><b style="color:${b.accentB}">${data.totals.badgesEarned}</b><span class="label">Badge${data.totals.badgesEarned === 1 ? "" : "s"} Earned</span></div>
    <div class="stat"><b style="color:${b.accentA}">${data.totals.submissions}</b><span class="label">Submission${data.totals.submissions === 1 ? "" : "s"} Written</span></div>
  </div>

  <section>
    <div class="kicker" style="color:${b.accentB}">01 — Session Summary</div>
    <div class="narrative">${esc(data.narrative)}</div>
    ${!data.aiUsed ? `<p class="fallback-note">Generated from program data only — AI narrative assistance was unavailable for this report.</p>` : `<p class="fallback-note">Narrative drafted with AI assistance from program data.</p>`}
  </section>

  <section>
    <div class="kicker" style="color:${b.accentB}">02 — Participant Activity</div>
    <table>
      <colgroup><col style="width:20%"><col style="width:15%"><col style="width:24%"><col style="width:41%"></colgroup>
      <thead><tr><th>Participant</th><th>Attendance</th><th>Badges Earned</th><th>From Their Work</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
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
