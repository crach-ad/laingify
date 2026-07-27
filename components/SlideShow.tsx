"use client";

import { useEffect, useState } from "react";

// Kid-friendly slide player for tutorial step walkthroughs. Auto-advances
// slowly; any manual control pauses it so learners can study a slide.
const AUTOPLAY_MS = 4000;

export default function SlideShow({ urls, caption }: { urls: string[]; caption?: string }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing || urls.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % urls.length), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [playing, urls.length]);

  function goTo(i: number) {
    setPlaying(false); // manual control = they want their own pace
    setIndex((i + urls.length) % urls.length);
  }

  return (
    <figure>
      <div className="relative overflow-hidden rounded-xl border border-[var(--border-soft)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={urls[index]} alt={caption ?? "Tutorial slide"} className="w-full" />
        {/* Preload the next slide so advancing is instant */}
        {urls.length > 1 && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={urls[(index + 1) % urls.length]} alt="" className="hidden" aria-hidden />
        )}
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            className="btn-ghost h-10 w-11 text-base"
            aria-label="Previous slide"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="btn-ghost h-10 w-11 text-sm"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? "⏸" : "▶"}
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            className="btn-ghost h-10 w-11 text-base"
            aria-label="Next slide"
          >
            ›
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {urls.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}`}
              className="h-2.5 w-2.5 rounded-full transition-colors"
              style={{ background: i === index ? "var(--accent)" : "rgba(255,255,255,0.18)" }}
            />
          ))}
        </div>

        <span className="mono-label shrink-0 tabular-nums">
          {index + 1} / {urls.length}
        </span>
      </div>

      {caption && <figcaption className="muted mt-2 text-[13px]">{caption}</figcaption>}
    </figure>
  );
}
