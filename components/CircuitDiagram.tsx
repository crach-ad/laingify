"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// Wiring diagram for circuit blocks: a breadboard with the Arduino below it,
// real part graphics (@wokwi/elements) plugged leg-into-hole, and jumper wires
// drawn between actual pin coordinates. Parts/wires appear step by step as the
// learner clicks through the build (visible set), with the newest additions
// highlighted — then the same diagram becomes the live simulator surface.
//
// Geometry is all in "natural units" (the elements' own pixel space) inside a
// wrapper scaled to the card width, so pin coordinates stay exact at any size.

export type DiagramPart = {
  id: string;
  kind: "led" | "pushbutton" | "resistor" | "tmp36";
  pin?: number;
  color?: string;
  label?: string;
  at?: string; // breadboard hole, e.g. "10a" (led anode / resistor end 1 / tmp36 middle leg)
  catAt?: string; // led cathode hole
  toAt?: string; // resistor end 2 hole
  cols?: [number, number]; // pushbutton columns straddling the center gap
};

export type DiagramWire = {
  id: string;
  from: string; // Arduino pin name: "8", "2", "GND.1", "5V", "A0", …
  to: string; // breadboard hole, e.g. "5a"
  color?: string;
};

// ---------------------------------------------------------------------------
// Fixed geometry (verified against @wokwi/elements 1.9.2 pinInfo tables)
// ---------------------------------------------------------------------------

const W = 380;
const H = 492;
// 44px of headroom above the breadboard so LED bodies and labels never clip.
const BB = { x: 20, y: 58, cols: 30, pitch: 10, inner: 12 };
const UNO = { x: 45, y: 262, w: 275, h: 202 };

// Arduino Uno pin name → coordinates in the element's own space.
const UNO_PINS: Record<string, { x: number; y: number }> = {
  "A5.2": { x: 87, y: 9 }, "A4.2": { x: 97, y: 9 }, AREF: { x: 106, y: 9 },
  "GND.1": { x: 116, y: 9 }, "13": { x: 125, y: 9 }, "12": { x: 135, y: 9 },
  "11": { x: 144, y: 9 }, "10": { x: 154, y: 9 }, "9": { x: 163, y: 9 },
  "8": { x: 173, y: 9 }, "7": { x: 189, y: 9 }, "6": { x: 199, y: 9 },
  "5": { x: 208, y: 9 }, "4": { x: 218, y: 9 }, "3": { x: 227, y: 9 },
  "2": { x: 237, y: 9 }, "1": { x: 246, y: 9 }, "0": { x: 256, y: 9 },
  IOREF: { x: 131, y: 192 }, RESET: { x: 141, y: 192 }, "3.3V": { x: 150, y: 192 },
  "5V": { x: 160, y: 192 }, "GND.2": { x: 170, y: 192 }, "GND.3": { x: 179, y: 192 },
  VIN: { x: 189, y: 192 }, A0: { x: 208, y: 192 }, A1: { x: 218, y: 192 },
  A2: { x: 227, y: 192 }, A3: { x: 237, y: 192 }, A4: { x: 246, y: 192 },
  A5: { x: 256, y: 192 },
};

const ROWS = "abcdefghij";

function holePos(ref: string): { x: number; y: number } {
  const m = /^(\d+)([a-j])$/.exec(ref);
  if (!m) return { x: 0, y: 0 };
  const col = Number(m[1]);
  const row = ROWS.indexOf(m[2]);
  const x = BB.x + BB.inner + (col - 1) * BB.pitch;
  const y =
    row < 5
      ? BB.y + 16 + row * BB.pitch // rows a–e (top block)
      : BB.y + 16 + 50 + 12 + (row - 5) * BB.pitch; // rows f–j (below the gap)
  return { x, y };
}

const boardPin = (name: string) => {
  const p = UNO_PINS[name] ?? { x: 0, y: 0 };
  return { x: UNO.x + p.x, y: UNO.y + p.y };
};

// Placement of each part: element top-left corner, plus its pins' absolute
// coordinates and the holes each pin's leg reaches into.
type Placed = {
  left: number;
  top: number;
  legs: { from: { x: number; y: number }; to: { x: number; y: number } }[];
  labelAt: { x: number; y: number };
  flip?: boolean;
};

function placePart(p: DiagramPart): Placed | null {
  if (p.kind === "led" && p.at && p.catAt) {
    const a = holePos(p.at);
    const c = holePos(p.catAt);
    const flip = a.x < c.x; // flip puts the anode leg on the left
    const mid = (a.x + c.x) / 2;
    const left = mid - 20; // pin midpoint is x=20 in the LED's 40×50 box
    const top = a.y - 42; // legs are at y=42
    const A = { x: left + (flip ? 15 : 25), y: a.y };
    const C = { x: left + (flip ? 25 : 15), y: a.y };
    return {
      left, top, flip,
      legs: [{ from: A, to: a }, { from: C, to: c }],
      labelAt: { x: mid, y: top - 4 },
    };
  }
  if (p.kind === "resistor" && p.at && p.toAt) {
    let h1 = holePos(p.at);
    let h2 = holePos(p.toAt);
    if (h1.x > h2.x) [h1, h2] = [h2, h1];
    const mid = (h1.x + h2.x) / 2;
    const left = mid - 29.4; // pins at x 0 / 58.8, y 5.65
    const top = h1.y - 5.65;
    return {
      left, top,
      legs: [
        { from: { x: left, y: h1.y }, to: h1 },
        { from: { x: left + 58.8, y: h1.y }, to: h2 },
      ],
      labelAt: { x: mid, y: top - 6 },
    };
  }
  if (p.kind === "pushbutton" && p.cols) {
    const [c1, c2] = p.cols;
    const e1 = holePos(`${c1}e`);
    const f1 = holePos(`${c1}f`);
    const e2 = holePos(`${c2}e`);
    const f2 = holePos(`${c2}f`);
    const cx = (e1.x + e2.x) / 2;
    const cy = (e1.y + f1.y) / 2; // straddle the center gap
    const left = cx - 33.5; // element is 67×45, pins at y 13 / 32
    const top = cy - 22.5;
    return {
      left, top,
      legs: [
        { from: { x: left, y: top + 13 }, to: e1 },
        { from: { x: left, y: top + 32 }, to: f1 },
        { from: { x: left + 67, y: top + 13 }, to: e2 },
        { from: { x: left + 67, y: top + 32 }, to: f2 },
      ],
      labelAt: { x: cx, y: top - 11 },
    };
  }
  if (p.kind === "tmp36" && p.at) {
    // Custom-drawn TO-92 sensor: three legs in adjacent columns, `at` = middle.
    const mid = holePos(p.at);
    const l = { x: mid.x - BB.pitch, y: mid.y };
    const r = { x: mid.x + BB.pitch, y: mid.y };
    return {
      left: mid.x - 14, top: mid.y - 30,
      legs: [
        { from: { x: mid.x - 8, y: mid.y - 6 }, to: l },
        { from: { x: mid.x, y: mid.y - 6 }, to: mid },
        { from: { x: mid.x + 8, y: mid.y - 6 }, to: r },
      ],
      labelAt: { x: mid.x, y: mid.y - 34 },
    };
  }
  return null;
}

// Jumper path from an Arduino pin to a breadboard hole. Top-edge pins arc
// straight up; bottom-edge pins (5V / A0 / GND.2…) sweep around the right side.
function wirePath(from: string, to: string): string {
  const a = boardPin(from);
  const b = holePos(to);
  if ((UNO_PINS[from]?.y ?? 9) < 100) {
    const lift = Math.max(36, (a.y - b.y) * 0.35);
    return `M ${a.x} ${a.y} C ${a.x} ${a.y - lift}, ${b.x} ${b.y + lift}, ${b.x} ${b.y}`;
  }
  const side = W - 14;
  return [
    `M ${a.x} ${a.y}`,
    `C ${a.x} ${a.y + 26}, ${side} ${a.y + 16}, ${side} ${a.y - 60}`,
    `L ${side} ${b.y + 90}`,
    `C ${side} ${b.y + 20}, ${b.x} ${b.y + 55}, ${b.x} ${b.y}`,
  ].join(" ");
}

// ---------------------------------------------------------------------------

function BreadboardSvg() {
  const width = BB.inner * 2 + (BB.cols - 1) * BB.pitch;
  const holes: React.ReactNode[] = [];
  for (let col = 1; col <= BB.cols; col++) {
    for (let row = 0; row < 10; row++) {
      const { x, y } = holePos(`${col}${ROWS[row]}`);
      holes.push(<rect key={`${col}-${row}`} x={x - 1.6} y={y - 1.6} width={3.2} height={3.2} rx={0.8} fill="#8a8f98" />);
    }
  }
  const labels = [1, 5, 10, 15, 20, 25, 30].map((col) => (
    <text key={col} x={holePos(`${col}a`).x} y={BB.y + 9} textAnchor="middle" fontSize={6.5} fill="#6b7280" fontFamily="ui-monospace, Menlo, monospace">
      {col}
    </text>
  ));
  return (
    <g>
      <rect x={BB.x} y={BB.y} width={width} height={142} rx={5} fill="#e9e7e1" stroke="#c8c5bd" strokeWidth={1} />
      <rect x={BB.x} y={BB.y + 66} width={width} height={10} fill="#dcd9d1" />
      {labels}
      {holes}
    </g>
  );
}

function Tmp36Svg({ x, y }: { x: number; y: number }) {
  // Simple TO-92 package: flat side facing the viewer, three legs down.
  return (
    <g>
      <line x1={x - 8} y1={y - 8} x2={x - 10} y2={y} stroke="#555" strokeWidth={1.6} />
      <line x1={x} y1={y - 8} x2={x} y2={y} stroke="#555" strokeWidth={1.6} />
      <line x1={x + 8} y1={y - 8} x2={x + 10} y2={y} stroke="#555" strokeWidth={1.6} />
      <path d={`M ${x - 13} ${y - 8} h 26 v -10 a 13 13 0 0 0 -26 0 z`} fill="#2b2b2b" stroke="#111" />
      <text x={x} y={y - 13} textAnchor="middle" fontSize={5.5} fill="#bbb" fontFamily="ui-monospace, Menlo, monospace">
        TMP36
      </text>
    </g>
  );
}

export default function CircuitDiagram({
  parts,
  wires,
  visible,
  highlight,
  onElement,
}: {
  parts: DiagramPart[];
  wires: DiagramWire[];
  visible: Set<string> | null; // null = show everything
  highlight: string[];
  onElement: (id: string, el: HTMLElement) => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const partsHostRef = useRef<HTMLDivElement>(null);
  const wrappersRef = useRef(new Map<string, HTMLElement>());
  const [ready, setReady] = useState(false);
  const [scale, setScale] = useState(1.4);

  const placed = useMemo(() => {
    const map = new Map<string, Placed>();
    for (const p of parts) {
      const pl = placePart(p);
      if (pl) map.set(p.id, pl);
    }
    return map;
  }, [parts]);

  const isVisible = (id: string) => !visible || visible.has(id);

  // Fit the natural-units canvas to the card width.
  useEffect(() => {
    const measure = () => {
      const w = canvasRef.current?.parentElement?.clientWidth ?? W;
      setScale(Math.min(Math.max(w / W, 0.8), 1.5));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Create the wokwi web components once.
  useEffect(() => {
    let cancelled = false;
    import("@wokwi/elements").then(() => {
      if (cancelled || !partsHostRef.current) return;
      const host = partsHostRef.current;
      host.replaceChildren();
      wrappersRef.current.clear();

      const board = document.createElement("wokwi-arduino-uno");
      const boardWrap = document.createElement("div");
      boardWrap.style.cssText = `position:absolute;left:${UNO.x}px;top:${UNO.y}px;`;
      boardWrap.appendChild(board);
      host.appendChild(boardWrap);
      onElement("board", board);

      for (const p of parts) {
        const pl = placed.get(p.id);
        if (!pl) continue;
        let el: HTMLElement | null = null;
        if (p.kind === "led") {
          el = document.createElement("wokwi-led");
          (el as HTMLElement & { color?: string; flip?: boolean }).color = p.color ?? "red";
          if (pl.flip) el.setAttribute("flip", "");
        } else if (p.kind === "resistor") {
          el = document.createElement("wokwi-resistor");
          el.setAttribute("value", "220");
        } else if (p.kind === "pushbutton") {
          el = document.createElement("wokwi-pushbutton");
          (el as HTMLElement & { color?: string }).color = p.color ?? "green";
        }
        if (!el) continue; // tmp36 is drawn in the SVG layer
        const wrap = document.createElement("div");
        wrap.style.cssText = `position:absolute;left:${pl.left}px;top:${pl.top}px;`;
        wrap.appendChild(el);
        host.appendChild(wrap);
        wrappersRef.current.set(p.id, wrap);
        onElement(p.id, el);
      }
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
    // Parts come from module content JSON — stable for the life of the block.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show/hide part elements as the build progresses.
  useEffect(() => {
    for (const [id, wrap] of wrappersRef.current) {
      wrap.style.display = isVisible(id) ? "" : "none";
      wrap.style.filter = highlight.includes(id) ? "drop-shadow(0 0 6px rgba(163,230,53,0.9))" : "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, highlight, ready]);

  return (
    <div className="flex justify-center overflow-x-auto">
      <div ref={canvasRef} style={{ width: W * scale, height: H * scale }}>
        <div
          style={{ position: "relative", width: W, height: H, transform: `scale(${scale})`, transformOrigin: "0 0" }}
        >
          {/* base layer: breadboard, part legs, drawn parts, labels */}
          <svg
            width={W}
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
          >
            <BreadboardSvg />
            {parts.filter((p) => isVisible(p.id)).map((p) => {
              const pl = placed.get(p.id);
              if (!pl) return null;
              return (
                <g key={p.id}>
                  {pl.legs.map((leg, i) => (
                    <line key={i} x1={leg.from.x} y1={leg.from.y} x2={leg.to.x} y2={leg.to.y} stroke="#9aa1ab" strokeWidth={1.4} />
                  ))}
                  {p.kind === "tmp36" && <Tmp36Svg x={holePos(p.at!).x} y={holePos(p.at!).y - 2} />}
                </g>
              );
            })}
          </svg>
          <div ref={partsHostRef} style={{ position: "absolute", inset: 0 }} />
          {/* wire layer: above the board and parts, like real jumpers lying on top */}
          <svg
            width={W}
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
          >
            {wires.filter((w) => isVisible(w.id)).map((w) => {
              const d = wirePath(w.from, w.to);
              const hot = highlight.includes(w.id);
              return (
                <g key={w.id}>
                  <path d={d} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={4.4} strokeLinecap="round" />
                  <path d={d} fill="none" stroke={w.color ?? "#3b82f6"} strokeWidth={2.6} strokeLinecap="round">
                    {hot && (
                      <animate attributeName="stroke-opacity" values="1;0.35;1" dur="1.1s" repeatCount="3" />
                    )}
                  </path>
                </g>
              );
            })}
            {/* part labels: topmost so they never hide behind a part graphic */}
            {parts.filter((p) => isVisible(p.id) && p.label).map((p) => {
              const pl = placed.get(p.id);
              if (!pl) return null;
              return (
                <text key={p.id} x={pl.labelAt.x} y={pl.labelAt.y} textAnchor="middle" fontSize={7} fill="#8b93a1" fontFamily="ui-monospace, Menlo, monospace">
                  {p.label}
                </text>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
