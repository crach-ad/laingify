import { NextResponse } from "next/server";
import { requireLearner } from "@/lib/learner";
import { getSession } from "@/lib/session";
import { practiceContext } from "@/lib/typing-access";
import { letterLeaperPlay } from "@/lib/letter-leaper-play";

// The dashboard header's Letter Leaper button: straight into the game, full
// page, with the same class settings and tracking as /play/letter-leaper.
export async function GET(request: Request) {
  await requireLearner();
  const ctx = await practiceContext(await getSession());
  if (!ctx) return NextResponse.redirect(new URL("/learn", request.url));
  const { src } = await letterLeaperPlay(ctx);
  return NextResponse.redirect(new URL(src, request.url));
}
