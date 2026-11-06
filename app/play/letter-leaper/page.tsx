import Link from "next/link";
import { notFound } from "next/navigation";
import { requireLearner } from "@/lib/learner";
import { getSession } from "@/lib/session";
import { practiceContext } from "@/lib/typing-access";
import { letterLeaperPlay } from "@/lib/letter-leaper-play";

export const metadata = {
  title: "Letter Leaper — Moonbound | laingify",
  description: "Practice typing through six terrains, from the jungle to the moon and stars.",
};

// Class play opens directly into the game with its assigned settings and tracking.
export default async function LetterLeaperPage() {
  await requireLearner();
  const ctx = await practiceContext(await getSession());
  if (!ctx) notFound();
  const { src } = await letterLeaperPlay(ctx);

  return (
    <main className="mx-auto w-full max-w-[1440px] flex-1 px-3 py-4 sm:px-6">
      <Link href={`/learn/${ctx.moduleId}`} className="muted text-sm">
        ← Back to your Letter Leaper module
      </Link>

      <iframe
        id="game"
        src={src}
        title="Letter Leaper: Moonbound typing adventure"
        className="mt-4 h-[1100px] w-full scroll-mt-4 rounded-xl border border-[var(--border-soft)] sm:h-[980px]"
        allow="fullscreen"
      />
    </main>
  );
}
