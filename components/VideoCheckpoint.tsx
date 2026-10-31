'use client';
import { useState } from 'react';

type Saved = { id: string; url: string };
export default function VideoCheckpoint({ moduleId, criterionId, savedUrl, onSaved }: { moduleId: string; criterionId: string; savedUrl: string | null; onSaved: (e: Saved) => void }) {
  const [busy, setBusy] = useState(false), [progress, setProgress] = useState(0), [error, setError] = useState('');
  async function api(body: object) {
    const r = await fetch('/api/evidence/video', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Could not save the video.');
    return data;
  }
  async function upload(file: File) {
    setError('');
    const mime = file.type || (/\.mov$/i.test(file.name) ? 'video/quicktime' : /\.mp4$/i.test(file.name) ? 'video/mp4' : /\.webm$/i.test(file.name) ? 'video/webm' : '');
    if (!['video/mp4','video/webm','video/quicktime'].includes(mime) || file.size > 50 * 1024 * 1024 || !file.size) { setError('Choose an MP4, WebM, or MOV video up to 50 MB.'); return; }
    setBusy(true); setProgress(0);
    try {
      const start = await api({ action: 'start', moduleId, criterionId, size: file.size, mime, name: file.name });
      await new Promise<void>((resolve, reject) => {
        const x = new XMLHttpRequest();
        x.open('PUT', start.uploadUrl); x.setRequestHeader('Content-Type', mime); x.timeout = 600000;
        x.upload.onprogress = e => { if (e.lengthComputable) setProgress(Math.round(e.loaded / e.total * 100)); };
        x.onload = () => x.status >= 200 && x.status < 300 ? resolve() : reject(new Error('Upload failed. Please try again.'));
        x.onerror = x.ontimeout = () => reject(new Error('Upload interrupted. Check your connection and try again.'));
        x.send(file);
      });
      const done = await api({ action: 'finish', ticket: start.ticket });
      onSaved(done.evidence);
    } catch (e) { setError(e instanceof Error ? e.message : 'Upload failed.'); }
    finally { setBusy(false); }
  }
  return <div className="mt-4 space-y-3">
    {savedUrl && <><video key={savedUrl} controls playsInline preload="metadata" src={savedUrl} className="w-full rounded-xl" onError={() => setError('This browser could not play the video. Try an MP4 export with H.264 video and AAC audio, or use another browser.')} /><p className="muted text-sm">Watch your pitch all the way through before continuing to your written reflection.</p></>}
    <label className="block text-sm font-medium">{savedUrl ? 'Upload another take (earlier takes stay in your portfolio)' : 'Upload your elevator pitch video'}<input className="mt-2 block w-full" type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" disabled={busy} onChange={e => { const f=e.target.files?.[0]; if(f) void upload(f); e.target.value=''; }} /></label>
    <p className="muted text-sm">MP4 recommended · maximum 50 MB. Your video is available through your signed-in account and your teachers’ accounts.</p>
    {busy && <p role="status">{progress < 100 ? `Uploading… ${progress}%` : 'Saving your video…'}</p>}
    {error && <p role="alert">{error}</p>}
  </div>;
}
