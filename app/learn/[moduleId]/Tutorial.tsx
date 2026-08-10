"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import SlideShow from "@/components/SlideShow";
import ScratchBlocks from "@/components/ScratchBlocks";
import CircuitSim, { type BuildStep, type CircuitPart, type CircuitWire } from "@/components/CircuitSim";
import KnexViewer, { type KnexStep } from "@/components/KnexViewer";
import { compressImage } from "@/lib/client-image";

// Step-by-step tutorial player for checkpoint modules (camp format).
// Content advances one card at a time; checkpoint cards ask for a photo/
// screenshot or a voice note and gate "Next" until captured. The final card
// collects a short written wrap-up, and completion unlocks the portfolio.

type TrackId = "beginner" | "intermediate" | "advanced";

type Block = {
  type: string; // heading | text | code | scratch | embed | circuit | prompt | video | image | slides | checkpoint | trackpick
  text?: string;
  url?: string;
  urls?: string[];
  // --- circuit blocks: an in-page Arduino simulator running an authored sketch ---
  parts?: CircuitPart[]; // LEDs / buttons / sensors placed at breadboard holes
  wires?: CircuitWire[]; // jumpers from Arduino pins to breadboard holes
  steps?: BuildStep[]; // guided build: each step places parts/wires by id
  sketch?: string; // the Arduino source (shown collapsible under the sim)
  hex?: string; // precompiled AVR hex (built at seed time via hexi.wokwi.com)
  // --- knex blocks: an interactive 3D build guide assembled step by step ---
  builds?: KnexStep[]; // each step adds rods ([[x,y,z],[x,y,z]] pairs)
  capture?: "photo" | "audio";
  criterionLabel?: string;
  // Photo checkpoints can optionally accept the design file itself (.stl) so
  // the portfolio gets an interactive 3D model alongside the screenshot.
  allowModel?: boolean;
  // --- v2 flow layout ---
  kind?: string; // learn | build | create | reflect — step-type chip on the card
  minutes?: number; // pacing chip: "~N min"
  actions?: string[]; // numbered, tappable do-this checklist
  tip?: string; // 💡 callout under the content
  warn?: string; // ⚠️ callout under the content
  track?: TrackId; // show this block only on the matching track
};

// The difficulty tracks a module can split into (playbook: three tracks, one
// room). A `trackpick` block renders the chooser; blocks tagged with `track`
// only appear on that track, so the tutorial reshapes itself per learner.
const TRACKS: { id: TrackId; icon: string; name: string; blurb: string }[] = [
  { id: "beginner", icon: "🟢", name: "Beginner", blurb: "Scratch — drag-and-drop blocks. New to coding? Start here." },
  { id: "intermediate", icon: "🟡", name: "Intermediate", blurb: "Web — real HTML, CSS & JavaScript in the browser." },
  { id: "advanced", icon: "🔴", name: "Advanced", blurb: "Swift Playgrounds — a real programming language." },
];

const KIND_CHIP: Record<string, { label: string; color: string }> = {
  learn: { label: "📖 Learn", color: "var(--info-text)" },
  build: { label: "🔨 Build", color: "var(--accent)" },
  create: { label: "🎨 Create", color: "var(--accent)" },
  reflect: { label: "💭 Reflect", color: "var(--warn-text, var(--body))" },
};
type Step = { heading?: string; block: Block };
type Crit = { id: string; label: string; status: string };
type EvidenceRow = { criterionId: string | null; type: string; url: string | null };

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
  if (pendingHeading) steps.push({ heading: pendingHeading, block: { type: "text", text: "" } });
  return steps;
}

function readDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// ---------------------------------------------------------------------------
// Checkpoint capture widgets
// ---------------------------------------------------------------------------

function PhotoCheckpoint({
  done,
  preview,
  busy,
  onFile,
}: {
  done: boolean;
  preview: string | null;
  busy: boolean;
  onFile: (f: File) => void;
}) {
  return (
    <div className="mt-4 flex flex-col items-start gap-3">
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="Your photo"
          className="max-h-56 rounded-xl border border-[var(--border-soft)]"
        />
      )}
      {done ? (
        <span className="pill pill-done">Photo saved ✓</span>
      ) : (
        <label className={`btn-primary flex h-12 cursor-pointer items-center px-6 text-sm ${busy ? "opacity-40" : ""}`}>
          {busy ? "Uploading…" : "📸 Take / choose photo"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={busy}
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          />
        </label>
      )}
    </div>
  );
}

// Numbered, tappable checklist — the "do this now" heart of a build step.
// Ticking items is local-only (satisfying, not graded); when everything's
// ticked the list celebrates and the learner knows they're ready to move on.
function ActionList({ items }: { items: string[] }) {
  const [ticked, setTicked] = useState<Set<number>>(new Set());
  const allDone = ticked.size === items.length;

  function toggle(i: number) {
    setTicked((t) => {
      const next = new Set(t);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <div className="mt-4 flex flex-col gap-2">
      {items.map((item, i) => {
        const on = ticked.has(i);
        return (
          <motion.button
            key={i}
            type="button"
            onClick={() => toggle(i)}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.2 }}
            className="flex items-start gap-3 rounded-xl border p-3 text-left transition-colors"
            style={{
              borderColor: on ? "var(--accent-border)" : "var(--border-soft)",
              background: on ? "var(--accent-soft)" : "var(--tile)",
            }}
          >
            <motion.span
              animate={{ scale: on ? [1, 1.25, 1] : 1 }}
              transition={{ duration: 0.25 }}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold"
              style={{
                background: on ? "var(--accent)" : "var(--card)",
                color: on ? "var(--bg)" : "var(--faint)",
                border: on ? "none" : "1px solid var(--border)",
                fontFamily: "var(--font-grotesk)",
              }}
            >
              {on ? "✓" : i + 1}
            </motion.span>
            <span
              className="pt-0.5 text-sm leading-relaxed"
              style={{ color: on ? "var(--faint)" : "var(--body)" }}
            >
              {item}
            </span>
          </motion.button>
        );
      })}
      {allDone && items.length > 1 && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-semibold"
          style={{ color: "var(--accent)" }}
        >
          All done — keep going! →
        </motion.p>
      )}
    </div>
  );
}

// 💡 / ⚠️ callouts that sit under a card's main content.
function Callout({ flavor, text }: { flavor: "tip" | "warn"; text: string }) {
  const warn = flavor === "warn";
  return (
    <div
      className="mt-4 flex items-start gap-2.5 rounded-xl border-l-2 p-3.5 text-sm leading-relaxed"
      style={{
        borderColor: warn ? "#f2b84d" : "var(--accent)",
        background: warn ? "rgba(242,184,77,0.07)" : "var(--accent-soft)",
        color: "var(--body)",
      }}
    >
      <span className="shrink-0">{warn ? "⚠️" : "💡"}</span>
      <span>{text}</span>
    </div>
  );
}

// Optional add-on for photo checkpoints: attach the exported .stl design file
// so the portfolio can show an interactive, spinnable 3D model of the actual
// object — not just a screenshot.
function ModelAttach({ moduleId }: { moduleId: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function onFile(file: File) {
    setState("busy");
    try {
      const dataUrl = await readDataUrl(file);
      const res = await fetch("/api/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId,
          type: "FILE",
          dataUrl,
          caption: `3D model file: ${file.name}`,
        }),
      });
      if (!res.ok) throw new Error();
      setState("done");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return <span className="pill pill-done mt-3">3D model attached ✓ — it&apos;ll spin in your portfolio!</span>;
  }
  return (
    <div className="mt-3">
      <label className="btn-ghost inline-flex h-11 cursor-pointer items-center px-4 text-sm">
        🧊 {state === "busy" ? "Attaching…" : "Bonus: attach your .stl file"}
        <input
          type="file"
          accept=".stl"
          className="hidden"
          disabled={state === "busy"}
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
      </label>
      {state === "error" && (
        <p className="mt-2 text-sm" style={{ color: "var(--danger)" }}>
          Couldn&apos;t attach the file — try again.
        </p>
      )}
    </div>
  );
}

// Minimal Web Speech API surface (not in TS's DOM lib on all targets). Used
// for a live transcript while recording, so voice notes are readable even
// when no server-side transcription key is configured.
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult:
    | ((e: {
        resultIndex: number;
        results: { length: number; [i: number]: { isFinal: boolean; 0: { transcript: string } } };
      }) => void)
    | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function newSpeechRecognition(): SpeechRecognitionLike | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

function AudioCheckpoint({
  done,
  savedUrl,
  busy,
  onRecorded,
}: {
  done: boolean;
  savedUrl: string | null;
  busy: boolean;
  onRecorded: (blob: Blob, mimeType: string, transcript: string) => void;
}) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognizerRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptRef = useRef("");
  const listeningRef = useRef(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [preview, setPreview] = useState<{
    url: string;
    blob: Blob;
    mime: string;
    transcript: string;
  } | null>(null);
  const [micFailed, setMicFailed] = useState(false);

  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);

  useEffect(() => {
    return () => {
      recorderRef.current?.stream.getTracks().forEach((tr) => tr.stop());
    };
  }, []);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ["audio/mp4", "audio/webm", "audio/ogg"].find((m) =>
        typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m),
      );
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      rec.onstop = () => {
        const type = rec.mimeType || mime || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        setPreview({
          url: URL.createObjectURL(blob),
          blob,
          mime: type,
          transcript: transcriptRef.current.trim(),
        });
        stream.getTracks().forEach((tr) => tr.stop());
      };
      recorderRef.current = rec;
      startTranscription();
      rec.start();
      setSeconds(0);
      setRecording(true);
    } catch {
      setMicFailed(true);
    }
  }

  // Live transcript while recording. Best-effort: where the Web Speech API is
  // missing (some tablets), the server-side transcription still covers it.
  function startTranscription() {
    transcriptRef.current = "";
    const recog = newSpeechRecognition();
    if (!recog) return;
    recog.continuous = true;
    recog.interimResults = false;
    recog.lang = "en-US";
    recog.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) transcriptRef.current += e.results[i][0].transcript + " ";
      }
    };
    // Chrome ends recognition after silence — restart while still recording.
    recog.onend = () => {
      if (!listeningRef.current) return;
      try {
        recog.start();
      } catch {
        listeningRef.current = false;
      }
    };
    listeningRef.current = true;
    try {
      recog.start();
      recognizerRef.current = recog;
    } catch {
      listeningRef.current = false;
    }
  }

  function stop() {
    listeningRef.current = false;
    recognizerRef.current?.stop();
    recorderRef.current?.stop();
    setRecording(false);
  }

  if (done) {
    return (
      <div className="mt-4 flex flex-col items-start gap-3">
        {savedUrl && <audio controls src={savedUrl} className="w-full max-w-sm" />}
        <span className="pill pill-done">Voice note saved ✓</span>
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col items-start gap-3">
      {preview ? (
        <>
          <audio controls src={preview.url} className="w-full max-w-sm" />
          <div className="flex gap-2">
            <button
              onClick={() => onRecorded(preview.blob, preview.mime, preview.transcript)}
              disabled={busy}
              className="btn-primary h-11 px-5 text-sm"
            >
              {busy ? "Saving…" : "Use this recording"}
            </button>
            <button
              onClick={() => setPreview(null)}
              disabled={busy}
              className="btn-ghost h-11 px-4 text-sm"
            >
              Record again
            </button>
          </div>
        </>
      ) : recording ? (
        <button onClick={stop} className="btn-primary h-12 px-6 text-sm" style={{ background: "var(--danger)" }}>
          ⏹ Stop ({seconds}s)
        </button>
      ) : (
        <button onClick={start} disabled={micFailed} className="btn-primary h-12 px-6 text-sm">
          🎙️ Record your answer
        </button>
      )}
      {micFailed && (
        <p className="text-sm" style={{ color: "var(--danger)" }}>
          Microphone isn&apos;t available on this device — ask your instructor for help.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tutorial
// ---------------------------------------------------------------------------

export default function Tutorial({
  moduleId,
  badge,
  blocks,
  criteria: initialCriteria,
  evidence: initialEvidence,
  initialComplete,
  hasSubmission,
}: {
  moduleId: string;
  badge: { name: string; icon: string };
  blocks: Block[];
  criteria: Crit[];
  evidence: EvidenceRow[];
  initialComplete: boolean;
  hasSubmission: boolean;
}) {
  // Track choice reshapes the tutorial: blocks tagged for another track are
  // filtered out entirely, so learners only ever see their own path.
  // Persisted per-device; read in an effect to keep SSR hydration clean.
  const [track, setTrack] = useState<TrackId>("beginner");
  useEffect(() => {
    // One-shot read of the persisted choice after mount (SSR-safe).
    const stored = localStorage.getItem("laingify-track");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored === "intermediate" || stored === "advanced") setTrack(stored);
  }, []);
  function pickTrack(id: TrackId) {
    setTrack(id);
    localStorage.setItem("laingify-track", id);
  }

  const steps = useMemo(
    () => buildSteps(blocks.filter((b) => !b.track || b.track === track)),
    [blocks, track],
  );
  const trackPickIndex = steps.findIndex((s) => s.block.type === "trackpick");
  const critByLabel = new Map(initialCriteria.map((c) => [c.label, c]));

  // A checkpoint is done when evidence tagged with its criterion exists.
  const initiallyDone = new Set(
    initialEvidence.filter((e) => e.criterionId).map((e) => e.criterionId as string),
  );
  const savedMedia = new Map(
    initialEvidence
      .filter((e) => e.criterionId && e.url)
      .map((e) => [e.criterionId as string, e.url as string]),
  );

  // First visit starts at step 1. Returning learners (any checkpoint already
  // captured) resume at their first incomplete checkpoint — or the wrap-up
  // card if every checkpoint is done (the final prompt card carries the
  // reflection form inline; the separate finish card only exists for modules
  // that don't end on a prompt).
  const firstPending = steps.findIndex(
    (s) =>
      s.block.type === "checkpoint" &&
      !initiallyDone.has(critByLabel.get(s.block.criterionLabel ?? "")?.id ?? ""),
  );
  const wrapUpStep =
    steps[steps.length - 1]?.block.type === "prompt" ? steps.length - 1 : steps.length;
  const [stepRaw, setStep] = useState(() => {
    if (initialComplete || hasSubmission) return steps.length;
    if (initiallyDone.size === 0) return 0;
    return firstPending === -1 ? wrapUpStep : firstPending;
  });
  // Switching tracks can shrink the step list — clamp at render time.
  const step = Math.min(stepRaw, steps.length);
  const [done, setDone] = useState(initiallyDone);
  const [media, setMedia] = useState(savedMedia);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reflection, setReflection] = useState("");
  const [complete, setComplete] = useState(initialComplete);
  const [finished, setFinished] = useState(initialComplete || hasSubmission);
  const [feedback, setFeedback] = useState<string | null>(null);

  const atFinish = step >= steps.length;
  const current = atFinish ? null : steps[step];
  const currentCrit =
    current?.block.type === "checkpoint"
      ? critByLabel.get(current.block.criterionLabel ?? "")
      : undefined;
  const currentDone = currentCrit ? done.has(currentCrit.id) : true;

  async function capture(payload: Record<string, unknown>, criterionId: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, criterionId, ...payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save — try again.");
      setDone((d) => new Set(d).add(criterionId));
      if (typeof payload.dataUrl === "string") {
        setMedia((m) => new Map(m).set(criterionId, payload.dataUrl as string));
      }
      if (data.complete) setComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save — try again.");
    } finally {
      setBusy(false);
    }
  }

  async function onPhoto(file: File) {
    if (!currentCrit) return;
    // Shrink client-side: raw camera photos exceed the upload size limit.
    const dataUrl = await compressImage(file);
    await capture({ type: "PHOTO", dataUrl, caption: current?.block.text?.slice(0, 120) }, currentCrit.id);
  }

  async function onAudio(blob: Blob, mimeType: string, transcript: string) {
    if (!currentCrit) return;
    const dataUrl = await readDataUrl(blob);
    await capture(
      {
        type: "AUDIO",
        dataUrl,
        dataBase64: dataUrl.split(",")[1],
        mimeType,
        // Live transcript from the browser; the server upgrades it to an AI
        // transcription when a key is configured.
        text: transcript || undefined,
        caption: current?.block.text?.slice(0, 120),
      },
      currentCrit.id,
    );
  }

  async function submitReflection(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, content: reflection }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not submit — try again.");
      setFeedback(data.feedback?.summary ?? null);
      setComplete(Boolean(data.complete));
      setFinished(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit — try again.");
    } finally {
      setBusy(false);
    }
  }

  // ---- Finished view ---------------------------------------------------------
  if (finished) {
    return (
      <div className="animate-fade-up mt-8">
        <div
          className="card p-8 text-center"
          style={complete ? { borderColor: "var(--accent-border)" } : undefined}
        >
          <div className="text-5xl">{complete ? badge.icon : "🕐"}</div>
          <h2 className="mt-4 text-2xl font-semibold">
            {complete ? `You earned the ${badge.name} badge!` : "All submitted!"}
          </h2>
          <p className="muted mx-auto mt-2 max-w-md text-sm">
            {feedback ??
              (complete
                ? "Every step is done and your work is saved."
                : "Your work is in — a few checks are still finishing up.")}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a href={`/learn/${moduleId}/portfolio`} className="btn-primary h-12 px-6 text-sm">
              📖 View your portfolio
            </a>
            <a href={`/learn/${moduleId}/portfolio/download`} className="btn-ghost h-12 px-6 text-sm">
              💾 Download it
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ---- Finish (reflection) card ----------------------------------------------
  if (atFinish) {
    return (
      <div className="animate-fade-up mt-8 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex flex-1 gap-1.5">
            {steps.map((_, i) => (
              <span key={i} className="h-1 flex-1 rounded-full" style={{ background: "var(--accent)" }} />
            ))}
            <span className="h-1 flex-1 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }} />
          </div>
          <span className="mono-label shrink-0">Last step</span>
        </div>
        <form onSubmit={submitReflection} className="card p-6">
          <h2 className="text-xl font-semibold">One last thing</h2>
          <p className="muted mt-1.5 text-sm">
            Tell us about today: what did you make, and what was the trickiest part?
          </p>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            rows={4}
            placeholder="Today I…"
            className="field mt-4 w-full p-3.5 text-sm"
          />
          {error && (
            <p className="mt-2 text-sm" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          )}
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(steps.length - 1)}
              className="muted rounded-lg px-4 py-2 font-medium transition-colors hover:text-[var(--text)]"
            >
              ← Back
            </button>
            <button
              type="submit"
              disabled={busy || reflection.trim().length < 10}
              className="btn-primary h-12 px-6 text-sm"
            >
              {busy ? "Submitting…" : "Finish & build my portfolio →"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ---- Step cards ---------------------------------------------------------------
  const isCheckpoint = current!.block.type === "checkpoint";
  // When the last card is the wrap-up prompt, the reflection form lives right
  // inside it — no extra "Next" hop to a separate finish card.
  const lastIsPrompt = steps[steps.length - 1]?.block.type === "prompt";
  const isFinalPrompt = current!.block.type === "prompt" && step === steps.length - 1;
  return (
    <div className="mt-8 flex flex-col gap-4">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1.5">
          {steps.map((s, i) => (
            <span
              key={i}
              className="h-1 flex-1 rounded-full transition-all duration-500"
              style={{
                background:
                  i < step || (i === step && currentDone)
                    ? "var(--accent)"
                    : i === step
                      ? "var(--info)"
                      : "rgba(255,255,255,0.1)",
              }}
            />
          ))}
          {!lastIsPrompt && (
            <span className="h-1 flex-1 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }} />
          )}
        </div>
        <span className="mono-label shrink-0 tabular-nums">
          {step + 1} / {steps.length}
        </span>
      </div>

      {/* Card */}
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="card min-h-36 p-6"
        style={isCheckpoint ? { borderColor: "var(--info-border)" } : undefined}
      >
        {/* Step chrome: what kind of step, how long, which track */}
        {(current!.block.kind || current!.block.minutes || current!.block.track) && (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {current!.block.kind && KIND_CHIP[current!.block.kind] && (
              <span
                className="rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider"
                style={{
                  color: KIND_CHIP[current!.block.kind].color,
                  borderColor: "var(--border-soft)",
                  background: "var(--tile)",
                }}
              >
                {KIND_CHIP[current!.block.kind].label}
              </span>
            )}
            {current!.block.minutes && (
              <span className="mono-label rounded-full border border-[var(--border-soft)] bg-[var(--tile)] px-2.5 py-1 !text-[11px]">
                ⏱ ~{current!.block.minutes} min
              </span>
            )}
            {current!.block.track && trackPickIndex >= 0 && (
              <button
                onClick={() => setStep(trackPickIndex)}
                className="mono-label ml-auto rounded-full border border-[var(--border-soft)] px-2.5 py-1 !text-[11px] transition-colors hover:text-[var(--accent)]"
                title="Change track"
              >
                {TRACKS.find((t) => t.id === current!.block.track)?.icon}{" "}
                {TRACKS.find((t) => t.id === current!.block.track)?.name} track
              </button>
            )}
          </div>
        )}
        {current!.heading && <h2 className="mb-3 text-xl font-semibold">{current!.heading}</h2>}
        {current!.block.type === "trackpick" ? (
          <div>
            {current!.block.text && (
              <p className="mb-4 whitespace-pre-wrap leading-relaxed" style={{ color: "var(--body)" }}>
                {current!.block.text}
              </p>
            )}
            <div className="flex flex-col gap-3">
              {TRACKS.map((t) => {
                const selected = track === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      pickTrack(t.id);
                      setStep((s) => s + 1);
                    }}
                    className="card-interactive flex items-center gap-4 rounded-xl border p-4 text-left transition-all"
                    style={{
                      borderColor: selected ? "var(--accent-border)" : "var(--border-soft)",
                      background: selected ? "var(--accent-soft)" : "var(--tile)",
                    }}
                  >
                    <span className="text-2xl">{t.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="display block text-[15px] font-semibold">{t.name}</span>
                      <span className="muted mt-0.5 block text-[13px]">{t.blurb}</span>
                    </span>
                    {selected && <span className="pill pill-done shrink-0">Your track</span>}
                  </button>
                );
              })}
            </div>
            <p className="muted mt-3 text-[13px]">
              The tutorial reshapes itself — you&apos;ll only see steps for your track, and you can
              come back here anytime.
            </p>
          </div>
        ) : isCheckpoint ? (
          <>
            <span className="overline">
              {current!.block.capture === "audio" ? "🎙️ Say it out loud" : "📸 Show your work"}
            </span>
            <p className="mt-2 whitespace-pre-wrap leading-relaxed">{current!.block.text}</p>
            {current!.block.capture === "audio" ? (
              <AudioCheckpoint
                done={currentDone}
                savedUrl={currentCrit ? (media.get(currentCrit.id) ?? null) : null}
                busy={busy}
                onRecorded={onAudio}
              />
            ) : (
              <PhotoCheckpoint
                done={currentDone}
                preview={currentCrit ? (media.get(currentCrit.id) ?? null) : null}
                busy={busy}
                onFile={onPhoto}
              />
            )}
            {current!.block.allowModel && <ModelAttach moduleId={moduleId} />}
          </>
        ) : current!.block.type === "prompt" ? (
          <div
            className="rounded-xl border-l-2 p-4"
            style={{ borderColor: "var(--accent)", background: "var(--accent-soft)" }}
          >
            <span className="overline">Your turn</span>
            <p className="mt-2 whitespace-pre-wrap leading-relaxed">{current!.block.text}</p>
            {isFinalPrompt && (
              <form onSubmit={submitReflection} className="mt-4">
                <textarea
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  rows={4}
                  placeholder="Today I…"
                  className="field w-full p-3.5 text-sm"
                />
                {error && (
                  <p className="mt-2 text-sm" style={{ color: "var(--danger)" }}>
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={busy || reflection.trim().length < 10}
                  className="btn-primary mt-3 h-12 px-6 text-sm disabled:opacity-40"
                >
                  {busy ? "Submitting…" : "Finish & build my portfolio →"}
                </button>
              </form>
            )}
          </div>
        ) : current!.block.type === "scratch" && current!.block.text ? (
          <ScratchBlocks code={current!.block.text} />
        ) : current!.block.type === "embed" && current!.block.url ? (
          <div>
            <iframe
              src={current!.block.url}
              className="h-[440px] w-full rounded-xl border border-[var(--border-soft)]"
              allow="fullscreen"
              loading="lazy"
            />
            {current!.block.text && <p className="muted mt-2 text-[13px]">{current!.block.text}</p>}
          </div>
        ) : current!.block.type === "circuit" && current!.block.hex ? (
          <CircuitSim
            parts={current!.block.parts}
            wires={current!.block.wires}
            steps={current!.block.steps}
            hex={current!.block.hex}
            sketch={current!.block.sketch}
            text={current!.block.text}
          />
        ) : current!.block.type === "knex" && current!.block.builds ? (
          <KnexViewer steps={current!.block.builds} text={current!.block.text} />
        ) : current!.block.type === "code" ? (
          <pre
            className="overflow-x-auto rounded-xl border p-4 text-[13px] leading-relaxed"
            style={{
              borderColor: "var(--border-soft)",
              background: "var(--tile)",
              color: "var(--body)",
              fontFamily: "ui-monospace, Menlo, monospace",
            }}
          >
            {current!.block.text}
          </pre>
        ) : current!.block.type === "video" && current!.block.url ? (
          <video controls src={current!.block.url} className="w-full rounded-xl" />
        ) : current!.block.type === "slides" && current!.block.urls?.length ? (
          <SlideShow urls={current!.block.urls} caption={current!.block.text} />
        ) : current!.block.type === "image" && current!.block.url ? (
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current!.block.url}
              alt={current!.block.text ?? "Tutorial illustration"}
              className="w-full rounded-xl border border-[var(--border-soft)]"
            />
            {current!.block.text && (
              <figcaption className="muted mt-2 text-[13px]">{current!.block.text}</figcaption>
            )}
          </figure>
        ) : (
          <>
            {/* Text cards can lead with a visual — the text becomes the caption. */}
            {current!.block.url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={current!.block.url}
                alt=""
                className="mb-4 w-full rounded-xl border border-[var(--border-soft)] bg-white"
              />
            )}
            <p className="whitespace-pre-wrap leading-relaxed" style={{ color: "var(--body)" }}>
              {current!.block.text}
            </p>
          </>
        )}
        {/* v2 extras: any non-checkpoint block can carry a checklist + callouts */}
        {!isCheckpoint && current!.block.actions && current!.block.actions.length > 0 && (
          <ActionList key={`actions-${step}`} items={current!.block.actions} />
        )}
        {current!.block.tip && <Callout flavor="tip" text={current!.block.tip} />}
        {current!.block.warn && <Callout flavor="warn" text={current!.block.warn} />}
        {error && (
          <p className="mt-3 text-sm" style={{ color: "var(--danger)" }}>
            {error}
          </p>
        )}
      </motion.div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="muted rounded-lg px-4 py-2 font-medium transition-colors enabled:hover:text-[var(--text)] disabled:opacity-40"
        >
          ← Back
        </button>
        {isFinalPrompt ? (
          <span className="muted text-sm">Write your wrap-up above to finish ↑</span>
        ) : (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!currentDone}
            className="btn-primary px-5 py-2.5 text-sm disabled:opacity-40"
            title={currentDone ? undefined : "Complete this step to continue"}
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
}
