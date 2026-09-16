"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

// In-page micro:bit simulator for authored tutorial projects. Unlike a real
// code editor, each project runs exactly one canned, authored behavior — the
// same "one fixed program per block" model the Arduino circuit blocks use
// (a precompiled hex, not a live interpreter). There's no CPU to emulate here
// either: the board's onboard LED matrix, buttons, and temperature sensor are
// simple enough to drive directly from a small state machine.
//
// A wiring diagram (edge-connector pin → resistor → LED → GND) assembles step
// by step for projects that need external parts, exactly like CircuitDiagram —
// just simpler geometry, since there's no breadboard.

export type MicrobitPart = {
  id: string;
  pin: "P0" | "P1" | "P2";
  color?: string; // LED color, default red
  label?: string;
};

export type MicrobitBuildStep = { text: string; add: string[] };

export type MicrobitProgram =
  | { kind: "matrix-blink"; cells: [number, number][]; onMs: number; offMs: number }
  | { kind: "matrix-sequence"; frames: [number, number][][]; ms: number }
  | { kind: "pin-blink"; pin: "P0" | "P1" | "P2"; onMs: number; offMs: number }
  | { kind: "pin-cycle"; steps: { pin: "P0" | "P1" | "P2"; ms: number }[] }
  | { kind: "button-hold-matrix"; button: "A" | "B"; cells: [number, number][] }
  | { kind: "button-toggle-matrix"; button: "A" | "B"; cells: [number, number][] }
  | { kind: "temperature-log" }
  | { kind: "temperature-alarm"; thresholdC: number };

const PIN_X: Record<"P0" | "P1" | "P2", number> = { P0: 150, P1: 190, P2: 230 };
const GND_X = 70;
const V3_X = 110;
const PAD_Y = 176;
const BOARD = { x: 30, y: 10, w: 260, h: 180 };
const MATRIX = { x: BOARD.x + 89, y: BOARD.y + 16, cell: 9, pitch: 18 };
const BTN_A = { x: BOARD.x + 25, y: BOARD.y + 95, r: 13 };
const BTN_B = { x: BOARD.x + 235, y: BOARD.y + 95, r: 13 };

function cellKey(r: number, c: number) {
  return `${r},${c}`;
}

function Pad({ x, label, hot }: { x: number; label: string; hot?: boolean }) {
  return (
    <g>
      <rect x={x - 8} y={PAD_Y} width={16} height={10} rx={2} fill={hot ? "#facc15" : "#c8c5bd"} stroke="#8a8f98" strokeWidth={0.6} />
      <text x={x} y={PAD_Y + 22} textAnchor="middle" fontSize={7} fill="#8b93a1" fontFamily="ui-monospace, Menlo, monospace">
        {label}
      </text>
    </g>
  );
}

function ExternalLed({ id, x, lit, color, label, wireHot }: { id: string; x: number; lit: boolean; color: string; label?: string; wireHot?: boolean }) {
  const legTop = PAD_Y + 10;
  const resistorY = legTop + 18;
  const bodyY = legTop + 44;
  const railY = legTop + 60;
  return (
    <g key={id} filter={wireHot ? "drop-shadow(0 0 5px rgba(163,230,53,0.9))" : undefined}>
      <line x1={x} y1={legTop} x2={x} y2={resistorY - 4} stroke="#9aa1ab" strokeWidth={1.4} />
      <rect x={x - 5} y={resistorY - 4} width={10} height={8} fill="#d9a441" stroke="#8a6a20" strokeWidth={0.6} />
      <line x1={x} y1={resistorY + 4} x2={x} y2={bodyY - 6} stroke="#9aa1ab" strokeWidth={1.4} />
      <circle cx={x} cy={bodyY} r={7} fill={lit ? color : "#3a3f49"} stroke="#20242c" strokeWidth={1} opacity={lit ? 1 : 0.7}>
        {lit && <animate attributeName="opacity" values="1" dur="0.01s" />}
      </circle>
      {lit && <circle cx={x} cy={bodyY} r={11} fill={color} opacity={0.35} />}
      <line x1={x} y1={bodyY + 7} x2={x} y2={railY} stroke="#9aa1ab" strokeWidth={1.4} />
      {label && (
        <text x={x} y={bodyY + 24} textAnchor="middle" fontSize={7} fill="#8b93a1" fontFamily="ui-monospace, Menlo, monospace">
          {label}
        </text>
      )}
    </g>
  );
}

function Board({
  parts,
  visibleParts,
  highlightParts,
  litCells,
  buttonAActive,
  buttonBActive,
  onButtonADown,
  onButtonAUp,
  onButtonBDown,
  onButtonBUp,
  litPin,
}: {
  parts: MicrobitPart[];
  visibleParts: Set<string> | null;
  highlightParts: string[];
  litCells: Set<string>;
  buttonAActive: boolean;
  buttonBActive: boolean;
  onButtonADown?: () => void;
  onButtonAUp?: () => void;
  onButtonBDown?: () => void;
  onButtonBUp?: () => void;
  litPin: "P0" | "P1" | "P2" | null;
}) {
  const isVisible = (id: string) => !visibleParts || visibleParts.has(id);
  const shownParts = parts.filter((p) => isVisible(p.id));
  const height = shownParts.length > 0 ? PAD_Y + 90 : BOARD.y + BOARD.h + 16;
  const railY = PAD_Y + 10 + 18 + 44 + 16;

  const cells: React.ReactNode[] = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const lit = litCells.has(cellKey(r, c));
      cells.push(
        <rect
          key={cellKey(r, c)}
          x={MATRIX.x + c * MATRIX.pitch - MATRIX.cell / 2}
          y={MATRIX.y + r * MATRIX.pitch - MATRIX.cell / 2}
          width={MATRIX.cell}
          height={MATRIX.cell}
          rx={2}
          fill={lit ? "#ef4444" : "#3a3f49"}
        />,
      );
    }
  }

  return (
    <svg width="100%" viewBox={`0 0 320 ${height}`} style={{ maxWidth: 400, margin: "0 auto", display: "block" }}>
      <rect x={BOARD.x} y={BOARD.y} width={BOARD.w} height={BOARD.h} rx={12} fill="#1b1e24" stroke="#3a3f49" strokeWidth={1.5} />
      <text x={BOARD.x + 10} y={BOARD.y + 18} fontSize={9} fill="#6b7280" fontFamily="ui-monospace, Menlo, monospace">
        micro:bit
      </text>
      {cells}
      <g
        onMouseDown={onButtonADown}
        onMouseUp={onButtonAUp}
        onMouseLeave={onButtonAUp}
        style={{ cursor: onButtonADown ? "pointer" : "default" }}
      >
        <circle cx={BTN_A.x} cy={BTN_A.y} r={BTN_A.r} fill={buttonAActive ? "#facc15" : "#2a2e36"} stroke="#565c68" strokeWidth={1.5} />
        <text x={BTN_A.x} y={BTN_A.y + 24} textAnchor="middle" fontSize={9} fill="#8b93a1" fontFamily="ui-monospace, Menlo, monospace">
          A
        </text>
      </g>
      <g
        onMouseDown={onButtonBDown}
        onMouseUp={onButtonBUp}
        onMouseLeave={onButtonBUp}
        style={{ cursor: onButtonBDown ? "pointer" : "default" }}
      >
        <circle cx={BTN_B.x} cy={BTN_B.y} r={BTN_B.r} fill={buttonBActive ? "#facc15" : "#2a2e36"} stroke="#565c68" strokeWidth={1.5} />
        <text x={BTN_B.x} y={BTN_B.y + 24} textAnchor="middle" fontSize={9} fill="#8b93a1" fontFamily="ui-monospace, Menlo, monospace">
          B
        </text>
      </g>
      <Pad x={GND_X} label="GND" />
      <Pad x={V3_X} label="3V" />
      <Pad x={PIN_X.P0} label="P0" hot={litPin === "P0"} />
      <Pad x={PIN_X.P1} label="P1" hot={litPin === "P1"} />
      <Pad x={PIN_X.P2} label="P2" hot={litPin === "P2"} />
      {shownParts.length > 0 && (
        <>
          <line x1={GND_X} y1={PAD_Y + 10} x2={GND_X} y2={railY} stroke="#9aa1ab" strokeWidth={1.4} />
          <line x1={GND_X} y1={railY} x2={Math.max(...shownParts.map((p) => PIN_X[p.pin]))} y2={railY} stroke="#9aa1ab" strokeWidth={1.4} />
          {shownParts.map((p) => (
            <ExternalLed
              key={p.id}
              id={p.id}
              x={PIN_X[p.pin]}
              lit={litPin === p.pin}
              color={p.color ?? "red"}
              label={p.label}
              wireHot={highlightParts.includes(p.id)}
            />
          ))}
        </>
      )}
    </svg>
  );
}

export default function MicrobitSim({
  parts = [],
  steps = [],
  program,
}: {
  parts?: MicrobitPart[];
  steps?: MicrobitBuildStep[];
  program: MicrobitProgram;
}) {
  const [running, setRunning] = useState(false);
  const [buildIdx, setBuildIdx] = useState(0);
  const [litCells, setLitCells] = useState<Set<string>>(new Set());
  const [litPin, setLitPin] = useState<"P0" | "P1" | "P2" | null>(null);
  const [buttonAActive, setButtonAActive] = useState(false);
  const [buttonBActive, setButtonBActive] = useState(false);
  const [temp, setTemp] = useState(24);
  const [alarm, setAlarm] = useState(false);
  const tempRef = useRef(24);
  const timers = useRef<ReturnType<typeof setInterval>[]>([]);

  const hasBuild = steps.length > 0;
  const built = !hasBuild || buildIdx >= steps.length;
  const visible = hasBuild
    ? new Set(steps.slice(0, buildIdx).flatMap((s) => s.add))
    : null;
  const highlight = hasBuild && buildIdx > 0 ? steps[buildIdx - 1].add : [];
  const isTemperature = program.kind === "temperature-log" || program.kind === "temperature-alarm";

  function clearTimers() {
    timers.current.forEach(clearInterval);
    timers.current = [];
  }

  function stop() {
    clearTimers();
    setRunning(false);
    setLitCells(new Set());
    setLitPin(null);
    setAlarm(false);
  }

  useEffect(() => () => clearTimers(), []);

  function start() {
    clearTimers();
    setRunning(true);

    if (program.kind === "matrix-blink") {
      let isOn = true;
      const tick = () => {
        setLitCells(isOn ? new Set(program.cells.map(([r, c]) => cellKey(r, c))) : new Set());
        const delay = isOn ? program.onMs : program.offMs;
        isOn = !isOn;
        timers.current.push(setTimeout(tick, delay) as unknown as ReturnType<typeof setInterval>);
      };
      tick();
    } else if (program.kind === "matrix-sequence") {
      let i = 0;
      const advance = () => {
        setLitCells(new Set(program.frames[i % program.frames.length].map(([r, c]) => cellKey(r, c))));
        i++;
        timers.current.push(setTimeout(advance, program.ms) as unknown as ReturnType<typeof setInterval>);
      };
      advance();
    } else if (program.kind === "pin-blink") {
      let isOn = true;
      const tick = () => {
        setLitPin(isOn ? program.pin : null);
        const delay = isOn ? program.onMs : program.offMs;
        isOn = !isOn;
        timers.current.push(setTimeout(tick, delay) as unknown as ReturnType<typeof setInterval>);
      };
      tick();
    } else if (program.kind === "pin-cycle") {
      let i = 0;
      const advance = () => {
        const step = program.steps[i % program.steps.length];
        setLitPin(step.pin);
        i++;
        timers.current.push(setTimeout(advance, step.ms) as unknown as ReturnType<typeof setInterval>);
      };
      advance();
    } else if (program.kind === "temperature-log") {
      // driven by the slider; nothing to schedule
    } else if (program.kind === "temperature-alarm") {
      timers.current.push(
        setInterval(() => {
          setAlarm((a) => {
            const hot = tempRef.current > program.thresholdC;
            if (!hot) return false;
            const next = !a;
            setLitCells(next ? new Set(Array.from({ length: 25 }, (_, k) => cellKey(Math.floor(k / 5), k % 5))) : new Set());
            return next;
          });
        }, 200),
      );
    }
    // button-hold-matrix / button-toggle-matrix are driven entirely by click handlers below
  }

  const isButtonProgram = program.kind === "button-hold-matrix" || program.kind === "button-toggle-matrix";
  const onA = isButtonProgram && program.button === "A";
  const onB = isButtonProgram && program.button === "B";

  function pressButton(which: "A" | "B") {
    if (!running) return;
    if (program.kind === "button-hold-matrix" && program.button === which) {
      setLitCells(new Set(program.cells.map(([r, c]) => cellKey(r, c))));
      if (which === "A") setButtonAActive(true);
      else setButtonBActive(true);
    } else if (program.kind === "button-toggle-matrix" && program.button === which) {
      setLitCells((cur) => (cur.size > 0 ? new Set() : new Set(program.cells.map(([r, c]) => cellKey(r, c)))));
    }
  }
  function releaseButton(which: "A" | "B") {
    if (!running) return;
    if (program.kind === "button-hold-matrix" && program.button === which) {
      setLitCells(new Set());
      if (which === "A") setButtonAActive(false);
      else setButtonBActive(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border border-[var(--border-soft)] p-3" style={{ background: "var(--tile)" }}>
        <Board
          parts={parts}
          visibleParts={visible}
          highlightParts={highlight}
          litCells={litCells}
          buttonAActive={buttonAActive}
          buttonBActive={buttonBActive}
          litPin={litPin}
          onButtonADown={running && onA ? () => pressButton("A") : undefined}
          onButtonAUp={running && onA ? () => releaseButton("A") : undefined}
          onButtonBDown={running && onB ? () => pressButton("B") : undefined}
          onButtonBUp={running && onB ? () => releaseButton("B") : undefined}
        />

        {hasBuild && (
          <div className="mt-2 flex flex-col gap-1.5">
            {steps.map((s, i) => {
              const done = i < buildIdx;
              const current = i === buildIdx;
              return (
                <motion.button
                  key={i}
                  type="button"
                  disabled={!current && !done}
                  onClick={() => setBuildIdx(done ? i : i + 1)}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: current || done ? 1 : 0.45, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                  className="flex items-start gap-3 rounded-xl border p-2.5 text-left transition-colors"
                  style={{
                    borderColor: done ? "var(--accent-border)" : current ? "var(--info-border)" : "var(--border-soft)",
                    background: done ? "var(--accent-soft)" : "var(--card)",
                    cursor: current || done ? "pointer" : "default",
                  }}
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
                    style={{
                      background: done ? "var(--accent)" : "var(--tile)",
                      color: done ? "var(--bg)" : "var(--faint)",
                      border: done ? "none" : "1px solid var(--border)",
                      fontFamily: "var(--font-grotesk)",
                    }}
                  >
                    {done ? "✓" : i + 1}
                  </span>
                  <span className="min-w-0 pt-0.5 text-[13px] leading-relaxed" style={{ color: done ? "var(--faint)" : "var(--body)" }}>
                    {s.text}
                    {current && (
                      <span className="ml-2 font-semibold" style={{ color: "var(--info-text)" }}>
                        {s.add.length ? "← tap to place it" : "← tap when done"}
                      </span>
                    )}
                  </span>
                </motion.button>
              );
            })}
            {built && (
              <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
                Wiring complete — now run it! ↓
              </motion.p>
            )}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={running ? stop : start}
            disabled={!built}
            className="btn-primary h-11 px-6 text-sm disabled:opacity-40"
            style={running ? { background: "var(--danger)" } : undefined}
            title={built ? undefined : "Finish the wiring first"}
          >
            {running ? "⏹ Stop" : "▶ Run"}
          </button>
          {isTemperature && (
            <label className="flex items-center gap-2 text-sm" style={{ color: "var(--body)" }}>
              🌡️
              <input
                type="range"
                min={10}
                max={45}
                value={temp}
                onChange={(e) => {
                  const t = Number(e.target.value);
                  setTemp(t);
                  tempRef.current = t;
                }}
                className="w-28"
                aria-label="Simulated temperature"
              />
              <span className="tabular-nums font-semibold">{temp}°C</span>
            </label>
          )}
          {hasBuild && buildIdx > 0 && (
            <button
              type="button"
              onClick={() => {
                if (running) stop();
                setBuildIdx((i) => Math.max(0, i - 1));
              }}
              className="btn-ghost h-11 px-4 text-sm"
            >
              ↶ Undo step
            </button>
          )}
          {hasBuild && buildIdx > 1 && !running && (
            <button type="button" onClick={() => setBuildIdx(0)} className="btn-ghost h-11 px-4 text-sm">
              ↺ Rebuild
            </button>
          )}
          {running && (program.kind === "button-hold-matrix" || program.kind === "button-toggle-matrix") && (
            <span className="muted text-[13px]">Click button {program.button} above</span>
          )}
        </div>

        {isTemperature && running && (
          <pre
            className="mt-3 rounded-lg border border-[var(--border-soft)] p-3 text-[12px] leading-relaxed"
            style={{ background: "var(--card)", color: "var(--body)", fontFamily: "ui-monospace, Menlo, monospace" }}
          >
            {`Temp: ${temp} C`}
            {program.kind === "temperature-alarm" && (temp > program.thresholdC ? `  ⚠ ALARM${alarm ? " ●" : ""}` : "")}
          </pre>
        )}
      </div>
    </div>
  );
}
