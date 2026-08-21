"use client";

// Headline rendered as a field of canvas particles sampled from rasterized
// text, with cursor repulsion + spring-back. The text itself is never drawn —
// every visible dot is a particle homing toward a pixel of the sampled type.
//
// Physics per frame: cursor within REPEL_RADIUS pushes particles away along
// the cursor→particle vector; a spring always pulls toward the target; when
// settled, a slow sine drift keeps the glyphs breathing.

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  tx: number;
  ty: number;
  vx: number;
  vy: number;
  r: number;
  opacity: number;
  phase: number;
};

const REPEL_RADIUS = 90;
const REPEL_STRENGTH = 7;
const SPRING = 0.055;
const FRICTION = 0.82;

// Accept "#rgb", "#rrggbb", "rgb(...)" or "rgba(...)" and return [r,g,b].
function parseColor(c: string): [number, number, number] {
  const hex = c.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)?.[1];
  if (hex) {
    const full = hex.length === 3 ? hex.split("").map((ch) => ch + ch).join("") : hex;
    return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
  }
  const m = c.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
  return [20, 23, 29];
}

export default function ParticleTitle({
  lines,
  fontSize,
  fontFamily = "'Instrument Serif', serif",
  color = "rgba(20,23,29,1)",
  height = 230,
}: {
  lines: string[];
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const [ir, ig, ib] = parseColor(color);
    let particles: Particle[] = [];
    let raf = 0;
    let disposed = false;
    const cursor = { x: -9999, y: -9999 };

    async function setup() {
      if (!canvas || !ctx) return;
      const w = canvas.clientWidth;
      const h = height;
      if (w === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const size = fontSize ?? Math.min(w * 0.086, 90);
      const font = `italic ${size}px ${fontFamily}`;
      try {
        await document.fonts.load(font);
      } catch {
        /* fall back to whatever rasterizes */
      }
      if (disposed) return;

      // Rasterize the text offscreen, then sample pixels into targets.
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const octx = off.getContext("2d")!;
      octx.font = font;
      octx.textAlign = "center";
      octx.textBaseline = "middle";
      octx.fillStyle = "#000";
      const lineHeight = size * 1.08;
      lines.forEach((line, i) => {
        const y = h / 2 + (i - (lines.length - 1) / 2) * lineHeight;
        octx.fillText(line, w / 2, y);
      });

      const data = octx.getImageData(0, 0, w, h).data;
      const stride = 2;
      const next: Particle[] = [];
      for (let y = 0; y < h; y += stride) {
        for (let x = 0; x < w; x += stride) {
          if (data[(y * w + x) * 4 + 3] > 100) {
            next.push({
              x: Math.random() * w,
              y: Math.random() < 0.5 ? -20 - Math.random() * 80 : h + 20 + Math.random() * 80,
              tx: x,
              ty: y,
              vx: 0,
              vy: 0,
              r: 0.85 + Math.random() * 1.05,
              opacity: 0,
              phase: Math.random() * Math.PI * 2,
            });
          }
        }
      }
      particles = next;
    }

    function frame() {
      if (disposed || !canvas || !ctx) return;
      const w = canvas.clientWidth;
      const h = height;
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        // Cursor repulsion.
        const dx = p.x - cursor.x;
        const dy = p.y - cursor.y;
        const dist = Math.hypot(dx, dy);
        if (dist < REPEL_RADIUS && dist > 0.0001) {
          const force = ((REPEL_RADIUS - dist) / REPEL_RADIUS) * REPEL_STRENGTH * 0.1;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }

        // Spring toward target, then friction.
        p.vx += (p.tx - p.x) * SPRING;
        p.vy += (p.ty - p.y) * SPRING;
        p.vx *= FRICTION;
        p.vy *= FRICTION;
        p.x += p.vx;
        p.y += p.vy;

        // Gentle idle drift once settled.
        if (Math.abs(p.x - p.tx) < 2 && Math.abs(p.y - p.ty) < 2) {
          p.x += Math.sin(p.phase) * 0.15;
          p.y += Math.cos(p.phase * 0.8) * 0.1;
          p.phase += 0.02;
        }

        p.opacity = Math.min(1, p.opacity + 0.022);

        // Soft glow near the cursor.
        if (dist < REPEL_RADIUS * 1.2) {
          const near = 1 - dist / (REPEL_RADIUS * 1.2);
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
          g.addColorStop(0, `rgba(${ir},${ig},${ib},${0.5 * near * p.opacity})`);
          g.addColorStop(1, `rgba(${ir},${ig},${ib},0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = `rgba(${ir},${ig},${ib},${p.opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      cursor.x = e.clientX - rect.left;
      cursor.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      cursor.x = -9999;
      cursor.y = -9999;
    };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);

    const ro = new ResizeObserver(() => void setup());
    ro.observe(canvas);

    void setup().then(() => {
      if (!disposed) raf = requestAnimationFrame(frame);
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      ro.disconnect();
    };
  }, [lines, fontSize, fontFamily, color, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height, cursor: "none", background: "transparent", display: "block" }}
      aria-label={lines.join(" ")}
      role="img"
    />
  );
}
