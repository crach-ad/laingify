"use client";

import { useState } from "react";
import CameraPhotoButton from "@/app/learn/CameraPhotoButton";

// ---------------------------------------------------------------------------
// Types mirror the server's evaluateModule() / route responses.
// ---------------------------------------------------------------------------
type Crit = {
  id: string;
  label: string;
  description: string;
  checkType: string;
  required: boolean;
  requiresEvidenceType: string | null;
  status: string; // NOT_STARTED | IN_PROGRESS | MET
  decidedBy: string | null;
};
type EvidenceItem = {
  id: string;
  type: string;
  text: string | null;
  url: string | null;
  caption: string | null;
};
type Feedback = {
  summary: string;
  metIds: string[];
  missingIds: string[];
  nextSteps: string;
  aiUsed: boolean;
};
type Msg = { id: string; authorRole: string; body: string };
type Thread = { id: string; seed: string | null; messages: Msg[] };
type Badge = { name: string; icon: string; description: string };

const STATUS_PILL: Record<string, string> = {
  MET: "pill-done",
  IN_PROGRESS: "pill-warn",
  NOT_STARTED: "pill-idle",
};
const STATUS_LABEL: Record<string, string> = {
  MET: "Met",
  IN_PROGRESS: "Started",
  NOT_STARTED: "To do",
};

function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function ModuleWorkspace({
  moduleId,
  badge,
  spriteName,
  initialCriteria,
  initialEvidence,
  initialFeedback,
  initialThreads,
  initialComplete,
  initialProject,
}: {
  moduleId: string;
  badge: Badge;
  spriteName: string;
  initialCriteria: Crit[];
  initialEvidence: EvidenceItem[];
  initialFeedback: Feedback | null;
  initialThreads: Thread[];
  initialComplete: boolean;
  initialProject: { summary: string } | null;
}) {
  const [criteria, setCriteria] = useState(initialCriteria);
  const [evidence, setEvidence] = useState(initialEvidence);
  const [feedback, setFeedback] = useState(initialFeedback);
  const [threads, setThreads] = useState(initialThreads);
  const [complete, setComplete] = useState(initialComplete);
  const [project, setProject] = useState(initialProject);

  const [answer, setAnswer] = useState("");
  const [evidenceText, setEvidenceText] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  function applyResult(data: {
    criteria?: Crit[];
    complete?: boolean;
    project?: { summary: string } | null;
  }) {
    if (data.criteria) setCriteria(data.criteria);
    if (typeof data.complete === "boolean") setComplete(data.complete);
    if (data.project) setProject(data.project);
  }

  async function submitAnswer() {
    if (!answer.trim()) return;
    setBusy("answer");
    setError("");
    try {
      const res = await fetch("/api/submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, content: answer }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not submit.");
      setFeedback(data.feedback);
      applyResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  async function addTextEvidence() {
    if (!evidenceText.trim()) return;
    setBusy("evidence-text");
    setError("");
    try {
      const res = await fetch("/api/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, type: "TEXT", text: evidenceText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not add evidence.");
      setEvidence((e) => [
        ...e,
        { id: data.evidence?.id ?? crypto.randomUUID(), type: "TEXT", text: evidenceText, url: null, caption: null },
      ]);
      setEvidenceText("");
      applyResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  async function uploadFile(file: File, kind: "PHOTO" | "AUDIO") {
    setBusy(`file-${kind}`);
    setError("");
    try {
      const dataUrl = await readDataUrl(file);
      const dataBase64 = kind === "AUDIO" ? dataUrl.split(",")[1] : undefined;
      const res = await fetch("/api/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId,
          type: kind,
          dataUrl: kind === "PHOTO" ? dataUrl : undefined,
          dataBase64,
          mimeType: kind === "AUDIO" ? file.type : undefined,
          caption: file.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not upload.");
      setEvidence((e) => [
        ...e,
        {
          id: data.evidence?.id ?? crypto.randomUUID(),
          type: kind,
          text: null,
          url: kind === "PHOTO" ? dataUrl : null,
          caption: file.name,
        },
      ]);
      applyResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(null);
    }
  }

  // Lets a learner remove a wrongly-picked upload (e.g. the wrong file from
  // Finder) so they can pick the correct one instead.
  async function removeEvidence(id: string) {
    setBusy(`remove-${id}`);
    setError("");
    try {
      const res = await fetch("/api/evidence", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not remove — try again.");
      setEvidence((e) => e.filter((item) => item.id !== id));
      applyResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not remove — try again.");
    } finally {
      setBusy(null);
    }
  }

  async function discuss(message: string, opts: { threadId?: string; seed?: string }) {
    setBusy(`discuss-${opts.threadId ?? "new"}`);
    setError("");
    try {
      const res = await fetch("/api/discussion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, message, ...opts }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send.");
      setThreads((prev) => {
        const others = prev.filter((t) => t.id !== data.threadId);
        const seed = prev.find((t) => t.id === data.threadId)?.seed ?? opts.seed ?? null;
        return [...others, { id: data.threadId, seed, messages: data.messages }];
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  const hasTextCriteria = criteria.some((c) => !c.requiresEvidenceType && c.checkType !== "RUBRIC");
  const needsPhoto = criteria.some((c) => c.requiresEvidenceType === "PHOTO");

  return (
    <div className="mt-8 flex flex-col gap-8">
      {error && (
        <p
          className="rounded-xl border px-4 py-3 text-sm"
          style={{ borderColor: "var(--danger-border)", background: "var(--danger-soft)", color: "var(--danger)" }}
        >
          {error}
        </p>
      )}

      {/* Completion / badge */}
      {complete && (
        <div
          className="animate-fade-up card p-6 text-center"
          style={{ borderColor: "rgba(182,242,77,0.28)", background: "rgba(182,242,77,0.06)" }}
        >
          <div
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl text-5xl"
            style={{ background: "rgba(182,242,77,0.14)" }}
          >
            {badge.icon}
          </div>
          <h2 className="mt-4 text-2xl font-semibold">
            Badge earned: <span style={{ color: "var(--accent)" }}>{badge.name}</span>
          </h2>
          {project && <p className="muted mt-2 text-sm">{project.summary}</p>}
        </div>
      )}

      {/* Criteria checklist */}
      <section>
        <h2 className="text-lg font-semibold">What to complete</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {criteria.map((c) => (
            <li key={c.id} className="card flex items-start gap-3 p-4">
              <span className={`pill mt-0.5 shrink-0 text-xs ${STATUS_PILL[c.status]}`}>
                {STATUS_LABEL[c.status]}
              </span>
              <span className="flex-1">
                <span className="block font-medium" style={{ color: "var(--heading)" }}>
                  {c.label}
                </span>
                {c.description && <span className="muted block text-sm">{c.description}</span>}
                {c.checkType === "RUBRIC" && (
                  <span className="mono-label mt-1.5 block normal-case tracking-normal">
                    Your instructor reviews this one.
                  </span>
                )}
                {c.checkType === "HYBRID" && c.status === "IN_PROGRESS" && (
                  <span className="mt-1.5 block text-xs" style={{ color: "var(--warn)" }}>
                    Looks good — awaiting instructor confirmation.
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Written answer + auto-feedback */}
      {hasTextCriteria && (
        <section>
          <h2 className="text-lg font-semibold">Show what you know</h2>
          <p className="muted text-sm">Write your response and get instant, friendly feedback.</p>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={5}
            placeholder="Type your answer here…"
            className="field mt-3 w-full px-4 py-3"
          />
          <button
            onClick={submitAnswer}
            disabled={busy === "answer" || !answer.trim()}
            className="btn-primary mt-2 px-5 py-2.5 text-sm"
          >
            {busy === "answer" ? "Checking…" : "Get feedback"}
          </button>

          {feedback && (
            <div
              className="card animate-fade-up mt-4 border-l-2 p-4"
              style={{ borderLeftColor: "var(--accent)" }}
            >
              <p className="font-medium" style={{ color: "var(--heading)" }}>
                {feedback.summary}
              </p>
              {feedback.nextSteps && (
                <p className="muted mt-2 text-sm">
                  <span className="font-semibold" style={{ color: "var(--text)" }}>
                    Next steps:{" "}
                  </span>
                  {feedback.nextSteps}
                </p>
              )}
              <button
                onClick={() => discuss("I'd like help with the feedback I just got.", { seed: feedback.summary })}
                disabled={busy?.startsWith("discuss")}
                className="btn-ghost mt-3 px-4 py-1.5 text-sm"
              >
                Talk it through with {spriteName}
              </button>
            </div>
          )}
        </section>
      )}

      {/* Evidence */}
      <section>
        <h2 className="text-lg font-semibold">Add evidence</h2>
        <p className="muted text-sm">
          Show your work with a note, a photo{needsPhoto ? " (a photo is required here)" : ""}, or an audio
          recording.
        </p>

        <div className="mt-3 flex flex-wrap gap-3">
          <CameraPhotoButton
            triggerLabel="Photo"
            triggerBusyLabel="Uploading…"
            triggerClassName="btn-ghost px-4 py-2 text-sm"
            busy={busy === "file-PHOTO"}
            onFile={(f) => uploadFile(f, "PHOTO")}
          />
          <label className="btn-ghost cursor-pointer px-4 py-2 text-sm">
            {busy === "file-AUDIO" ? "Transcribing…" : "Audio"}
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "AUDIO")}
            />
          </label>
        </div>

        <div className="mt-3 flex gap-2">
          <input
            value={evidenceText}
            onChange={(e) => setEvidenceText(e.target.value)}
            placeholder="…or add a quick note"
            className="field flex-1 px-4 py-2"
          />
          <button
            onClick={addTextEvidence}
            disabled={busy === "evidence-text" || !evidenceText.trim()}
            className="btn-ghost px-4 py-2 text-sm font-semibold"
          >
            Add
          </button>
        </div>

        {evidence.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {evidence.map((ev) => (
              <div key={ev.id} className="card animate-fade-up relative overflow-hidden text-sm">
                <button
                  type="button"
                  onClick={() => removeEvidence(ev.id)}
                  disabled={busy === `remove-${ev.id}`}
                  aria-label="Remove this evidence"
                  title="Remove"
                  className="absolute right-1.5 top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold disabled:opacity-40"
                  style={{ background: "rgba(0,0,0,0.55)", color: "#fff" }}
                >
                  {busy === `remove-${ev.id}` ? "…" : "✕"}
                </button>
                {ev.type === "PHOTO" && ev.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ev.url} alt={ev.caption ?? "evidence"} className="h-28 w-full object-cover" />
                ) : (
                  <div className="p-3">
                    <span className="mono-label" style={{ color: "var(--accent)" }}>
                      {ev.type}
                    </span>
                    <p className="mt-1 line-clamp-4" style={{ color: "var(--body)" }}>
                      {ev.text || ev.caption || "—"}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Discussions */}
      {threads.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold">Your discussions</h2>
          <div className="mt-3 flex flex-col gap-4">
            {threads
              .slice()
              .sort((a, b) => a.id.localeCompare(b.id))
              .map((t) => (
                <ThreadView
                  key={t.id}
                  thread={t}
                  spriteName={spriteName}
                  busy={busy === `discuss-${t.id}`}
                  onSend={(msg) => discuss(msg, { threadId: t.id })}
                />
              ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ThreadView({
  thread,
  spriteName,
  busy,
  onSend,
}: {
  thread: Thread;
  spriteName: string;
  busy: boolean;
  onSend: (msg: string) => void;
}) {
  const [draft, setDraft] = useState("");
  return (
    <div className="card p-4">
      {thread.seed && (
        <p
          className="muted mb-3 border-l-2 pl-3 text-xs italic"
          style={{ borderColor: "var(--accent-border)" }}
        >
          {thread.seed}
        </p>
      )}
      <div className="flex flex-col gap-2">
        {thread.messages.map((m) => (
          <div key={m.id} className={m.authorRole === "LEARNER" ? "text-right" : "text-left"}>
            <span
              className="inline-block max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm"
              style={
                m.authorRole === "LEARNER"
                  ? { background: "var(--accent)", color: "var(--bg)", fontWeight: 500 }
                  : m.authorRole === "INSTRUCTOR"
                    ? {
                        background: "var(--info-soft)",
                        color: "var(--info-text)",
                        border: "1px solid var(--info-border)",
                      }
                    : { background: "var(--tile)", border: "1px solid var(--border-soft)", color: "var(--text)" }
              }
            >
              {m.authorRole === "SPRITE" && <span className="mr-1 font-semibold">{spriteName}:</span>}
              {m.authorRole === "INSTRUCTOR" && <span className="mr-1 font-semibold">Instructor:</span>}
              {m.body}
            </span>
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (draft.trim()) {
            onSend(draft.trim());
            setDraft("");
          }
        }}
        className="mt-3 flex gap-2"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Reply…"
          className="field flex-1 px-4 py-2 text-sm"
        />
        <button type="submit" disabled={busy || !draft.trim()} className="btn-primary px-4 py-2 text-sm">
          Send
        </button>
      </form>
    </div>
  );
}
