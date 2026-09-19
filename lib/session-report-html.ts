// Render a stakeholder/funder session report as a self-contained HTML
// document — same "downloadable, printable to PDF" approach as
// lib/portfolio-html.ts, reusing its visual language for consistency.

import type { SessionParticipant } from "@/lib/gemini";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const STATUS_LABEL: Record<string, string> = {
  PRESENT: "Present",
  LATE: "Late",
  ABSENT: "Absent",
  EXCUSED: "Excused",
};

const CSS = `
  :root { color-scheme: dark; }
  * { box-sizing: border-box; margin: 0; }
  body { background: #0a0b0e; color: #e7e9ee; font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.55; padding: 32px 16px 64px; }
  .wrap { max-width: 720px; margin: 0 auto; }
  .cover { background: #101216; border: 1px solid rgba(255,255,255,.08); border-radius: 16px; padding: 28px; }
  .label { font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: #6b7280; font-family: ui-monospace, Menlo, monospace; }
  .overline { color: #b6f24d; }
  h1 { font-size: 30px; letter-spacing: -.01em; color: #f4f6f9; margin: 4px 0 2px; }
  .muted { color: #8a909b; font-size: 13px; }
  .statsbar { display: flex; flex-wrap: wrap; gap: 24px; padding: 16px 0 0; margin-top: 16px; border-top: 1px solid rgba(255,255,255,.06); }
  .stat b { color: #b6f24d; font-size: 19px; margin-right: 6px; }
  section { margin-top: 36px; }
  h2 { font-size: 19px; color: #f4f6f9; margin-bottom: 14px; }
  .narrative { background: #101216; border: 1px solid rgba(255,255,255,.08); border-left: 3px solid rgba(182,242,77,.4); border-radius: 14px; padding: 20px 22px; white-space: pre-wrap; font-size: 15px; color: #b4bac4; }
  .fallback-note { margin-top: 10px; font-size: 12px; color: #6b7280; font-style: italic; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,.06); vertical-align: top; }
  th { font-size: 11px; letter-spacing: .06em; text-transform: uppercase; color: #6b7280; font-weight: 600; }
  td.name { color: #f4f6f9; font-weight: 600; white-space: nowrap; }
  .pill { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 600; }
  .pill.present, .pill.late { background: rgba(182,242,77,.1); color: #b6f24d; }
  .pill.absent { background: rgba(240,90,90,.1); color: #f05a5a; }
  .pill.excused { background: rgba(110,168,255,.1); color: #8fbeff; }
  .pill.none { background: rgba(255,255,255,.06); color: #6b7280; }
  .badges { font-size: 13px; color: #b6f24d; }
  .quote { font-size: 13px; color: #8a909b; font-style: italic; }
  .foot { margin-top: 44px; text-align: center; }
  @media print {
    :root { color-scheme: light; }
    body { background: #fff; color: #1f1f1f; }
    .cover, .narrative { background: #fff; border-color: #ddd; break-inside: avoid; }
    h1, h2 { color: #141414; }
    .overline { color: #4a7c00; }
    .stat b { color: #4a7c00; }
    th, td { border-color: #ddd; }
    table { break-inside: avoid; }
  }
`;

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

function statusPill(status: string | null): string {
  const key = (status ?? "none").toLowerCase();
  const text = status ? STATUS_LABEL[status] ?? status : "No record";
  return `<span class="pill ${key}">${esc(text)}</span>`;
}

export function renderSessionReportHtml(data: SessionReportData): string {
  const rows = data.participants
    .map(
      (p) => `<tr>
      <td class="name">${esc(p.displayName)}</td>
      <td>${statusPill(p.attendanceStatus)}</td>
      <td class="badges">${p.badgesToday.length ? esc(p.badgesToday.join(", ")) : "—"}</td>
      <td class="quote">${p.submissionExcerpts.length ? `"${esc(p.submissionExcerpts[0])}"` : "—"}</td>
    </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(data.className)} — Session Report — ${esc(data.dateLabel)}</title>
<style>${CSS}</style>
</head>
<body>
<div class="wrap">
  <header class="cover">
    <div class="label overline">${esc(data.orgName)} · Program Activity Report</div>
    <h1>${esc(data.className)}</h1>
    <p class="muted">Session of ${esc(data.dateLabel)}</p>
    <div class="statsbar">
      <span class="stat"><b>${data.totals.present}</b><span class="label">present</span></span>
      <span class="stat"><b>${data.totals.badgesEarned}</b><span class="label">badge${data.totals.badgesEarned === 1 ? "" : "s"} earned</span></span>
      <span class="stat"><b>${data.totals.submissions}</b><span class="label">submission${data.totals.submissions === 1 ? "" : "s"} written</span></span>
    </div>
  </header>

  <section>
    <h2>Session summary</h2>
    <div class="narrative">${esc(data.narrative)}</div>
    ${!data.aiUsed ? `<p class="fallback-note">Generated from program data only — AI narrative assistance was unavailable for this report.</p>` : ""}
  </section>

  <section>
    <h2>Participant activity</h2>
    <table>
      <thead><tr><th>Participant</th><th>Attendance</th><th>Badges earned</th><th>From their work</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </section>

  <footer class="foot label">Prepared by ${esc(data.preparedBy)} · ${esc(data.orgName)}</footer>
</div>
</body>
</html>`;
}

export function sessionReportFilename(className: string, dateLabel: string): string {
  const clean = (s: string) => s.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "");
  return `${clean(className)}-session-report-${clean(dateLabel)}.html`;
}
