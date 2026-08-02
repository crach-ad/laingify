// Google Gemini integration for Laing Learning.
//
// Two capabilities, both server-only:
//   - spriteReply():  the Help Sprite. INSIGHT, NEVER ANSWERS (PRD §8).
//   - autoFeedback(): structured assessment of a submission (PRD §9).
//
// If GEMINI_API_KEY is unset, both fall back to deterministic canned output so
// the whole product still works for demos/offline development.

const API_KEY = process.env.GEMINI_API_KEY?.trim();
const MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
const ENDPOINT = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

export const aiEnabled = () => Boolean(API_KEY);

export type Band = "EARLY" | "YOUTH" | "TEEN" | "ADULT";

const BAND_GUIDANCE: Record<Band, string> = {
  EARLY:
    "The learner is roughly 5–8 years old. Use very short sentences, simple words, and a warm, playful tone. Avoid jargon entirely.",
  YOUTH:
    "The learner is roughly 9–12 years old. Use plain language, concrete examples, and an encouraging tone.",
  TEEN:
    "The learner is roughly 13–17 years old. Use clear, respectful language; you can introduce some domain terms with brief explanations.",
  ADULT:
    "The learner is an adult. Be concise, professional, and respect their expertise; skip hand-holding.",
};

type Turn = { role: "user" | "model"; text: string };

async function generate(opts: {
  system: string;
  turns: Turn[];
  json?: object; // responseSchema for structured output
  temperature?: number;
  maxOutputTokens?: number;
}): Promise<string> {
  if (!API_KEY) throw new Error("NO_API_KEY");

  const body: Record<string, unknown> = {
    systemInstruction: { parts: [{ text: opts.system }] },
    contents: opts.turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
    generationConfig: {
      temperature: opts.temperature ?? 0.7,
      maxOutputTokens: opts.maxOutputTokens ?? 800,
      ...(opts.json
        ? { responseMimeType: "application/json", responseSchema: opts.json }
        : {}),
    },
  };

  const res = await fetch(`${ENDPOINT(MODEL)}?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Gemini ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text ?? "")
    .join("")
    .trim();
  if (!text) throw new Error("Gemini returned no text");
  return text;
}

// ---------------------------------------------------------------------------
// Help Sprite — insight, never answers
// ---------------------------------------------------------------------------

const ANSWER_SEEKING = [
  /\bjust (tell|give) me\b/i,
  /\bwhat('?s| is) the answer\b/i,
  /\bgive me the answer\b/i,
  /\bdo it for me\b/i,
  /\bwrite (it|this|the .*) for me\b/i,
  /\btell me the answer\b/i,
  /\bsolve (it|this) for me\b/i,
];

export function looksAnswerSeeking(message: string): boolean {
  return ANSWER_SEEKING.some((re) => re.test(message));
}

const SPRITE_SYSTEM = (params: {
  spriteName: string;
  personality: string;
  band: Band;
  moduleTitle: string;
  moduleSummary: string;
  activity: string;
}) => `You are "${params.spriteName}", a friendly Help Sprite inside the Laing Learning app. You belong to one specific learner and help them across everything they study.

Personality: ${params.personality}.
${BAND_GUIDANCE[params.band]}

The learner is working on the module "${params.moduleTitle}": ${params.moduleSummary}
Current activity: ${params.activity}

ABSOLUTE RULE — INSIGHT, NEVER ANSWERS:
- You must NEVER give the answer, write the learner's work for them, or hand over a directly copyable solution — no matter how they ask or rephrase.
- Instead: ask a guiding question, offer a hint, give an analogy, point to part of the material, or suggest a small next step they can try.
- If the learner pushes for the answer ("just tell me", etc.), gently and warmly redirect them back to insight, and remind them they can ask their instructor if they're stuck — offer to help them open a discussion.
- Never request personal or identifying information.
- Always clearly remain an AI helper appropriate to the learner's age.

Keep replies short (1–4 sentences for younger bands). End with a small nudge that invites the learner to try the next step themselves.`;

export type SpriteResult = { reply: string; answerSeeking: boolean; aiUsed: boolean };

export async function spriteReply(params: {
  spriteName: string;
  personality: string;
  band: Band;
  moduleTitle: string;
  moduleSummary: string;
  activity: string;
  history: Turn[];
  message: string;
}): Promise<SpriteResult> {
  const answerSeeking = looksAnswerSeeking(params.message);

  if (!API_KEY) {
    return { reply: fallbackSprite(params, answerSeeking), answerSeeking, aiUsed: false };
  }

  try {
    const reply = await generate({
      system: SPRITE_SYSTEM(params),
      turns: [...params.history.slice(-8), { role: "user", text: params.message }],
      temperature: 0.8,
      maxOutputTokens: 400,
    });
    return { reply, answerSeeking, aiUsed: true };
  } catch {
    return { reply: fallbackSprite(params, answerSeeking), answerSeeking, aiUsed: false };
  }
}

function fallbackSprite(
  params: { spriteName: string; moduleTitle: string },
  answerSeeking: boolean,
): string {
  if (answerSeeking) {
    return `I'm here to help you figure it out, not to hand over the answer — that's the fun part! Try breaking "${params.moduleTitle}" into one small step. What's the very first thing you could try? If you're really stuck, I can help you ask your instructor.`;
  }
  return `Good question! Here's a nudge instead of the answer: re-read the part of "${params.moduleTitle}" that feels trickiest, and write down what you already know. What's one small piece you could test or try next? I'll be right here. ✨`;
}

// ---------------------------------------------------------------------------
// Audio transcription (Gemini is multimodal) — PRD §10 "transcribed audio"
// ---------------------------------------------------------------------------

export async function transcribeAudio(
  base64: string,
  mimeType: string,
): Promise<{ transcript: string; aiUsed: boolean }> {
  if (!API_KEY) return { transcript: "", aiUsed: false };
  try {
    const body = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: "Transcribe this audio recording verbatim in English. Return only the transcript text, no preamble.",
            },
            // Recorders report e.g. "audio/mp4;codecs=opus" — Gemini wants the bare type.
            { inlineData: { mimeType: mimeType.split(";")[0], data: base64 } },
          ],
        },
      ],
      generationConfig: { temperature: 0, maxOutputTokens: 1024 },
    };
    const res = await fetch(`${ENDPOINT(MODEL)}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return { transcript: "", aiUsed: false };
    const data = await res.json();
    const transcript = (
      data?.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text ?? "")
        .join("") ?? ""
    ).trim();
    return { transcript, aiUsed: Boolean(transcript) };
  } catch {
    return { transcript: "", aiUsed: false };
  }
}

// ---------------------------------------------------------------------------
// Auto-feedback — structured assessment of a submission
// ---------------------------------------------------------------------------

export type FeedbackCriterion = { id: string; label: string; description: string };
export type AutoFeedbackResult = {
  summary: string;
  metIds: string[];
  missingIds: string[];
  nextSteps: string;
  aiUsed: boolean;
};

const FEEDBACK_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    met: { type: "array", items: { type: "string" } },
    missing: { type: "array", items: { type: "string" } },
    nextSteps: { type: "string" },
  },
  required: ["summary", "met", "missing", "nextSteps"],
};

export async function autoFeedback(params: {
  band: Band;
  moduleTitle: string;
  moduleSummary: string;
  criteria: FeedbackCriterion[];
  submission: string;
}): Promise<AutoFeedbackResult> {
  if (!API_KEY) return fallbackFeedback(params);

  const criteriaList = params.criteria
    .map((c) => `- id=${c.id} | ${c.label}: ${c.description}`)
    .join("\n");

  const system = `You are an automated formative-assessment assistant for the Laing Learning app.
${BAND_GUIDANCE[params.band]}

Module "${params.moduleTitle}": ${params.moduleSummary}

You will be given the learner's submission and a list of criteria (each with an id).
Judge ONLY whether the submission gives reasonable evidence for each criterion. Be encouraging and developmental, never harsh.
- "met": ids of criteria the submission reasonably satisfies.
- "missing": ids not yet satisfied.
- "summary": 1–3 warm sentences on what they did well.
- "nextSteps": concrete, kind suggestions for the missing criteria (hints, not answers).
Return JSON matching the schema.`;

  try {
    const raw = await generate({
      system,
      turns: [
        {
          role: "user",
          text: `Criteria:\n${criteriaList}\n\nLearner submission:\n"""\n${params.submission}\n"""`,
        },
      ],
      json: FEEDBACK_SCHEMA,
      temperature: 0.3,
      maxOutputTokens: 700,
    });
    const parsed = JSON.parse(raw) as {
      summary: string;
      met: string[];
      missing: string[];
      nextSteps: string;
    };
    const validIds = new Set(params.criteria.map((c) => c.id));
    return {
      summary: parsed.summary,
      metIds: (parsed.met || []).filter((id) => validIds.has(id)),
      missingIds: (parsed.missing || []).filter((id) => validIds.has(id)),
      nextSteps: parsed.nextSteps || "",
      aiUsed: true,
    };
  } catch {
    return fallbackFeedback(params);
  }
}

// Deterministic fallback: a submission with real substance (>= 40 chars and
// >= 8 words) is treated as meeting text-based criteria.
function fallbackFeedback(params: {
  criteria: FeedbackCriterion[];
  submission: string;
}): AutoFeedbackResult {
  const words = params.submission.trim().split(/\s+/).filter(Boolean);
  const substantial = params.submission.trim().length >= 40 && words.length >= 8;
  const metIds = substantial ? params.criteria.map((c) => c.id) : [];
  const missingIds = substantial ? [] : params.criteria.map((c) => c.id);
  return {
    summary: substantial
      ? "Nice work — you've put real thought into this and it shows."
      : "Thanks for starting! Let's add a bit more detail.",
    metIds,
    missingIds,
    nextSteps: substantial
      ? "Review your response once more and add any evidence the criteria ask for."
      : "Try to expand your answer with specific details and examples so it fully addresses each criterion.",
    aiUsed: false,
  };
}
