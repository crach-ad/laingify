import { prisma } from '@/lib/db';
import { summarize, validRecord, LEVEL_COUNT, type Attempt } from '@/lib/mouse-skills';

// Call only after the learner profile has checked instructor organization access.
export default async function MouseProgress({ learnerId, classIds }: { learnerId: string; classIds: string[] }) {
  const events = await prisma.learnerEvent.findMany({
    where: { learnerId, type: 'mouse_skills', OR: classIds.map(id => ({ id: { startsWith: `mouse:${id}:${learnerId}:` } })) },
    orderBy: { createdAt: 'desc' }, take: 5000,
  });
  const sessions = new Map<string, { id: string; date: Date; ended: boolean; version: number; attempts: Attempt[] }>();
  for (const event of events) {
    let record;
    try { record = JSON.parse(event.meta); } catch { continue; }
    if (!validRecord(record)) continue;
    const key = event.id.slice(0, event.id.lastIndexOf(':'));
    const session = sessions.get(key) ?? { id: key, date: event.createdAt, ended: false, version: JSON.parse(event.meta).version ?? 1, attempts: [] as Attempt[] };
    if (event.createdAt < session.date) session.date = event.createdAt;
    if (record.kind === 'end') session.ended = true;
    if (record.attempt) session.attempts.push(record.attempt);
    sessions.set(key, session);
  }
  const recent = [...sessions.values()].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 20);
  return <section className="card mt-8 p-6">
    <h2 className="text-lg font-semibold">🌱 Mouse Meadow · skill development</h2>
    <p className="muted mt-2 text-xs leading-relaxed">Session evidence, not a standardized assessment. A level is demonstrated with the level’s required successes (4–7) and 80% accuracy. Speed is descriptive and never gates progression. “Secure” means the final level was demonstrated in this session; confirm across sessions and observation.</p>
    {!recent.length && <p className="muted mt-4 text-sm">No mouse-skills sessions yet. Students can open Mouse Meadow from their dashboard.</p>}
    {recent.map((session, index) => {
      const rows = summarize(session.attempts, session.version === 1 ? 3 : LEVEL_COUNT);
      const previous = recent[index + 1];
      const previousRows = previous ? summarize(previous.attempts, previous.version === 1 ? 3 : LEVEL_COUNT) : null;
      return <details key={session.id} open={index === 0} className="mt-5 border-t border-[var(--border)] pt-4">
        <summary className="cursor-pointer text-sm font-semibold">{session.date.toLocaleString('en-GB', { timeZone: 'America/Nassau', dateStyle: 'medium', timeStyle: 'short' })} · {session.ended ? 'Finished' : 'Open / unfinished'} · {session.attempts.length} attempts</summary>
        <p className="muted mt-2 text-xs">Recorded task time: {Math.round(session.attempts.reduce((n, a) => n + a.ms, 0) / 1000)}s · Input: {[...new Set(session.attempts.map(a => a.input))].join(', ') || 'No attempts'}</p>
        <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="muted"><th className="p-2">Skill</th><th className="p-2">Successes / tries</th><th className="p-2">Accuracy</th><th className="p-2">Mean success time</th><th className="p-2">Evidence</th></tr></thead><tbody>{rows.map((r, i) => <tr key={r.id} className="border-t border-[var(--border)]"><td className="p-2">{r.icon} {r.name}</td><td className="p-2">{r.hits} / {r.attempts}</td><td className="p-2">{r.accuracy === null ? '—' : `${r.accuracy}%`}</td><td className="p-2">{r.meanMs === null ? '—' : `${(r.meanMs / 1000).toFixed(1)}s`}</td><td className="p-2">{r.proficiency}{r.level > 0 && ` · level ${r.level}`}{previousRows && r.attempts > 0 && previousRows[i].attempts > 0 && <span className="muted block">Previous session: level {previousRows[i].level}</span>}</td></tr>)}</tbody></table></div>
        <div className="mt-4 space-y-2">{rows.filter(r => r.attempts > 0 && r.proficiency !== 'Secure in this session').map(r => <p key={r.id} className="muted text-xs"><b>Next for {r.name}:</b> {r.tip}</p>)}</div>
        <p className="muted mt-3 text-xs">Errors: {session.attempts.filter(a => a.reason === 'miss').length} missed targets · {session.attempts.filter(a => a.reason === 'wrong-button').length} wrong buttons · {session.attempts.filter(a => a.reason === 'early-release').length} timing / release retries.</p>
      </details>;
    })}
    {events.length >= 5000 && <p className="muted mt-3 text-xs">Showing the latest 5,000 events; the oldest displayed session may be partial.</p>}
    {sessions.size > 20 && <p className="muted mt-3 text-xs">Showing the latest 20 sessions.</p>}
  </section>;
}
