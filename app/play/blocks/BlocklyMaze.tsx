"use client";

// Free block-coding game: program a robot through a maze with Blockly
// (the visual block editor from the Raspberry Pi Foundation / Google, Apache
// 2.0 — loaded client-side only). No account, nothing saved.

import { useEffect, useRef, useState } from "react";
import type * as BlocklyNS from "blockly";

type Dir = 0 | 1 | 2 | 3; // N E S W
type Level = {
  name: string;
  hint: string;
  size: number;
  walls: [number, number][];
  start: { r: number; c: number; dir: Dir };
  goal: { r: number; c: number };
};

const LEVELS: Level[] = [
  {
    name: "Level 1 — First steps",
    hint: "Snap some “move forward” blocks together, then press Run.",
    size: 5,
    walls: [],
    start: { r: 2, c: 0, dir: 1 },
    goal: { r: 2, c: 4 },
  },
  {
    name: "Level 2 — The corner",
    hint: "The robot turns its OWN left or right — like you would.",
    size: 5,
    walls: [
      [0, 0], [0, 1], [1, 0],
      [3, 2], [4, 2], [3, 3], [4, 3], [3, 4],
    ],
    start: { r: 4, c: 0, dir: 0 },
    goal: { r: 0, c: 4 },
  },
  {
    name: "Level 3 — Think in loops",
    hint: "You could stack lots of blocks… or use ONE repeat block. Fewer blocks = better code.",
    size: 5,
    walls: [
      [1, 1], [1, 2], [1, 3],
      [3, 1], [3, 2], [3, 3],
    ],
    start: { r: 4, c: 0, dir: 0 },
    goal: { r: 2, c: 2 },
  },
];

const DIR_DELTA: Record<Dir, [number, number]> = { 0: [-1, 0], 1: [0, 1], 2: [1, 0], 3: [0, -1] };
const DIR_ROT = { 0: 0, 1: 90, 2: 180, 3: 270 };

type Action = "F" | "L" | "R";

export default function BlocklyMaze() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const workspaceRef = useRef<BlocklyNS.WorkspaceSvg | null>(null);
  const genRef = useRef<((ws: BlocklyNS.Workspace) => string) | null>(null);
  const runToken = useRef(0);

  const [levelIdx, setLevelIdx] = useState(0);
  const level = LEVELS[levelIdx];
  const [robot, setRobot] = useState(level.start);
  const [status, setStatus] = useState<"idle" | "running" | "crashed" | "won" | "lost">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [blocksUsed, setBlocksUsed] = useState(0);
  const [allDone, setAllDone] = useState(false);

  // Boot Blockly client-side only.
  useEffect(() => {
    let disposed = false;
    (async () => {
      const Blockly = await import("blockly");
      const { javascriptGenerator } = await import("blockly/javascript");
      if (disposed || !hostRef.current) return;

      if (!Blockly.Blocks["maze_forward"]) {
        Blockly.defineBlocksWithJsonArray([
          { type: "maze_forward", message0: "⬆️ move forward", previousStatement: null, nextStatement: null, colour: 210, tooltip: "Move one square forward" },
          { type: "maze_left", message0: "↩️ turn left", previousStatement: null, nextStatement: null, colour: 260, tooltip: "Turn to the robot's left" },
          { type: "maze_right", message0: "↪️ turn right", previousStatement: null, nextStatement: null, colour: 260, tooltip: "Turn to the robot's right" },
        ]);
        javascriptGenerator.forBlock["maze_forward"] = () => "api.F();\n";
        javascriptGenerator.forBlock["maze_left"] = () => "api.L();\n";
        javascriptGenerator.forBlock["maze_right"] = () => "api.R();\n";
      }

      const ws = Blockly.inject(hostRef.current, {
        renderer: "zelos",
        toolbox: {
          kind: "flyoutToolbox",
          contents: [
            { kind: "block", type: "maze_forward" },
            { kind: "block", type: "maze_left" },
            { kind: "block", type: "maze_right" },
            {
              kind: "block",
              type: "controls_repeat_ext",
              inputs: { TIMES: { shadow: { type: "math_number", fields: { NUM: 3 } } } },
            },
          ],
        },
        scrollbars: true,
        trashcan: true,
        sounds: false,
        zoom: { controls: false, wheel: false, startScale: 0.9 },
      });
      workspaceRef.current = ws;
      genRef.current = (w) => javascriptGenerator.workspaceToCode(w);
    })();
    return () => {
      disposed = true;
      workspaceRef.current?.dispose();
      workspaceRef.current = null;
    };
  }, []);

  function reset(idx = levelIdx) {
    runToken.current++;
    setRobot(LEVELS[idx].start);
    setStatus("idle");
    setMessage(null);
  }

  async function run() {
    const ws = workspaceRef.current;
    const gen = genRef.current;
    if (!ws || !gen || status === "running") return;
    reset();
    const token = ++runToken.current;

    const topBlocks = ws.getTopBlocks(true).length;
    const used = ws.getAllBlocks(false).filter((b) => !b.isShadow()).length;
    setBlocksUsed(used);
    if (used === 0) {
      setMessage("Drag some blocks from the left into the workspace first!");
      return;
    }
    if (topBlocks > 1) {
      setMessage("Snap all your blocks into ONE stack so the robot knows the order.");
      return;
    }

    // Collect the program's actions (blocks are the only author of this code).
    const actions: Action[] = [];
    const api = {
      F: () => { actions.push("F"); guard(); },
      L: () => { actions.push("L"); guard(); },
      R: () => { actions.push("R"); guard(); },
    };
    const guard = () => {
      if (actions.length > 300) throw new Error("TOO_MANY");
    };
    try {
      new Function("api", gen(ws))(api);
    } catch (e) {
      setMessage(e instanceof Error && e.message === "TOO_MANY" ? "Whoa — that's over 300 moves! Check your repeat numbers." : "Something in the blocks went wrong — try rebuilding the stack.");
      return;
    }

    // Animate.
    setStatus("running");
    let { r, c, dir } = level.start;
    for (const a of actions) {
      await new Promise((res) => setTimeout(res, 300));
      if (runToken.current !== token) return;
      if (a === "L") dir = ((dir + 3) % 4) as Dir;
      else if (a === "R") dir = ((dir + 1) % 4) as Dir;
      else {
        const [dr, dc] = DIR_DELTA[dir];
        const nr = r + dr;
        const nc = c + dc;
        const hitWall = nr < 0 || nc < 0 || nr >= level.size || nc >= level.size || level.walls.some(([wr, wc]) => wr === nr && wc === nc);
        if (hitWall) {
          setStatus("crashed");
          setMessage("💥 Bonk! The robot hit a wall. Press Reset and adjust your blocks.");
          return;
        }
        r = nr;
        c = nc;
      }
      setRobot({ r, c, dir });
      if (r === level.goal.r && c === level.goal.c) {
        setStatus("won");
        setMessage(`⭐ Solved in ${used} block${used === 1 ? "" : "s"}!`);
        return;
      }
    }
    if (runToken.current !== token) return;
    setStatus("lost");
    setMessage("The program finished but the robot isn't at the star yet — add more moves!");
  }

  function nextLevel() {
    if (levelIdx + 1 >= LEVELS.length) {
      setAllDone(true);
      return;
    }
    const idx = levelIdx + 1;
    setLevelIdx(idx);
    reset(idx);
    workspaceRef.current?.clear();
  }

  const tile = 56;
  const px = level.size * tile;

  if (allDone) {
    return (
      <div className="card mx-auto max-w-lg p-10 text-center">
        <div className="text-6xl">🏆</div>
        <h2 className="mt-4 text-2xl font-semibold">You beat all {LEVELS.length} mazes!</h2>
        <p className="muted mt-2">That was real programming: sequences, turns, and loops.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" className="btn-ghost h-12 px-5 text-sm" onClick={() => { setAllDone(false); setLevelIdx(0); reset(0); workspaceRef.current?.clear(); }}>
            ↻ Play again
          </button>
          <a href="/join" className="btn-primary flex h-12 items-center px-6 text-sm">
            Join a class for the real builds →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <span className="display text-lg font-semibold">{level.name}</span>
          <span className="mono-label ml-3">{levelIdx + 1} / {LEVELS.length}</span>
        </div>
        <span className="muted text-sm">{level.hint}</span>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Blockly workspace */}
        <div className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-[var(--border)]" style={{ minHeight: 420 }}>
          <div ref={hostRef} style={{ width: "100%", height: 420 }} />
        </div>

        {/* Maze */}
        <div className="flex shrink-0 flex-col items-center gap-3">
          <svg width={px} height={px} viewBox={`0 0 ${px} ${px}`} className="rounded-2xl border border-[var(--border)]" style={{ background: "var(--tile)" }} role="img" aria-label="Robot maze">
            {Array.from({ length: level.size }).map((_, r) =>
              Array.from({ length: level.size }).map((_, c) => {
                const wall = level.walls.some(([wr, wc]) => wr === r && wc === c);
                return (
                  <rect
                    key={`${r}:${c}`}
                    x={c * tile + 2}
                    y={r * tile + 2}
                    width={tile - 4}
                    height={tile - 4}
                    rx={8}
                    fill={wall ? "#2a2f3a" : "var(--card)"}
                    stroke={wall ? "none" : "rgba(255,255,255,0.04)"}
                  />
                );
              }),
            )}
            <text x={level.goal.c * tile + tile / 2} y={level.goal.r * tile + tile / 2 + 1} textAnchor="middle" dominantBaseline="central" fontSize={30}>⭐</text>
            <g style={{ transition: "transform 0.25s ease" }} transform={`translate(${robot.c * tile + tile / 2}, ${robot.r * tile + tile / 2})`}>
              <text textAnchor="middle" dominantBaseline="central" fontSize={30} transform={`rotate(${DIR_ROT[robot.dir]})`}>
                {status === "crashed" ? "💥" : "🤖"}
              </text>
            </g>
          </svg>

          <div className="flex w-full items-center gap-2">
            <button type="button" onClick={run} disabled={status === "running"} className="btn-primary h-12 flex-1 text-sm">
              {status === "running" ? "Running…" : "▶ Run my program"}
            </button>
            <button type="button" onClick={() => reset()} className="btn-ghost h-12 px-4 text-sm">
              ↻ Reset
            </button>
          </div>
          {message && (
            <p className="max-w-[300px] text-center text-sm" style={{ color: status === "won" ? "var(--accent)" : status === "crashed" ? "var(--danger)" : "var(--body)" }}>
              {message}
            </p>
          )}
          {status === "won" && (
            <button type="button" onClick={nextLevel} className="btn-primary h-12 w-full text-sm">
              {levelIdx + 1 >= LEVELS.length ? "🏆 Finish" : "Next level →"}
            </button>
          )}
          {blocksUsed > 0 && status !== "won" && <span className="mono-label">{blocksUsed} blocks in your program</span>}
        </div>
      </div>
    </div>
  );
}
