'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from './mouse.module.css';
type Entry = { rank: number; nickname: string; score: number; completed: number; you: boolean };
export default function Leaderboard({ signedIn, refreshKey }: { signedIn: boolean; refreshKey: string }) {
  const [data, setData] = useState<{ entries: Entry[]; personal: Entry | null } | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!signedIn) return;
    const controller = new AbortController();
    fetch('/api/mouse', { cache: 'no-store', signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error(); return response.json(); })
      .then(result => { setData(result); setError(false); })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [signedIn, refreshKey, retry]);
  return <section className={styles.leaderboard} aria-label="Class leaderboard">
    <header><h2>🏆 Meadow champions</h2><span>Best session</span></header>
    {!signedIn ? <p><Link href="/join">Join your class →</Link><small>Save your score and climb the leaderboard.</small></p> : error ? <p role="status">Scores couldn’t load. <button onClick={() => { setError(false); setData(null); setRetry(n => n + 1); }}>Retry ↻</button></p> : !data ? <p role="status">Loading scores…</p> : <>
      {data.personal && <p className={styles.personalScore}>Your best <strong>★ {data.personal.score.toLocaleString()}</strong><span>#{data.personal.rank}</span></p>}
      {data.entries.length ? <ol>{data.entries.map(entry => <li key={entry.rank} className={entry.you ? styles.yourRank : undefined}><span className={styles.rank}>{entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}</span><span>{entry.nickname}{entry.you && <b> · You</b>}<small>{entry.completed} levels grown</small></span><strong>★ {entry.score.toLocaleString()}</strong></li>)}</ol> : <p>Plant the first high score!<small>Finish a session to join the board.</small></p>}
    </>}
    <details><summary>How to earn points</summary><p>Earn 10–38 points per successful action, plus up to 100 accuracy bonus points for each completed level. Points per level are capped. Your best finished session counts; speed doesn’t affect your score.</p></details>
  </section>;
}
