'use client';
import Link from 'next/link';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { SKILLS, summarize, LEVEL_COUNT, levelConfig, sessionScore, type Attempt, type MouseRecord } from '@/lib/mouse-skills';
import styles from './mouse.module.css';
import HowToPlay, { ACTIONS } from './HowToPlay';
import { MeadowIcon, MeadowScene, RewardBurst } from './MeadowArt';
import Leaderboard from './Leaderboard';

function SkillButton({ index, grown, active, disabled, onStart }: { index: number; grown: number; active: boolean; disabled: boolean; onStart: (index: number) => void }) {
  return <button aria-label={`${ACTIONS[index]}${grown ? `, ${grown} levels complete` : ''}`} aria-current={active ? 'step' : undefined} disabled={disabled} onClick={() => onStart(index)} className={`${styles.step} ${active ? styles.active : ''}`}><span aria-hidden="true"><MeadowIcon index={index} /></span><b>{ACTIONS[index]}</b><small aria-hidden="true">{grown} / {LEVEL_COUNT}</small></button>;
}

type DragLayout = { source: { x: number; y: number }; destination: { x: number; y: number } };
function nextDragLayout(previous?: DragLayout): DragLayout {
  // Swap sides every round so neither piece can stay in its old position.
  // Insets fit the largest destination even on a narrow board.
  const sourceOnLeft = previous ? previous.source.x > 50 : Math.random() < .5;
  const left = () => 24 + Math.random() * 5;
  const right = () => 71 + Math.random() * 5;
  return {
    source: { x: sourceOnLeft ? left() : right(), y: 25 + Math.random() * 45 },
    destination: { x: sourceOnLeft ? right() : left(), y: 25 + Math.random() * 45 },
  };
}

export default function MouseGame({ signedIn, returnHref }: { signedIn: boolean; returnHref?: string }) {
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [skillIndex, setSkillIndex] = useState(0);
  const [level, setLevel] = useState(0);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [feedback, setFeedback] = useState('A little practice. A lot of possibility.');
  const [saveState, setSaveState] = useState('');
  const [target, setTarget] = useState({ x: 35, y: 42 });
  const [dragLayout, setDragLayout] = useState<DragLayout>({ source: { x: 26, y: 40 }, destination: { x: 74, y: 60 } });
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [paused, setPaused] = useState(false);
  const [help, setHelp] = useState(false);
  const [reward, setReward] = useState<{ x: number; y: number; id: number } | null>(null);
  const [settling, setSettling] = useState(false);
  const session = useRef('');
  const sequence = useRef(0);
  const pending = useRef<MouseRecord[]>([]);
  const flushing = useRef(false);
  const started = useRef(0);
  const hold = useRef<ReturnType<typeof setTimeout> | null>(null);
  const single = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locked = useRef(false);
  const dragging = useRef(false);
  const board = useRef<HTMLDivElement>(null);
  const dropZone = useRef<HTMLDivElement>(null);
  const skill = SKILLS[skillIndex];
  const current = attempts.filter(a => a.skill === skill.id && a.level === level);
  const hits = current.filter(a => a.success).length;
  const config = levelConfig(level);
  const score = sessionScore(attempts);
  const ready = hits >= config.goal && hits / current.length >= .8;
  const size = config.size;
  const piece = hits % 4;
  const summary = summarize(attempts);

  async function flush() {
    if (!signedIn || flushing.current) return;
    flushing.current = true;
    setSaveState('Saving progress…');
    try {
      while (pending.current.length) {
        const response = await fetch('/api/mouse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pending.current[0]), keepalive: true });
        if (!response.ok) throw new Error();
        pending.current.shift();
      }
      setSaveState('All progress saved');
    } catch { setSaveState('Not saved yet — keep this page open and retry.'); }
    finally { flushing.current = false; }
  }
  function queue(record: MouseRecord) {
    if (!signedIn) return;
    pending.current.push(record);
    void flush();
  }
  function clearTimers() {
    if (hold.current) clearTimeout(hold.current);
    if (single.current) clearTimeout(single.current);
    hold.current = null;
    single.current = null;
    setSettling(false);
  }
  useEffect(() => {
    function visibility() {
      if (document.hidden) {
        clearTimers();
        dragging.current = false;
        setDrag(null);
        setPaused(true);
      }
    }
    function unload(e: BeforeUnloadEvent) {
      if (pending.current.length) { e.preventDefault(); e.returnValue = ''; }
    }
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('beforeunload', unload);
    return () => { clearTimers(); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('beforeunload', unload); };
  }, []);
  function start(index = 0) {
    session.current = crypto.randomUUID(); sequence.current = 0;
    setDragLayout(nextDragLayout());
    setAttempts([]); setLevel(0); setSkillIndex(index); setFinished(false); setRunning(true); setPaused(false); setHelp(true); setReward(null);
    locked.current = false; started.current = performance.now();
    setFeedback('');
    queue({ sessionId: session.current, sequence: 0, kind: 'start' });
  }
  function record(success: boolean, input: string, reason: Attempt['reason']) {
    if (!running || help || paused || ready || locked.current) return;
    locked.current = true;
    clearTimers();
    const attempt: Attempt = { skill: skill.id, level, success, input: input === 'touch' ? 'touch' : input === 'pen' ? 'pen' : 'mouse', reason, ms: Math.min(3600000, Math.round(performance.now() - started.current)) };
    setAttempts(prev => [...prev, attempt]);
    queue({ sessionId: session.current, sequence: ++sequence.current, kind: 'attempt', attempt });
    setFeedback(success ? ['Lovely landing!', 'You found it!', 'Treasure unlocked!', 'A little garden magic!', 'A perfect fit!'][skillIndex] : '↻ Try again');
    if (success) setReward({ x: skill.id === 'drag' ? dragLayout.destination.x : target.x, y: skill.id === 'drag' ? dragLayout.destination.y : target.y, id: attempts.length + 1 });
    if (success && skill.id === 'drag') setDragLayout(nextDragLayout(dragLayout));
    if (success) setTarget(prev => ({ x: prev.x < 50 ? 64 + Math.random() * 16 : 15 + Math.random() * 16, y: 23 + Math.random() * 50 }));
    started.current = performance.now();
    // A short guard prevents the trailing click of a double-click scoring a second target.
    if (skill.id === 'aim') locked.current = false;
    else setTimeout(() => { locked.current = false; }, 350);
  }
  function next() {
    clearTimers();
    setDragLayout(nextDragLayout(dragLayout));
    if (level < LEVEL_COUNT - 1) setLevel(level + 1);
    else if (skillIndex < 4) { setSkillIndex(skillIndex + 1); setLevel(0); }
    else { end(); return; }
    locked.current = false; started.current = performance.now();
    setFeedback(''); setHelp(true); setReward(null);
  }
  function end() {
    clearTimers(); setRunning(false); setFinished(true); setDrag(null);
    queue({ sessionId: session.current, sequence: ++sequence.current, kind: 'end' });
  }
  function pointerDown(e: PointerEvent<HTMLDivElement>) {
    if (help || paused || ready || locked.current) return;
    const isTarget = (e.target as HTMLElement).closest('[data-target]');
    if (skill.id === 'drag' && e.button === 0 && isTarget) {
      e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); dragging.current = true;
      setDrag({ x: e.clientX, y: e.clientY });
    } else if (skill.id === 'right') {
      record(!!isTarget && e.button === 2, e.pointerType, !isTarget ? 'miss' : e.button === 2 ? 'hit' : 'wrong-button');
    } else if (skill.id === 'click') {
      record(!!isTarget && e.button === 0, e.pointerType, !isTarget ? 'miss' : e.button === 0 ? 'hit' : 'wrong-button');
    } else if (skill.id === 'double') {
      if (!isTarget || e.button !== 0) record(false, e.pointerType, !isTarget ? 'miss' : 'wrong-button');
      else if (single.current) { clearTimeout(single.current); single.current = null; record(true, e.pointerType, 'hit'); }
      else single.current = setTimeout(() => { single.current = null; record(false, e.pointerType, 'early-release'); }, 650);
    } else if (skill.id === 'drag') record(false, e.pointerType, isTarget ? 'wrong-button' : 'miss');
  }

  return <main className={styles.page}>
    <nav className={styles.nav}>
      <Link className={styles.home} aria-label={returnHref ? "Back to module" : "Back to home"} href={returnHref ?? (signedIn ? '/learn' : '/')} onClick={e => { if (pending.current.length) { e.preventDefault(); setSaveState('Not saved yet — keep this page open and retry.'); } }}>⌂</Link>
      <h1>Mouse <em>Meadow</em><span className={styles.titleSpark} aria-hidden="true">✦</span></h1>
      {running ? <button className={styles.helpButton} aria-label="Show instructions" onClick={() => { clearTimers(); dragging.current = false; setDrag(null); setHelp(true); }}>?</button> : <span className={styles.home} aria-hidden="true"><MeadowIcon index={4} /></span>}
    </nav>
    {!running && <div className={styles.campaignBadge}>5 gardens · 15 levels each · 75 adventures</div>}
    <div className={styles.layout}>
      <aside className={styles.path} aria-label="Choose a mouse skill">{SKILLS.map((s, i) => <SkillButton key={s.id} index={i} grown={summary[i].level} active={running && i === skillIndex} disabled={running || (signedIn && !!saveState && saveState !== 'All progress saved')} onStart={start} />)}</aside>
      <section className={styles.game}>
        {!running && !finished ? <div className={styles.welcome}>
          <MeadowScene blooms={5} /><div className={styles.welcomeGarden} aria-hidden="true"><span><MeadowIcon index={0} /></span><span><MeadowIcon index={4} /></span><span><MeadowIcon index={3} /></span></div>
          <h2>Ready to play?</h2>
          <button className={styles.primary} onClick={() => start()}>Play <span aria-hidden="true">▶</span></button>
          <small>Use a mouse or trackpad.</small>
        </div> : finished ? <div className={styles.results}>
          <MeadowScene blooms={summary.reduce((n, row) => n + row.level, 0)} /><span className={styles.trophy} aria-hidden="true">★</span><h2>Great growing!</h2><p className={styles.scoreTotal}>★ {score.score.toLocaleString()} points</p>
          <div className={styles.resultsGrid}>{summary.map((s, i) => <div key={s.id} aria-label={`${s.name}: ${s.level} levels complete`}><span aria-hidden="true"><MeadowIcon index={i} /></span><b aria-hidden="true">{s.level} / {LEVEL_COUNT}</b></div>)}</div>
          <button className={styles.primary} disabled={signedIn && saveState !== 'All progress saved'} onClick={() => start()}>Play again <span aria-hidden="true">↻</span></button>
        </div> : <>
          <div className={styles.gameHeader}><h2><MeadowIcon index={skillIndex} />{ACTIONS[skillIndex]}</h2><div className={styles.seeds} aria-label={`${Math.min(hits, config.goal)} of ${config.goal} discoveries`}>{Array.from({ length: config.goal }, (_, i) => <span key={i} className={i < hits ? styles.earnedStar : undefined} aria-hidden="true">{i < hits ? '★' : '☆'}</span>)}</div><span className={styles.level} aria-label={`Level ${level + 1} of ${LEVEL_COUNT}`}>{level + 1} / {LEVEL_COUNT}</span></div>
          <div className={styles.scoreBar}><span>★ {score.score.toLocaleString()}</span><span>{score.completed} levels grown</span></div>
          <div ref={board} className={styles.board} onContextMenu={e => e.preventDefault()} onPointerDown={pointerDown} onPointerMove={e => { if (dragging.current) setDrag({ x: e.clientX, y: e.clientY }); }} onPointerCancel={() => { dragging.current = false; setDrag(null); clearTimers(); setPaused(true); }} onPointerUp={e => {
            if (!dragging.current) return;
            dragging.current = false; setDrag(null);
            const bounds = dropZone.current!.getBoundingClientRect();
            const tolerance = config.dropRadius;
            const hit = Math.hypot(e.clientX - (bounds.left + bounds.width / 2), e.clientY - (bounds.top + bounds.height / 2)) <= tolerance;
            record(hit, e.pointerType, hit ? 'hit' : 'early-release');
          }}>
            <MeadowScene blooms={attempts.filter(a => a.success).length} />
            {reward && !help && !paused && <RewardBurst {...reward} />}
            {!ready && !paused && !help && <>
              {skill.id === 'drag' && <div ref={dropZone} className={styles.drop} style={{ left: `${dragLayout.destination.x}%`, top: `${dragLayout.destination.y}%`, width: config.dropRadius * 2, height: config.dropRadius * 2 }}><MeadowIcon index={4} variant={piece} /></div>}
              <div data-target className={`${styles.target} ${settling ? styles.settling : ''}`} role="img" aria-label={skill.id === 'drag' ? 'Flower puzzle piece' : `${skill.name} target`} style={{ width: size, height: size, left: `${skill.id === 'drag' ? dragLayout.source.x : target.x}%`, top: `${skill.id === 'drag' ? dragLayout.source.y : target.y}%`, ...(drag ? { position: 'fixed', left: drag.x, top: drag.y, pointerEvents: 'none' } : {}) }} onPointerEnter={e => {
                if (skill.id !== 'aim' || locked.current || e.pointerType === 'touch') return;
                const input = e.pointerType;
                setSettling(true);
                hold.current = setTimeout(() => { hold.current = null; record(true, input, 'hit'); }, config.dwell);
              }} onPointerLeave={e => { if (skill.id === 'aim' && hold.current) record(false, e.pointerType, 'early-release'); }}><MeadowIcon index={skillIndex} variant={skill.id === 'drag' ? piece : 0} /></div>

            </>}
            {ready && <div className={styles.overlay}><span className={styles.bloomPrize}><MeadowIcon index={4} variant={level} /></span><h3>A new bloom!</h3><button className={styles.primary} onClick={next}>{skillIndex === 4 && level === LEVEL_COUNT - 1 ? 'My garden' : 'Next'} →</button></div>}
            {paused && !ready && !help && <div className={styles.overlay}><span aria-hidden="true">⏸</span><h3>Paused</h3><button className={styles.primary} onClick={() => { started.current = performance.now(); setPaused(false); }}>Play ▶</button></div>}
          </div>
          <div className={styles.gameFooter}><span className={styles.feedback} aria-live="polite">{feedback}</span><button className={styles.finishButton} onClick={end}><span aria-hidden="true">⚑</span> Finish</button></div>
        </>}
      </section>
    </div>
    {!running && <Leaderboard signedIn={signedIn} refreshKey={saveState} />}
    <footer className={styles.footer}><span role="status">{signedIn ? saveState || '✓ Class progress on' : <>Guest play · <Link href="/join">Sign in to save</Link></>} {saveState.startsWith('Not saved') && <button onClick={() => void flush()}>Retry save</button>}</span></footer>
    {help && <HowToPlay index={skillIndex} onClose={() => { clearTimers(); started.current = performance.now(); locked.current = false; setPaused(false); setHelp(false); }} />}
  </main>;
}
