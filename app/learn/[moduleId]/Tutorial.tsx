"use client";

import { useEffect, useRef, useState } from "react";

// Step-by-step tutorial player for checkpoint modules (camp format).
// Content advances one card at a time; checkpoint cards ask for a photo/
// screenshot or a voice note and gate "Next" until captured. The final card
// collects a short written wrap-up, and completion unlocks the portfolio.

type Block = {
  type: string; // heading | text | prompt | video | image | checkpoint
  text?: string;
  url?: string;
  capture?: "photo" | "audio";
  criterionLabel?: string;
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

function AudioCheckpoint({
  done,
  savedUrl,
  busy,
  onRecorded,
}: {
  done: boolean;
  savedUrl: string | null;
  busy: boolean;
  onRecorded: (blob: Blob, mimeType: string) => void;
}) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [preview, setPreview] = useState<{ url: string; blob: Blob; mime: string } | null>(null);
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
        setPreview({ url: URL.createObjectURL(blob), blob, mime: type });
        stream.getTracks().forEach((tr) => tr.stop());
      };
      recorderRef.current = rec;
      rec.start();
      setSeconds(0);
      setRecording(true);
    } catch {
      setMicFailed(true);
    }
  }

  function stop() {
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
              onClick={() => onRecorded(preview.blob, preview.mime)}
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
  const steps = buildSteps(blocks);
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
  // captured) resume at their first incomplete checkpoint — or the finish
  // card if every checkpoint is done.
  const firstPending = steps.findIndex(
    (s) =>
      s.block.type === "checkpoint" &&
      !initiallyDone.has(critByLabel.get(s.block.criterionLabel ?? "")?.id ?? ""),
  );
  const [step, setStep] = useState(() => {
    if (initialComplete || hasSubmission) return steps.length;
    if (initiallyDone.size === 0) return 0;
    return firstPending === -1 ? steps.length : firstPending;
  });
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
    const dataUrl = await readDataUrl(file);
    await capture({ type: "PHOTO", dataUrl, caption: current?.block.text?.slice(0, 120) }, currentCrit.id);
  }

  async function onAudio(blob: Blob, mimeType: string) {
    if (!currentCrit) return;
    const dataUrl = await readDataUrl(blob);
    await capture(
      {
        type: "AUDIO",
        dataUrl,
        dataBase64: dataUrl.split(",")[1],
        mimeType,
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
          <div className="mt-6 flex justify-center gap-3">
            <a href={`/learn/${moduleId}/portfolio`} className="btn-primary h-12 px-6 text-sm">
              📖 View & download your portfolio
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
          <span className="h-1 flex-1 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }} />
        </div>
        <span className="mono-label shrink-0 tabular-nums">
          {step + 1} / {steps.length}
        </span>
      </div>

      {/* Card */}
      <div
        className="card min-h-36 p-6"
        style={isCheckpoint ? { borderColor: "var(--info-border)" } : undefined}
      >
        {current!.heading && <h2 className="mb-3 text-xl font-semibold">{current!.heading}</h2>}
        {isCheckpoint ? (
          <>
            <span className="overline">
              {current!.block.capture === "audio" ? "🎙️ Say it out loud" : "📸 Show your work"}
            </span>
            <p className="mt-2 leading-relaxed">{current!.block.text}</p>
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
          </>
        ) : current!.block.type === "prompt" ? (
          <div
            className="rounded-xl border-l-2 p-4"
            style={{ borderColor: "var(--accent)", background: "var(--accent-soft)" }}
          >
            <span className="overline">Your turn</span>
            <p className="mt-2 leading-relaxed">{current!.block.text}</p>
          </div>
        ) : current!.block.type === "video" && current!.block.url ? (
          <video controls src={current!.block.url} className="w-full rounded-xl" />
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
          <p className="leading-relaxed" style={{ color: "var(--body)" }}>
            {current!.block.text}
          </p>
        )}
        {error && (
          <p className="mt-3 text-sm" style={{ color: "var(--danger)" }}>
            {error}
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="muted rounded-lg px-4 py-2 font-medium transition-colors enabled:hover:text-[var(--text)] disabled:opacity-40"
        >
          ← Back
        </button>
        <button
          onClick={() => setStep((s) => s + 1)}
          disabled={!currentDone}
          className="btn-primary px-5 py-2.5 text-sm disabled:opacity-40"
          title={currentDone ? undefined : "Complete this step to continue"}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
