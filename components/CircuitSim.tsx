"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import CircuitDiagram, { type DiagramPart, type DiagramWire } from "@/components/CircuitDiagram";

// In-page Arduino simulator for authored tutorial circuits. A wiring diagram
// (CircuitDiagram) assembles step by step as the learner clicks through the
// build — the same steps they follow at a real breadboard — then ▶ Run
// executes the step's exact sketch on avr8js (Wokwi's open-source AVR core)
// from a hex precompiled at seed time. Parts respond in place: LEDs light on
// the breadboard, the pushbutton is clickable, the TMP36 has a temp slider.
//
// Conventions baked into the wiring model (matching the tutorial's sketches):
// pins 0–7 live on PORTD, 8–13 on PORTB; pushbuttons connect their pin to GND
// and assume INPUT_PULLUP (pressed = LOW); the TMP36 sits on A0 (ADC 0).

export type CircuitPart = DiagramPart;
export type CircuitWire = DiagramWire;
// A step with an empty `add` is a real-world instruction (unplug, upload) that
// places nothing on the diagram — it still gates the build like any other step.
export type BuildStep = { text: string; add: string[] };

type AvrModule = typeof import("avr8js");

type Sim = {
  portB: InstanceType<AvrModule["AVRIOPort"]>;
  portD: InstanceType<AvrModule["AVRIOPort"]>;
  adc: InstanceType<AvrModule["AVRADC"]>;
  stop: () => void;
};

const CLOCK_HZ = 16_000_000;

// Minimal Intel-hex loader (data records only) — what hexi.wokwi.com emits.
function loadHexInto(source: string, target: Uint8Array) {
  for (const line of source.split("\n")) {
    if (line[0] === ":" && line.substr(7, 2) === "00") {
      const bytes = parseInt(line.substr(1, 2), 16);
      const addr = parseInt(line.substr(3, 4), 16);
      for (let i = 0; i < bytes; i++) {
        target[addr + i] = parseInt(line.substr(9 + i * 2, 2), 16);
      }
    }
  }
}

function pinToPort(pin: number): { port: "B" | "D"; bit: number } {
  return pin < 8 ? { port: "D", bit: pin } : { port: "B", bit: pin - 8 };
}

const tmp36Voltage = (celsius: number) => (celsius * 10 + 500) / 1000;

export default function CircuitSim({
  parts = [],
  wires = [],
  steps = [],
  hex,
  sketch,
}: {
  parts?: CircuitPart[];
  wires?: CircuitWire[];
  steps?: BuildStep[];
  hex: string;
  sketch?: string;
}) {
  const serialBox = useRef<HTMLPreElement>(null);
  // Wokwi element instances by part id (plus "board"), provided by the diagram.
  const elsRef = useRef(new Map<string, HTMLElement & { value?: boolean; led13?: boolean; ledPower?: boolean }>());
  const avrRef = useRef<AvrModule | null>(null);
  const simRef = useRef<Sim | null>(null);
  const serialBuf = useRef("");
  const tempRef = useRef(24);

  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(false);
  const [serial, setSerial] = useState("");
  const [temp, setTemp] = useState(24);
  // How many build steps have been completed (steps.length = fully wired).
  const [buildIdx, setBuildIdx] = useState(0);

  const hasBuild = steps.length > 0;
  const built = !hasBuild || buildIdx >= steps.length;
  const hasTmp36 = parts.some((p) => p.kind === "tmp36");
  const wantsSerial = Boolean(sketch?.includes("Serial."));

  const visible = useMemo(() => {
    if (!hasBuild) return null; // no build sequence — show the finished circuit
    const set = new Set<string>();
    for (let i = 0; i < buildIdx; i++) steps[i].add.forEach((id) => set.add(id));
    return set;
  }, [hasBuild, steps, buildIdx]);
  const highlight = hasBuild && buildIdx > 0 ? steps[buildIdx - 1].add : [];

  useEffect(() => {
    let cancelled = false;
    import("avr8js").then((avr) => {
      if (cancelled) return;
      avrRef.current = avr;
      setReady(true);
    });
    return () => {
      cancelled = true;
      simRef.current?.stop();
    };
  }, []);

  function setDigitalInput(pin: number, value: boolean) {
    const sim = simRef.current;
    if (!sim) return;
    const { port, bit } = pinToPort(pin);
    (port === "B" ? sim.portB : sim.portD).setPin(bit, value);
  }

  // The diagram hands over each created wokwi element exactly once.
  function onElement(id: string, el: HTMLElement) {
    elsRef.current.set(id, el);
    const part = parts.find((p) => p.id === id);
    if (part?.kind === "pushbutton") {
      const pin = part.pin ?? 2;
      // Pullup logic: pressed pulls the pin to GND (LOW).
      el.addEventListener("button-press", () => setDigitalInput(pin, false));
      el.addEventListener("button-release", () => setDigitalInput(pin, true));
    }
  }

  function syncVisuals() {
    const avr = avrRef.current;
    const sim = simRef.current;
    if (!avr || !sim) return;
    const high = (pin: number) => {
      const { port, bit } = pinToPort(pin);
      return (port === "B" ? sim.portB : sim.portD).pinState(bit) === avr.PinState.High;
    };
    const board = elsRef.current.get("board");
    if (board) board.led13 = high(13);
    for (const p of parts) {
      const el = elsRef.current.get(p.id);
      if (p.kind === "led" && p.pin != null && el) el.value = high(p.pin);
    }
    if (serialBuf.current) {
      const chunk = serialBuf.current;
      serialBuf.current = "";
      setSerial((s) => (s + chunk).slice(-1500));
    }
  }

  function start() {
    const avr = avrRef.current;
    if (!avr) return;
    simRef.current?.stop();

    const program = new Uint16Array(0x8000);
    loadHexInto(hex, new Uint8Array(program.buffer));
    const cpu = new avr.CPU(program);
    new avr.AVRTimer(cpu, avr.timer0Config);
    new avr.AVRTimer(cpu, avr.timer1Config);
    new avr.AVRTimer(cpu, avr.timer2Config);
    const portB = new avr.AVRIOPort(cpu, avr.portBConfig);
    new avr.AVRIOPort(cpu, avr.portCConfig);
    const portD = new avr.AVRIOPort(cpu, avr.portDConfig);
    const usart = new avr.AVRUSART(cpu, avr.usart0Config, CLOCK_HZ);
    const adc = new avr.AVRADC(cpu, avr.adcConfig);
    adc.channelValues[0] = tmp36Voltage(tempRef.current);
    // avr8js reads an undriven input pin as LOW; drive button pins HIGH so
    // the unpressed pullup state reads correctly from the first instruction.
    for (const p of parts) {
      if (p.kind === "pushbutton" && p.pin != null) {
        const { port, bit } = pinToPort(p.pin);
        (port === "B" ? portB : portD).setPin(bit, true);
      }
    }
    usart.onByteTransmit = (value: number) => {
      serialBuf.current += String.fromCharCode(value);
    };

    serialBuf.current = "";
    setSerial("");

    let stopped = false;
    let lastTime = performance.now();
    // setTimeout, not requestAnimationFrame: rAF is suspended in occluded or
    // backgrounded tabs, which would freeze the simulation mid-delay().
    const loop = () => {
      if (stopped) return;
      const now = performance.now();
      // Pace to wall clock so delay(1000) is a real second; cap the catch-up
      // burst after a throttled tab so we never freeze the UI.
      const deltaMs = Math.min(now - lastTime, 50);
      lastTime = now;
      const targetCycles = cpu.cycles + Math.floor((CLOCK_HZ * deltaMs) / 1000);
      while (cpu.cycles < targetCycles) {
        avr.avrInstruction(cpu);
        cpu.tick();
      }
      syncVisuals();
      setTimeout(loop, 16);
    };
    simRef.current = { portB, portD, adc, stop: () => (stopped = true) };
    const board = elsRef.current.get("board");
    if (board) board.ledPower = true;
    setRunning(true);
    setTimeout(loop, 0);
  }

  function stop() {
    simRef.current?.stop();
    simRef.current = null;
    const board = elsRef.current.get("board");
    if (board) {
      board.ledPower = false;
      board.led13 = false;
    }
    for (const p of parts) {
      const el = elsRef.current.get(p.id);
      if (p.kind === "led" && el) el.value = false;
    }
    setRunning(false);
  }

  // Keep the serial console pinned to the latest line.
  useEffect(() => {
    if (serialBox.current) serialBox.current.scrollTop = serialBox.current.scrollHeight;
  }, [serial]);

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border border-[var(--border-soft)] p-3" style={{ background: "var(--tile)" }}>
        <CircuitDiagram parts={parts} wires={wires} visible={visible} highlight={highlight} onElement={onElement} />

        {/* Build steps: tap each one to place that part or wire on the board */}
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
                Circuit complete — now run it! ↓
              </motion.p>
            )}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={running ? stop : start}
            disabled={!ready || !built}
            className="btn-primary h-11 px-6 text-sm disabled:opacity-40"
            style={running ? { background: "var(--danger)" } : undefined}
            title={built ? undefined : "Finish the wiring first"}
          >
            {running ? "⏹ Stop" : "▶ Run"}
          </button>
          {hasTmp36 && (
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
                  const sim = simRef.current;
                  if (sim) sim.adc.channelValues[0] = tmp36Voltage(t);
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
                // Removing a piece un-completes the circuit, so stop the sim.
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
          {running && !hasTmp36 && <span className="muted text-[13px]">Running your sketch…</span>}
        </div>

        {wantsSerial && (
          <pre
            ref={serialBox}
            className="mt-3 h-28 overflow-y-auto rounded-lg border border-[var(--border-soft)] p-3 text-[12px] leading-relaxed"
            style={{ background: "var(--card)", color: "var(--body)", fontFamily: "ui-monospace, Menlo, monospace" }}
          >
            {serial || "Serial Monitor — press ▶ Run to see output"}
          </pre>
        )}
      </div>
      {sketch && (
        <details className="rounded-xl border border-[var(--border-soft)]" style={{ background: "var(--tile)" }}>
          <summary className="cursor-pointer p-3 text-sm font-medium" style={{ color: "var(--body)" }}>
            👀 The exact sketch this is running
          </summary>
          <pre
            className="overflow-x-auto border-t border-[var(--border-soft)] p-4 text-[13px] leading-relaxed"
            style={{ color: "var(--body)", fontFamily: "ui-monospace, Menlo, monospace" }}
          >
            {sketch}
          </pre>
        </details>
      )}
    </div>
  );
}
