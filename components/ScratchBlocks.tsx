"use client";

import { useEffect, useRef } from "react";

// Renders Scratch block stacks as pixel-perfect SVG from scratchblocks text
// syntax (the same renderer the Scratch wiki uses) — accurate diagrams of the
// exact blocks a step asks for, no screenshots needed.
export default function ScratchBlocks({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    import("scratchblocks").then((mod) => {
      if (cancelled || !ref.current) return;
      const sb = mod.default;
      const doc = sb.parse(code, { languages: ["en"] });
      const svg = sb.render(doc, { style: "scratch3", scale: 0.85 });
      ref.current.replaceChildren(svg);
    });
    return () => {
      cancelled = true;
    };
  }, [code]);

  return (
    <div
      ref={ref}
      className="overflow-x-auto rounded-xl border border-[var(--border-soft)] p-4"
      style={{ background: "#ffffff" }}
    />
  );
}
