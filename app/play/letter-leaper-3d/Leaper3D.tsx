"use client";

// Letter Leaper 3D — local preview. The HTML here is the whole interface
// (prompt, status, controls, on-screen keys); the canvas only illustrates.
// Rules come from the shared engine (public/games/letter-leaper/core.js) via
// lib/leaper3d; tracking stays in preview mode (nothing is uploaded).
import { Component, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useProgress } from "@react-three/drei";
import { createLeaperCore, liveCores, type LeaperCore } from "@/lib/leaper3d/core";
import { classifyKey } from "@/lib/leaper3d/input";
import { createPreview, GOAL, type Preview, type Snapshot } from "@/lib/leaper3d/preview";
import { previewAdapter, type TrackingAdapter } from "@/lib/leaper3d/tracking";
import { createSound } from "@/lib/leaper3d/sound";
import styles from "./leaper3d.module.css";

const Scene = dynamic(() => import("./Scene"), { ssr: false, loading: () => null });
const DEV = process.env.NODE_ENV !== "production";
// Development-only leak check: live rules-engine instances (expected: 1 while open).
const countCores = () => { if (DEV) (window as unknown as { __leaper3dCores?: number }).__leaper3dCores = liveCores(); };
const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
const SETS: [string, string][] = [["all", "All letters"], ["home", "Home row"], ["top", "Top row"], ["bottom", "Bottom row"]];

function webglAvailable() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; }
}
const storage = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};

class AssetBoundary extends Component<{ children: ReactNode; onRetry: () => void }, { error: string | null }> {
  state = { error: null as string | null };
  static getDerivedStateFromError(e: unknown) { return { error: e instanceof Error ? e.message : String(e) }; }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className={styles.overlay} role="alert">
        <div className={styles.panel}>
          <h2>The 3D scene couldn’t load</h2>
          <p className={styles.small}>{this.state.error.slice(0, 160)}</p>
          <div className={styles.row}>
            <button className="btn-primary h-11 px-5 text-sm" onClick={() => { this.setState({ error: null }); this.props.onRetry(); }}>Try again</button>
            <Link className="btn-ghost flex h-11 items-center px-5 text-sm" href="/play/typing">Play the 2D game</Link>
          </div>
        </div>
      </div>
    );
  }
}

function Loading() {
  const { active, progress } = useProgress();
  if (!active && progress >= 100) return null;
  return (
    <div className={styles.overlay} role="status" aria-live="polite">
      <div className={styles.panel}><p>Growing the jungle… {Math.round(progress)}%</p></div>
    </div>
  );
}

export default function Leaper3D() {
  const [core, setCore] = useState<LeaperCore | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [webgl] = useState(webglAvailable);
  const tracking = useMemo<TrackingAdapter>(() => previewAdapter(), []);
  const [retry, setRetry] = useState(0);

  // One rules-engine instance per mount, disposed (loop stopped) on unmount.
  useEffect(() => {
    let dead = false, made: LeaperCore | null = null;
    fetch("/games/letter-leaper/core.js")
      .then((r) => { if (!r.ok) throw new Error(`Game rules failed to load (${r.status}).`); return r.text(); })
      .then((src) => { if (dead) return; made = createLeaperCore(src); countCores(); setCore(made); })
      .catch((e) => !dead && setLoadError(e instanceof Error ? e.message : String(e)));
    return () => { dead = true; made?.dispose(); countCores(); };
  }, [retry]);

  if (loadError) {
    return (
      <Shell>
        <div className={styles.panel} role="alert">
          <h2>The preview couldn’t start</h2>
          <p className={styles.small}>{loadError}</p>
          <button className="btn-primary h-11 px-5 text-sm" onClick={() => { setLoadError(null); setRetry((n) => n + 1); }}>Try again</button>
        </div>
      </Shell>
    );
  }
  if (!core) return <Shell><p className={styles.small} role="status">Preparing the 3D preview…</p></Shell>;
  return <Game core={core} tracking={tracking} webgl={webgl} />;
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className={styles.root}>
      <Header />
      <div className={styles.center}>{children}</div>
    </main>
  );
}
function Header({ children }: { children?: ReactNode }) {
  return (
    <header className={styles.header}>
      <div className={styles.row}>
        <Link href="/play/typing" className="muted text-sm hover:text-[var(--text)]">← Letter Leaper</Link>
        <span className={styles.title}>Letter Leaper 3D</span>
        <span className={styles.badge}>Local preview · not saved</span>
      </div>
      <div className={styles.row}>{children}</div>
    </header>
  );
}

function Game({ core, tracking, webgl }: { core: LeaperCore; tracking: TrackingAdapter; webgl: boolean }) {
  const preview = useMemo<Preview>(() => createPreview(core, tracking), [core, tracking]);
  useEffect(() => () => preview.dispose(), [preview]);
  const snap: Snapshot = useSyncExternalStore(preview.subscribe, preview.getSnapshot, preview.getSnapshot);
  const [practice, setPractice] = useState("all");
  const [soundOn, setSoundOn] = useState(false);
  const osReduced = useMemo(() => matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const [calmPref, setCalmPref] = useState(() => storage.get("leaper3d-calm") === "on");
  const [lowEffects, setLowEffects] = useState(() => storage.get("leaper3d-low") === "on");
  const [sceneKey, setSceneKey] = useState(0);
  const calm = osReduced || calmPref;
  const sound = useMemo(() => createSound(), []);
  const startRef = useRef<HTMLButtonElement>(null);
  const settings = useMemo(() => ({ set: practice, pace: "relaxed" }), [practice]);

  useEffect(() => { core.setCalm(calm); }, [core, calm]);
  useEffect(() => () => sound.close(), [sound]);

  // Sounds follow the engine's feedback; the prompt's gentle nudge is keyed on
  // the number of wrong keys so far (derived, no extra state).
  const shake = snap.attempts - snap.correct;
  const lastFeedback = useRef(0);
  useEffect(() => {
    const f = snap.feedback;
    if (!f || f.n === lastFeedback.current) return;
    lastFeedback.current = f.n;
    if (!soundOn) return;
    if (f.type === "miss") sound.play("miss");
    else if (f.type === "typed") sound.play("correct");
    else if (f.type === "jump") sound.play("takeoff");
    else if (f.type === "land") sound.play("land");
    else if (f.type === "celebrate") sound.play("celebrate");
  }, [snap.feedback, soundOn, sound]);

  // Keyboard: same acceptance rules as the 2D game (lib/leaper3d/input.ts).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const action = classifyKey(e, { live: preview.getSnapshot().phase === "playing" && core.state === "playing", jumping: core.jumping });
      if (action.kind === "none") return;
      if (action.kind === "pause") { e.preventDefault(); if (preview.getSnapshot().phase !== "ready") preview.togglePause(); return; }
      if (action.kind === "letter") { e.preventDefault(); preview.input(action.letter, "kbd"); return; }
      if (action.reason === "busy") e.preventDefault();
      preview.ignore(action.reason);
    };
    const onPaste = (e: ClipboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (core.state === "playing" && !/^(INPUT|TEXTAREA)$/.test(t?.tagName ?? "")) { e.preventDefault(); preview.ignore("paste"); }
    };
    const onVisibility = () => { if (document.hidden) preview.pauseForHiddenTab(); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("paste", onPaste);
    document.addEventListener("visibilitychange", onVisibility);
    if (DEV) (window as unknown as { __leaper3dListeners?: number }).__leaper3dListeners = ((window as unknown as { __leaper3dListeners?: number }).__leaper3dListeners ?? 0) + 1;
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("paste", onPaste);
      document.removeEventListener("visibilitychange", onVisibility);
      if (DEV) (window as unknown as { __leaper3dListeners: number }).__leaper3dListeners--;
    };
  }, [core, preview]);

  const begin = useCallback(() => { preview.start(settings); (document.activeElement as HTMLElement | null)?.blur(); }, [preview, settings]);
  const restart = useCallback(() => { preview.restart(settings); (document.activeElement as HTMLElement | null)?.blur(); }, [preview, settings]);
  const toggleSound = () => { if (!soundOn) sound.enable(); setSoundOn(!soundOn); };
  const toggleCalm = () => { const v = !calmPref; setCalmPref(v); storage.set("leaper3d-calm", v ? "on" : "off"); };
  const toggleLow = () => { const v = !lowEffects; setLowEffects(v); storage.set("leaper3d-low", v ? "on" : "off"); };

  useEffect(() => { if (snap.phase === "ready") startRef.current?.focus(); }, [snap.phase]);

  const status = snap.phase === "ready" ? "Press Start when you’re ready."
    : snap.phase === "paused" ? "Paused — press Resume or Esc."
    : snap.phase === "celebrating" ? "Ten leaps! Preview complete."
    : snap.inputOpen ? `Your turn — type ${snap.target.toUpperCase()}`
    : "Leaping…";

  return (
    <main className={styles.root} data-phase={snap.phase} data-calm={calm ? "on" : "off"}>
      <Header>
        {snap.phase !== "ready" && (
          <button className={styles.control} onClick={() => preview.togglePause()} disabled={snap.phase === "celebrating"} aria-pressed={snap.phase === "paused"}>
            {snap.phase === "paused" ? "Resume" : "Pause"}
          </button>
        )}
        <button className={styles.control} onClick={restart} disabled={snap.phase === "ready"}>Restart</button>
        <button className={styles.control} onClick={toggleSound} aria-pressed={soundOn}>{soundOn ? "Sound on" : "Sound off"}</button>
        <button className={styles.control} onClick={toggleCalm} aria-pressed={calm} disabled={osReduced} title={osReduced ? "Your device asks for reduced motion" : undefined}>Calm motion</button>
        <button className={styles.control} onClick={toggleLow} aria-pressed={lowEffects}>Lower effects</button>
      </Header>

      <section className={styles.stage} aria-label="Letter Leaper 3D preview">
        {webgl ? (
          <AssetBoundary onRetry={() => setSceneKey((n) => n + 1)}>
            <Scene key={sceneKey} core={core} phase={snap.phase} calm={calm} lowEffects={lowEffects} inputOpen={snap.inputOpen} onLowEffects={() => setLowEffects(true)} />
            <Loading />
          </AssetBoundary>
        ) : (
          <div className={styles.overlay} role="alert">
            <div className={styles.panel}>
              <h2>This browser can’t show the 3D scene</h2>
              <p className={styles.small}>WebGL isn’t available here (it may be turned off, or the device may not support it). The 2D game works everywhere.</p>
              <Link className="btn-primary flex h-11 items-center px-5 text-sm" href="/play/typing">Play Letter Leaper</Link>
            </div>
          </div>
        )}

        {/* HUD: separate from the scenery, high contrast, never part of the 3D world. */}
        <div className={styles.hud}>
          <div className={styles.progress} aria-label={`Leap ${snap.leaps} of ${GOAL}`}>
            <span className={styles.label}>Leap {snap.leaps} / {GOAL}</span>
            <span className={styles.pips}>{Array.from({ length: GOAL }, (_, i) => <i key={i} data-done={i < snap.leaps ? "y" : "n"} />)}</span>
            <span className={styles.label}>Accuracy {snap.accuracy === null ? "—" : `${snap.accuracy}%`}</span>
          </div>
          {(snap.phase === "playing" || snap.phase === "paused") && (
            <div className={styles.prompt} data-open={snap.inputOpen ? "y" : "n"} key={`shake${shake}`} data-shake={shake ? "y" : "n"}>
              <span className={styles.eyebrow}>Next leap</span>
              <span className={styles.letter}>{snap.target.toUpperCase()}</span>
            </div>
          )}
          <p className={styles.status} role="status" aria-live="polite" data-open={snap.inputOpen ? "y" : "n"}>{status}</p>
        </div>

        {snap.phase === "ready" && (
          <div className={styles.overlay}>
            <div className={styles.panel}>
              <span className={styles.eyebrow}>A ten-leap jungle preview</span>
              <h1>Help Milo leap across the jungle</h1>
              <p className={styles.small}>Type the letter on the card to leap to the glowing island. Ten leaps finish the preview. Nothing is saved.</p>
              <label className={styles.field}>Practice
                <select value={practice} onChange={(e) => setPractice(e.target.value)}>{SETS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
              </label>
              <button ref={startRef} className="btn-primary h-12 px-6 text-base" onClick={begin}>Start</button>
            </div>
          </div>
        )}
        {snap.phase === "paused" && (
          <div className={styles.overlay}>
            <div className={styles.panel}><h2>Paused</h2><p className={styles.small}>Milo will wait for you.</p>
              <button className="btn-primary h-11 px-5 text-sm" onClick={() => preview.togglePause()} autoFocus>Resume</button>
            </div>
          </div>
        )}
        {snap.phase === "celebrating" && (
          <div className={`${styles.overlay} ${styles.celebrate}`}>
            <div className={styles.panel}>
              <span className={styles.eyebrow}>Preview complete</span>
              <h2>Ten leaps! Milo made it across.</h2>
              <p className={styles.small}>{snap.correct} of {snap.attempts} key presses right · {snap.accuracy ?? 0}% accuracy</p>
              <button className="btn-primary h-11 px-5 text-sm" onClick={restart} autoFocus>Play again</button>
            </div>
          </div>
        )}
      </section>

      <section className={styles.keys} aria-label="On-screen letters">
        {ROWS.map((row) => (
          <div key={row} className={styles.keyRow}>
            {[...row].map((k) => (
              <button key={k} className={styles.key} aria-label={`Type ${k.toUpperCase()}`} disabled={!snap.inputOpen}
                onClick={(e) => { preview.input(k, "screen"); e.currentTarget.blur(); }}>
                {k.toUpperCase()}
              </button>
            ))}
          </div>
        ))}
      </section>

      {DEV && <DevInspector tracking={tracking} core={core} />}
    </main>
  );
}

// Development-only event inspector (?inspect=1). Not in production builds.
function DevInspector({ tracking, core }: { tracking: TrackingAdapter; core: LeaperCore }) {
  const [open] = useState(() => new URLSearchParams(location.search).has("inspect"));
  const events = useSyncExternalStore(tracking.subscribe, tracking.events, tracking.events);
  const [clocks, setClocks] = useState(core.clocks());
  useEffect(() => { if (!open) return; const t = setInterval(() => setClocks(core.clocks()), 250); return () => clearInterval(t); }, [open, core]);
  if (!open) return null;
  const counts = events.reduce<Record<string, number>>((m, e) => ((m[e.type] = (m[e.type] ?? 0) + 1), m), {});
  return (
    <aside className={styles.inspector} aria-label="Event inspector (development only)">
      <strong>Event inspector · dev only · tracking mode: {tracking.mode} (no uploads)</strong>
      <div>typing {Math.round(clocks.active)} ms · paused {Math.round(clocks.pause)} ms · animation {Math.round(clocks.anim)} ms</div>
      <div>{Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(" · ") || "no events yet"}</div>
      <ol>{events.slice(-14).reverse().map((e) => <li key={e.seq}>{e.seq} {e.type} {JSON.stringify(e.data)}</li>)}</ol>
    </aside>
  );
}
