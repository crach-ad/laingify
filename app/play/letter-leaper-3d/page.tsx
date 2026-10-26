import Link from "next/link";

export const metadata = {
  title: "Letter Leaper — falling platforms (local preview)",
  robots: { index: false, follow: false },
};

// Local preview of the falling-platform rules (7 seconds per letter; wrong
// letters and the deadline make Milo fall and retry the same leap). Public
// play only: nothing is saved and no class data is involved.
const GAME_SRC = "/games/letter-leaper/index.html?mode=public&falls=1";

export default function LetterLeaperFallsPreview() {
  return (
    <main className="mx-auto w-full max-w-[1440px] flex-1 px-3 py-8 sm:px-6">
      <Link href="/play/typing" className="muted text-sm transition-colors hover:text-[var(--text)]">
        ← Letter Leaper
      </Link>
      <div className="mt-4 mb-6">
        <div className="overline mb-2">Local preview · not saved</div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Falling platforms</h1>
        <p className="muted mt-3 max-w-2xl text-sm leading-relaxed">
          You have seven seconds for each letter. After five seconds the platform starts to wobble, and at seven it
          falls. A wrong letter makes Milo fall short. Either way he comes straight back to try the same leap again —
          you never lose progress.
        </p>
      </div>
      <iframe
        src={GAME_SRC}
        title="Letter Leaper with falling platforms (preview)"
        className="h-[1100px] w-full rounded-xl border border-[var(--border-soft)] sm:h-[980px]"
        allow="fullscreen"
      />
    </main>
  );
}
