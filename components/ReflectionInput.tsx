'use client';
import { useState } from 'react';
import AudioCheckpoint from './AudioCheckpoint';

export default function ReflectionInput({ value, onChange, audioUrl, onAudio, mode, onMode, busy }: {
  value: string; onChange: (value: string) => void;
  audioUrl: string | null; onAudio: (value: string | null) => void;
  mode: 'type' | 'record'; onMode: (value: 'type' | 'record') => void; busy: boolean;
}) {
  const [error, setError] = useState('');
  async function recorded(blob: Blob) {
    if (blob.size > 2_900_000) { setError('Please record a shorter answer (under about 3 MB).'); return; }
    const reader = new FileReader();
    reader.onload = () => { onAudio(String(reader.result)); setError(''); };
    reader.onerror = () => setError('Could not read the recording. Please try again.');
    reader.readAsDataURL(blob);
  }
  return <div className="mt-3">
    <div className="mb-3 flex gap-2" role="group" aria-label="Reflection format">
      <button type="button" className="btn-ghost px-4 py-2" aria-pressed={mode === 'record'} disabled={busy} onClick={() => onMode('record')}>Record</button>
      <button type="button" className="btn-ghost px-4 py-2" aria-pressed={mode === 'type'} disabled={busy} onClick={() => onMode('type')}>Type</button>
    </div>
    {mode === 'type' ? <textarea aria-label="Written reflection" value={value} onChange={e => onChange(e.target.value)} rows={4} placeholder="Today I…" disabled={busy} className="field w-full p-3.5 text-sm" /> : <>
      {audioUrl ? <><audio controls src={audioUrl} className="w-full" /><button type="button" className="btn-ghost mt-2 px-4 py-2" disabled={busy} onClick={() => onAudio(null)}>Record again</button><p className="muted mt-2 text-sm">Recording ready. Submit below to save your reflection.</p></> : <AudioCheckpoint done={false} savedUrl={null} busy={busy} onRecorded={recorded} />}
    </>}
    {error && <p role="alert" className="mt-2 text-sm">{error}</p>}
  </div>;
}
