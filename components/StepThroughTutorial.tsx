"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { track } from "@/lib/track";

export default function StepThroughTutorial({ titles, children, preview = true, moduleId, initialStep = 0 }: { titles: string[]; children: ReactNode[]; preview?: boolean; moduleId?: string; initialStep?: number }) {
  const [step, setStep] = useState(Math.max(0, Math.min(initialStep, children.length - 1)));
  useEffect(() => {
    if (moduleId) track("step_view", moduleId, { step, mode: "diagrams" });
  }, [moduleId, step]);
  const root = useRef<HTMLElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const count = children.length;
  function go(next: number) {
    if (next < 0 || next >= count || next === step) return;
    setStep(next);
    root.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  const controls = <nav className="flex items-center justify-between gap-3" aria-label="Tutorial navigation">
    <button type="button" className="btn-ghost h-11 px-5" disabled={step === 0} onClick={() => go(step - 1)}>← Back</button>
    <span className="mono-label" aria-live="polite">Step {step + 1} of {count}</span>
    <button type="button" className="btn-primary h-11 px-5" disabled={step === count - 1} onClick={() => go(step + 1)}>Next →</button>
  </nav>;
  if (!count) return null;
  return <section ref={root} className="mt-8 scroll-mt-6" aria-label="Step-by-step tutorial">
    <div className="overline mb-3">Guided tutorial · swipe or use Next</div>
    {controls}
    <div className="mt-3 h-1 overflow-hidden rounded-full bg-[var(--border)]" role="progressbar" aria-label="Tutorial position" aria-valuemin={1} aria-valuemax={count} aria-valuenow={step + 1}>
      <div className="h-full bg-[var(--accent)] transition-all" style={{ width: `${((step + 1) / count) * 100}%` }} />
    </div>
    <div className="py-5" onTouchStart={event => {
      touch.current = null;
      const target = event.target as HTMLElement;
      if (target.closest("a,input,textarea,select,dialog")) return;
      const button = target.closest("button");
      if (button && !button.getAttribute("aria-label")?.startsWith("Enlarge assembly")) return;
      if (event.touches.length === 1) touch.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }} onTouchCancel={() => { touch.current = null; }} onTouchEnd={event => {
      const start = touch.current;
      touch.current = null;
      if (!start || !event.changedTouches.length) return;
      const dx = event.changedTouches[0].clientX - start.x;
      const dy = event.changedTouches[0].clientY - start.y;
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        event.preventDefault();
        go(step + (dx < 0 ? 1 : -1));
      }
    }}>
      <h2 className="mb-4 text-xl font-semibold" aria-live="polite">{titles[step]}</h2>
      <div key={step}>{children[step]}</div>
    </div>
    {controls}
    {step === count - 1 && <p className="muted mt-4 text-center text-sm">End of this lesson. Choose the next lesson from the class projects.</p>}
    {preview && <p className="muted mt-4 text-center text-xs">Teacher preview · browsing steps does not submit Rowan’s work.</p>}
  </section>;
}
