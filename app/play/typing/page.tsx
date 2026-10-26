import Link from "next/link";

export const metadata = {
  title: "Letter Leaper — free typing game",
  description: "Type your way through six terrains to the moon and stars. Free, no account needed.",
};

// Free-play resource: open to anyone, nothing saved, no sign-in. The game's
// public mode skips usernames, leaderboards, and score saving entirely — class
// play (with leaderboards) lives at /play/letter-leaper.
const GAME_SRC = "/games/letter-leaper/index.html?mode=public";

export default function TypingPage() {
  return (
    <main className="mx-auto w-full max-w-[1440px] flex-1 px-3 py-8 sm:px-6">
      <Link href="/" className="muted text-sm transition-colors hover:text-[var(--text)]">
        ← laingify
      </Link>
      <div className="mt-4 mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="overline mb-2">Typing practice · Free play</div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">Leap to the moon.</h1>
          <p className="muted mt-4 max-w-2xl text-sm leading-relaxed sm:text-base">
            Help Milo climb six terrains — 100 letter leaps to the moon, then 50 word leaps to the stars.
            Use your keyboard or tap the keys. No account needed.
          </p>
          <p className="muted mt-2 max-w-2xl text-xs">
            Guest play isn&apos;t saved anywhere. To save your practice to your learning record, join your class and play from your
            Keyboard Skills module.
          </p>
        </div>
        <a href={GAME_SRC} className="btn-ghost flex h-11 shrink-0 items-center px-5 text-sm">
          Open full page ↗
        </a>
      </div>
      <iframe
        src={GAME_SRC}
        title="Letter Leaper: Moonbound typing adventure"
        className="h-[1100px] w-full rounded-xl border border-[var(--border-soft)] sm:h-[980px]"
        allow="fullscreen"
      />
    </main>
  );
}
