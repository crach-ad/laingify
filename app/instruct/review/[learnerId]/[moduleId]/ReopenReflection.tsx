'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ReopenReflection({ learnerId, moduleId, submissionId, evidenceId, format = "written" }: { learnerId: string; moduleId: string; submissionId: string | null; evidenceId?: string; format?: "audio" | "written" }) {
  const router = useRouter();
  const active = useRef(false);
  const confirmation = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function reopen() {
    if (active.current || (!submissionId && !evidenceId)) return;
    confirmation.current?.close();
    active.current = true; setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch(evidenceId ? '/api/instruct/reflection/audio' : '/api/instruct/reflection/reopen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ learnerId, moduleId, submissionId, evidenceId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not reopen the reflection.');
      setMessage(data.awaitingRewrite ? 'Reflection reopened. Awaiting rewritten reflection.' : 'This request was already completed. The replacement reflection has been preserved.');
      router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not reopen the reflection. Please try again.'); }
    finally { active.current = false; setBusy(false); }
  }
  return <div className="mt-4">
    {(submissionId || evidenceId) && <button type="button" className="btn-primary min-h-11 px-5 py-2 text-sm" disabled={busy} onClick={() => confirmation.current?.showModal()}>{busy ? 'Reopening…' : format === 'audio' ? 'Reset audio reflection' : 'Reset written reflection'}</button>}
    <dialog ref={confirmation} aria-labelledby="reopen-title" aria-describedby="reopen-description" className="m-auto max-w-lg rounded-xl border border-[var(--border-soft)] bg-[var(--card)] p-6 text-[var(--text)] backdrop:bg-black/60">
      <h2 id="reopen-title" className="text-xl font-semibold">Reopen reflection?</h2>
      <p id="reopen-description" className="mt-3 text-sm leading-relaxed">{evidenceId ? 'The selected response format will be reset for this reflection checkpoint so the learner can respond again. Photos, other checkpoints, and the other response format will be preserved.' : 'The current reflection and its automated feedback will be removed so the learner can rewrite it. Uploaded evidence, lesson progress, and other submissions will be preserved.'}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" autoFocus className="btn-ghost min-h-11 px-4" onClick={() => confirmation.current?.close()}>Cancel</button>
        <button type="button" className="btn-primary min-h-11 px-4" onClick={reopen} disabled={busy}>Confirm reopen</button>
      </div>
    </dialog>
    {message && <p role="status" className="mt-2 text-sm">{message}</p>}
    {error && <p role="alert" className="mt-2 text-sm text-[var(--danger)]">{error} <button type="button" className="underline" onClick={() => router.refresh()}>Refresh review</button></p>}
  </div>;
}
