import Link from "next/link";
import BlocklyMaze from "./BlocklyMaze";

export const metadata = {
  title: "Blockly Maze — free block coding game",
  description: "Program a robot through a maze with code blocks. Free, no account needed.",
};

// Free-play resource: open to anyone, nothing saved, no sign-in.
export default function BlocksPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
      <Link href="/" className="muted text-sm transition-colors hover:text-[var(--text)]">
        ← laingify
      </Link>
      <div className="mt-4 mb-6">
        <div className="overline mb-2">Free play · no account needed</div>
        <h1 className="text-3xl font-semibold tracking-tight">🧩 Blockly Maze</h1>
        <p className="muted mt-1.5 max-w-2xl text-sm">
          Drag blocks, snap them into a stack, press Run — and drive the robot to the star.
          This is the same block coding idea behind Scratch and the micro:bit.
        </p>
      </div>
      <BlocklyMaze />
      <p className="mono-label mt-8">
        Built with Blockly — the open-source block editor from Google &amp; the Raspberry Pi Foundation (Apache 2.0).
      </p>
    </main>
  );
}
