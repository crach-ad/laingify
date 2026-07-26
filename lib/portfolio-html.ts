// Render a portfolio as a fully self-contained HTML document (all media are
// data URLs, all styles inline) — downloadable, openable offline anywhere,
// and printable to PDF from any browser.

import type { PortfolioData, PortfolioItem } from "@/components/PortfolioView";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const DATE_FMT = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" });
const TIME_FMT = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

function itemHtml(item: PortfolioItem): string {
  const kind =
    item.kind === "submission" ? "✍️ Writing" : item.type === "PHOTO" ? "📸 Photo" : item.type === "AUDIO" ? "🎙️ Voice note" : "📝 Note";
  let body = "";
  if (item.kind === "submission") {
    body = `<p class="text">${esc(item.text ?? "")}</p>`;
    if (item.feedbackSummary) body += `<p class="feedback">Feedback: ${esc(item.feedbackSummary)}</p>`;
  } else if (item.type === "PHOTO" && item.url) {
    body = `<img src="${item.url}" alt="${esc(item.caption ?? "Work photo")}" />`;
    if (item.caption) body += `<p class="muted">${esc(item.caption)}</p>`;
  } else if (item.type === "AUDIO") {
    body = item.url ? `<audio controls src="${item.url}"></audio>` : "";
    if (item.text) body += `<p class="muted"><em>Transcript: ${esc(item.text)}</em></p>`;
  } else {
    body = item.text ? `<p class="text">${esc(item.text)}</p>` : "";
    if (item.caption) body += `<p class="muted">${esc(item.caption)}</p>`;
  }
  return `<div class="item"><div class="item-head"><span>${kind}</span><span>${TIME_FMT.format(item.createdAt)}</span></div>${body}</div>`;
}

export function renderPortfolioHtml(data: PortfolioData): string {
  const { learner, module, orgName, complete, projectSummary, sections, stats, finishedAt } = data;
  const avatar = learner.photoUrl
    ? `<img class="avatar" src="${learner.photoUrl}" alt="${esc(learner.displayName)}" />`
    : `<div class="avatar initial">${esc(learner.displayName.charAt(0).toUpperCase())}</div>`;
  const badge = complete
    ? `<div class="badge"><span class="badge-icon">${module.badgeIcon}</span><div><div class="badge-name">${esc(module.badgeName)}</div><div class="label">Badge earned</div></div></div>`
    : "";
  const sectionsHtml = sections
    .map(
      (s, i) =>
        `<section><h2><span class="num">${i + 1}</span>${esc(s.title)}</h2>${s.items.map(itemHtml).join("")}</section>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(learner.displayName)} — ${esc(module.title)} — Portfolio</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; margin: 0; }
  body { background: #0a0b0e; color: #e7e9ee; font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.55; padding: 32px 16px 64px; }
  .wrap { max-width: 720px; margin: 0 auto; }
  .cover { background: #101216; border: 1px solid ${complete ? "rgba(182,242,77,.28)" : "rgba(255,255,255,.08)"}; border-radius: 16px; overflow: hidden; }
  .cover-main { display: flex; flex-wrap: wrap; align-items: center; gap: 20px; padding: 28px; }
  .avatar { width: 96px; height: 96px; border-radius: 16px; object-fit: cover; border: 1px solid rgba(255,255,255,.1); }
  .initial { display: flex; align-items: center; justify-content: center; font-size: 40px; font-weight: 700; color: #b6f24d; background: #181b21; }
  .who { flex: 1; min-width: 200px; }
  .label { font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: #6b7280; font-family: ui-monospace, Menlo, monospace; }
  .overline { color: #b6f24d; }
  h1 { font-size: 34px; letter-spacing: -.01em; color: #f4f6f9; margin: 4px 0 2px; }
  .muted { color: #8a909b; font-size: 13px; }
  .badge { display: flex; align-items: center; gap: 12px; background: rgba(182,242,77,.1); border: 1px solid rgba(182,242,77,.25); border-radius: 12px; padding: 14px 18px; }
  .badge-icon { font-size: 34px; }
  .badge-name { color: #b6f24d; font-weight: 700; }
  .statsbar { display: flex; flex-wrap: wrap; gap: 24px; padding: 14px 28px; background: #181b21; border-top: 1px solid rgba(255,255,255,.06); }
  .stat b { color: #b6f24d; font-size: 19px; margin-right: 6px; }
  .summary { padding: 14px 28px; border-top: 1px solid rgba(255,255,255,.06); color: #8a909b; font-size: 14px; }
  section { margin-top: 36px; }
  h2 { display: flex; align-items: center; gap: 10px; font-size: 19px; color: #f4f6f9; margin-bottom: 14px; }
  .num { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 50%; background: #b6f24d; color: #0a0b0e; font-size: 14px; }
  .item { background: #101216; border: 1px solid rgba(255,255,255,.08); border-radius: 14px; padding: 18px 20px; margin: 0 0 14px 12px; border-left: 3px solid rgba(182,242,77,.4); }
  .item-head { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: #6b7280; font-family: ui-monospace, Menlo, monospace; }
  .item img { max-width: 100%; max-height: 420px; border-radius: 10px; border: 1px solid rgba(255,255,255,.06); }
  .item audio { width: 100%; max-width: 380px; }
  .text { white-space: pre-wrap; font-size: 15px; color: #b4bac4; }
  .feedback { margin-top: 10px; padding-left: 12px; border-left: 2px solid rgba(182,242,77,.25); color: #8a909b; font-size: 13px; font-style: italic; }
  .foot { margin-top: 44px; text-align: center; }
  @media print {
    :root { color-scheme: light; }
    body { background: #fff; color: #1f1f1f; }
    .cover, .item { background: #fff; border-color: #ddd; break-inside: avoid; }
    h1, h2 { color: #141414; }
    .badge { background: #f3f8e8; }
    .badge-name, .stat b, .overline { color: #4a7c00; }
    .statsbar { background: #f4f4f1; }
    audio { display: none; }
  }
</style>
</head>
<body>
<div class="wrap">
  <header class="cover">
    <div class="cover-main">
      ${avatar}
      <div class="who">
        <div class="label overline">${esc(orgName)} · Portfolio</div>
        <h1>${esc(learner.displayName)}</h1>
        <p class="muted">${esc(module.title)}${finishedAt ? ` · ${DATE_FMT.format(finishedAt)}` : ""}</p>
      </div>
      ${badge}
    </div>
    <div class="statsbar">
      <span class="stat"><b>${stats.photoCount}</b><span class="label">${stats.photoCount === 1 ? "photo" : "photos"}</span></span>
      <span class="stat"><b>${stats.audioCount}</b><span class="label">${stats.audioCount === 1 ? "voice note" : "voice notes"}</span></span>
      <span class="stat"><b>${stats.wordCount}</b><span class="label">words written</span></span>
    </div>
    ${projectSummary ? `<div class="summary">${esc(projectSummary)}</div>` : ""}
  </header>
  ${sectionsHtml}
  <footer class="foot label">Made at ${esc(orgName)} · ${esc(module.title)}</footer>
</div>
</body>
</html>`;
}

export function portfolioFilename(data: PortfolioData): string {
  const clean = (s: string) => s.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "");
  return `${clean(data.learner.displayName)}-${clean(data.module.title)}-portfolio.html`;
}
