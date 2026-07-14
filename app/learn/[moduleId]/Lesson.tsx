"use client";

import { useRef, useState, type ReactNode } from "react";

type Block = { type: string; text?: string; url?: string };
// A step is a single teaching beat. A heading labels the beat that follows it
// rather than being its own step, so the lesson reads as a flow of cards.
type Step = { heading?: string; block: Block };

function buildSteps(blocks: Block[]): Step[] {
  const steps: Step[] = [];
  let pendingHeading: string | undefined;
  for (const b of blocks) {
    if (b.type === "heading") {
      pendingHeading = b.text;
      continue;
    }
    steps.push({ heading: pendingHeading, block: b });
    pendingHeading = undefined;
  }
  // A trailing heading with nothing after it still deserves a card.
  if (pendingHeading) steps.push({ heading: pendingHeading, block: { type: "text", text: "" } });
  return steps;
}

function BlockBody({ block }: { block: Block }) {
  if (block.type === "prompt")
    return (
      <div
        className="rounded-xl border-l-2 p-4"
        style={{ borderColor: "var(--accent)", background: "var(--accent-soft)" }}
      >
        <span className="overline">Your turn</span>
        <p className="mt-2 leading-relaxed">{block.text}</p>
      </div>
    );
  if (block.type === "video" && block.url)
    return <video controls src={block.url} className="w-full rounded-xl" />;
  return (
    <p className="leading-relaxed" style={{ color: "var(--body)" }}>
      {block.text}
    </p>
  );
}

// Steps through the instructional content one beat at a time, then reveals the
// activity (the workspace, passed as children). Returning learners — anyone with
// prior work — start with the activity already open.
export default function Lesson({
  blocks,
  startRevealed,
  children,
}: {
  blocks: Block[];
  startRevealed: boolean;
  children: ReactNode;
}) {
  const steps = buildSteps(blocks);
  const [step, setStep] = useState(0);
  const [revealed, setRevealed] = useState(startRevealed || steps.length === 0);
  const workspaceRef = useRef<HTMLDivElement>(null);

  const isLast = step >= steps.length - 1;

  function reveal() {
    setRevealed(true);
    requestAnimationFrame(() =>
      workspaceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }

  return (
    <div className="mt-6">
      {steps.length > 0 && (
        <section aria-label="Lesson" className="flex flex-col gap-4">
          {/* Progress */}
          <div className="flex items-center gap-3">
            <div className="flex flex-1 gap-1.5">
              {steps.map((_, i) => (
                <span
                  key={i}
                  className="h-1 flex-1 rounded-full transition-all duration-500"
                  style={{
                    background: i <= step ? "var(--accent)" : "rgba(255,255,255,0.1)",
                  }}
                />
              ))}
            </div>
            <span className="mono-label shrink-0 tabular-nums">
              {step + 1} / {steps.length}
            </span>
          </div>

          {/* Current beat */}
          <div className="card min-h-36 p-6">
            {steps[step].heading && (
              <h2 className="mb-3 text-xl font-semibold">{steps[step].heading}</h2>
            )}
            <BlockBody block={steps[step].block} />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="muted rounded-lg px-4 py-2 font-medium transition-colors enabled:hover:text-[var(--text)] disabled:opacity-40"
            >
              ← Back
            </button>

            {isLast ? (
              !revealed && (
                <button onClick={reveal} className="btn-primary h-11 px-6 text-sm">
                  Start the activity →
                </button>
              )
            ) : (
              <button
                onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
                className="btn-primary px-5 py-2.5 text-sm"
              >
                Next →
              </button>
            )}
          </div>

          {!revealed && !isLast && (
            <button
              onClick={reveal}
              className="muted self-center text-sm font-medium transition-colors hover:text-[var(--accent)]"
            >
              Skip to the activity
            </button>
          )}
        </section>
      )}

      {/* Activity — revealed when the learner reaches the end (or returns). */}
      <div ref={workspaceRef} className={revealed ? "scroll-mt-4" : "hidden"}>
        {children}
      </div>
    </div>
  );
}
