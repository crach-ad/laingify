'use client';
import { useEffect, useRef } from 'react';
import styles from './mouse.module.css';
import { MeadowIcon } from './MeadowArt';
import { levelConfig } from '@/lib/mouse-skills';

export const ACTIONS = ['Move & stop', 'Click', 'Double-click', 'Right-click', 'Drag & drop'];
const HINTS = ['Rest on the butterfly.', 'One click on the flower.', 'Two quick clicks on the acorn.', 'Use the right mouse button.', 'Hold, move, then let go.'];

export default function HowToPlay({ index, level, onClose }: { index: number; level: number; onClose: () => void }) {
  const config = levelConfig(level);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  function dismiss() { dialog.current?.close(); onClose(); }
  return <dialog ref={dialog} className={styles.lesson} aria-labelledby="mouse-lesson-title" aria-describedby="mouse-lesson-hint" onCancel={e => { e.preventDefault(); dismiss(); }}>
    <div className={styles.lessonBody}>
      <h2 id="mouse-lesson-title">{ACTIONS[index]}</h2><span className={styles.lessonLevel}>Level {level + 1} · {config.band}</span>
      <div className={`${styles.demo} ${styles[`demo${index}`]}`} aria-hidden="true">
        <svg className={styles.mouseDiagram} viewBox="0 0 140 190">
          <rect x="12" y="5" width="116" height="175" rx="58" fill="#fffdf1" stroke="#294d3a" strokeWidth="5" />
          <path className={index === 1 || index === 2 || index === 4 ? styles.litButton : ''} d="M70 8 C36 8 15 30 15 65 L15 82 L70 82 Z" fill="#e5ead9" />
          <path className={index === 3 ? styles.litButton : ''} d="M70 8 C104 8 125 30 125 65 L125 82 L70 82 Z" fill="#e5ead9" />
          <path d="M70 8V82 M15 83H125" stroke="#294d3a" strokeWidth="3" />
          <rect x="64" y="32" width="12" height="28" rx="6" fill="#294d3a" />
          <text x="70" y="136" textAnchor="middle" fill="#294d3a" fontSize="30" fontWeight="700">{['↔', '1', '2', 'R', '↓'][index]}</text>
        </svg>
        <div className={styles.demoScene}>
          <span className={styles.demoObject}><MeadowIcon index={index} /></span>
          {index === 4 && <span className={styles.demoDestination}><MeadowIcon index={4} /></span>}
          <svg className={styles.demoCursor} viewBox="0 0 40 48"><path d="M5 3L34 27L21 29L16 42Z" fill="#294d3a" stroke="#fffdf1" strokeWidth="3" /></svg>
          {index > 0 && index < 4 && <span className={styles.tapCue}>{index === 2 ? '● ●' : '●'}</span>}
        </div>
      </div>
      {index === 4 && config.waypoints > 0 ? <div className={styles.routeHint} aria-hidden="true"><span>🌻</span><b>→</b><i>1</i>{config.waypoints === 2 && <><b>→</b><i>2</i></>}<b>→</b><span>◎</span></div> : index !== 4 && config.decoys > 0 && <div className={styles.matchHint} aria-hidden="true"><span><MeadowIcon index={index} />✓</span><span><MeadowIcon index={(index + 1) % 5} />×</span></div>}
      <p id="mouse-lesson-hint">{index === 4 && config.waypoints ? 'Drag through the numbered gates, then drop.' : index !== 4 && config.decoys > 0 ? `${HINTS[index]} Ignore the other pictures.` : HINTS[index]}{index === 2 && <small className={styles.timingHint}>Two clicks within {config.doubleClickMs / 1000} seconds.</small>}</p>
      <button autoFocus className={styles.primary} onClick={dismiss}>Let’s play <span aria-hidden="true">▶</span></button>
    </div>
  </dialog>;
}
