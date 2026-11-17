'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeletePhoto({ learnerId, moduleId, evidenceId }: { learnerId: string; moduleId: string; evidenceId: string }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const active = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function remove() {
    if (active.current) return;
    active.current = true; setBusy(true); setError(''); dialog.current?.close();
    try {
      const response = await fetch('/api/instruct/evidence/photo', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ learnerId, moduleId, evidenceId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not delete the photo.');
      router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not delete the photo.'); }
    finally { active.current = false; setBusy(false); }
  }
  return <div className="mt-3">
    <button type="button" className="btn-ghost min-h-11 px-4" disabled={busy} onClick={() => dialog.current?.showModal()}>{busy ? 'Deleting…' : 'Delete photo'}</button>
    <dialog ref={dialog} aria-label="Delete this photo?" className="m-auto max-w-lg rounded-xl border border-[var(--border-soft)] bg-[var(--card)] p-6 text-[var(--text)] backdrop:bg-black/60">
      <h2 className="text-xl font-semibold">Delete this photo?</h2>
      <p className="mt-3 text-sm">This permanently removes only this photo. The student can upload a replacement. Reflections and other photos are preserved.</p>
      <div className="mt-5 flex gap-3"><button type="button" autoFocus className="btn-ghost min-h-11 px-4" onClick={() => dialog.current?.close()}>Cancel</button><button type="button" className="btn-primary min-h-11 px-4" disabled={busy} onClick={remove}>Confirm delete</button></div>
    </dialog>
    {error && <p role="alert" className="mt-2 text-sm">{error}</p>}
  </div>;
}
