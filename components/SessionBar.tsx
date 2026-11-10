'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

type Sessions = { learner: boolean; instructor: boolean };

export default function SessionBar() {
  const pathname = usePathname();
  const [sessions, setSessions] = useState<Sessions>({ learner: false, instructor: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setError('');
    fetch('/api/session-status', { cache: 'no-store', signal: controller.signal })
      .then(r => { if (!r.ok) throw Error(); return r.json(); })
      .then(setSessions).catch(() => {});
    return () => controller.abort();
  }, [pathname]);
  const instructor = pathname.startsWith('/instruct') ? sessions.instructor : !sessions.learner && sessions.instructor;
  if (!sessions.learner && !sessions.instructor) return null;
  async function signOut() {
    setBusy(true); setError('');
    try {
      const response = await fetch(instructor ? '/api/instruct/logout' : '/api/logout', { method: 'POST' });
      if (!response.ok) throw Error();
      // A full navigation clears cached signed-in pages and refreshes the session bar.
      window.location.assign(instructor ? '/instruct/login' : '/join');
    } catch {
      setError('Could not sign out. Please try again.'); setBusy(false);
    }
  }
  return <aside className="session-bar" aria-label="Account">
    <span>{instructor ? 'Instructor' : 'Student'} account</span>
    {error && <span role="alert">{error}</span>}
    <button type="button" disabled={busy} onClick={signOut}>{busy ? 'Signing out…' : 'Sign out →'}</button>
  </aside>;
}
