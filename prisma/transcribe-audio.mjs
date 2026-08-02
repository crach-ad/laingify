// Backfill transcripts for stored voice notes that don't have one yet, so
// they're readable in portfolios. Uses Gemini (multimodal) — requires a real
// GEMINI_API_KEY in .env. Safe to re-run: only touches AUDIO evidence whose
// text is empty, and never modifies the audio itself.
//   node prisma/transcribe-audio.mjs

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const KEY = process.env.GEMINI_API_KEY?.trim();
const MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
if (!KEY) {
  console.error("GEMINI_API_KEY is not set — add a real key to .env first.");
  process.exit(1);
}

const rows = await prisma.evidence.findMany({
  where: { type: "AUDIO", OR: [{ text: null }, { text: "" }] },
  orderBy: { createdAt: "asc" },
});
console.log(`${rows.length} voice note(s) without a transcript`);

let filled = 0;
for (const e of rows) {
  const m = e.url?.match(/^data:([^;,]+)[^,]*,(.+)$/);
  if (!m) {
    console.log(`- ${e.id}: no inline audio data, skipped`);
    continue;
  }
  const [, mimeType, base64] = m;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: "Transcribe this audio recording verbatim in English. Return only the transcript text, no preamble.",
              },
              { inlineData: { mimeType, data: base64 } },
            ],
          },
        ],
        generationConfig: { temperature: 0, maxOutputTokens: 1024 },
      }),
    },
  );
  if (!res.ok) {
    console.log(`- ${e.id}: Gemini ${res.status}, skipped`);
    continue;
  }
  const data = await res.json();
  const transcript = (
    data?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? ""
  ).trim();
  if (!transcript) {
    console.log(`- ${e.id}: empty transcript, skipped`);
    continue;
  }
  await prisma.evidence.update({ where: { id: e.id }, data: { text: transcript } });
  filled++;
  console.log(`- ${e.id}: "${transcript.slice(0, 70)}${transcript.length > 70 ? "…" : ""}"`);
}

console.log(`Done — ${filled}/${rows.length} transcribed.`);
await prisma.$disconnect();
