import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { MAX_BATCH_BYTES, parseBatch } from "@/lib/typing-events";
import { practiceContext, readTicket } from "@/lib/typing-access";
import { ingestBatch } from "@/lib/typing-ingest";

// Letter Leaper upload endpoint (contract: docs/letter-leaper-progress.md).
// Every response carries a `code` the game's tracker acts on:
//   ok            — stored (or already stored); drop from the local queue
//   other-learner — the ticket belongs to a different sign-in; keep it queued
//                   for its own learner, never re-attribute it
//   signed-out    — keep queued until this learner signs back in
//   rejected      — invalid or not allowed; drop it (retrying can't succeed)
const json = (status: number, code: string, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ code, ...extra }, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(req: Request) {
  if (req.headers.get("origin") !== new URL(req.url).origin) return json(403, "rejected", { error: "Cross-site upload." });
  const text = await req.text();
  if (text.length > MAX_BATCH_BYTES) return json(413, "rejected", { error: "Batch too large." });
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return json(400, "rejected", { error: "Invalid JSON." });
  }
  const parsed = parseBatch(raw);
  if (!parsed.ok) return json(400, "rejected", { error: parsed.error });

  const session = await getSession();
  if (!session) return json(401, "signed-out", { error: "Sign in to save your practice." });
  const ticket = readTicket(parsed.batch.ticket);
  if (!ticket) return json(400, "rejected", { error: "Invalid practice ticket." });
  // Identity comes from the signed cookie; the ticket only has to agree.
  if (ticket.l !== session.learnerId || ticket.c !== session.classId) {
    return json(409, "other-learner", { error: "This practice belongs to a different sign-in." });
  }
  const ctx = await practiceContext(session);
  if (!ctx || ctx.moduleId !== ticket.m) return json(403, "rejected", { error: "Letter Leaper isn't assigned to this class." });
  if (!ctx.verified) return json(403, "rejected", { error: "Sign in with your PIN to save practice." });

  try {
    const result = await ingestBatch(ctx, parsed.batch);
    if (!result.ok) return json(result.status, "rejected", { error: result.error });
    return json(200, "ok", { lastSeq: result.lastSeq, accepted: result.accepted, duplicates: result.duplicates });
  } catch (error) {
    console.error("Typing batch failed", error instanceof Error ? error.message : error);
    return json(503, "retry", { error: "Couldn't save right now." });
  }
}
