import type { CSSProperties } from 'react';
import styles from './mouse.module.css';

/** Shared vector characters stay crisp at every target size. Their hit areas never move. */
export function MeadowIcon({ index, variant = 0 }: { index: number; variant?: number }) {
  const petals = ['#ffcb50', '#f38fb2', '#b7a0ef', '#ff9272'][variant % 4];
  return <svg viewBox="0 0 100 100" className={styles.character} aria-hidden="true" focusable="false">
    {index === 0 ? <>
      <g className={styles.wings}><path d="M48 48C1 0 1 49 27 58C1 86 39 97 48 61Z" fill="#8e82ee" stroke="#5b52ac" strokeWidth="3"/><path d="M52 48C99 0 99 49 73 58C99 86 61 97 52 61Z" fill="#b9a3ff" stroke="#5b52ac" strokeWidth="3"/><path d="M18 32Q20 53 40 49M82 32Q80 53 60 49" fill="none" stroke="#e8d9ff" strokeWidth="7" strokeLinecap="round"/><circle cx="32" cy="71" r="7" fill="#f4bbd4"/><circle cx="68" cy="71" r="7" fill="#f4bbd4"/></g>
      <path d="M46 35Q33 17 32 26M54 35Q67 17 68 26" fill="none" stroke="#403c69" strokeWidth="3" strokeLinecap="round"/><rect x="44" y="32" width="12" height="43" rx="6" fill="#494675"/><circle cx="47" cy="39" r="1.5" fill="white"/><circle cx="53" cy="39" r="1.5" fill="white"/>
    </> : index === 2 ? <>
      <path d="M29 43H75L71 73Q53 100 34 73Z" fill="#cf864b" stroke="#815538" strokeWidth="3"/><path d="M59 20Q53 9 65 6" fill="none" stroke="#755134" strokeWidth="7" strokeLinecap="round"/><path d="M22 48Q22 20 52 20Q82 20 82 48Z" fill="#925b3e" stroke="#67442f" strokeWidth="3"/><path d="M30 33L39 42L50 29L62 43L73 33" fill="none" stroke="#b77d50" strokeWidth="4" strokeLinecap="round"/><path d="M36 55L39 68" stroke="#eeb47d" strokeWidth="5" strokeLinecap="round"/><circle cx="49" cy="61" r="2.5" fill="#503b30"/><circle cx="64" cy="61" r="2.5" fill="#503b30"/><path d="M51 70Q57 75 62 69" fill="none" stroke="#503b30" strokeWidth="2.5" strokeLinecap="round"/>
    </> : index === 3 ? <>
      <path d="M39 47L32 85Q49 94 68 85L61 47" fill="#fff1cc" stroke="#c5a67b" strokeWidth="3"/><path d="M9 50Q13 10 50 12Q87 10 91 50Q50 64 9 50Z" fill="#f17a75" stroke="#b75057" strokeWidth="3"/><ellipse cx="35" cy="30" rx="10" ry="8" fill="#ffe9c9"/><ellipse cx="69" cy="39" rx="10" ry="8" fill="#ffe9c9"/><ellipse cx="57" cy="19" rx="6" ry="4" fill="#ffe9c9"/><circle cx="43" cy="71" r="2.5" fill="#684c45"/><circle cx="57" cy="71" r="2.5" fill="#684c45"/><path d="M46 80Q50 84 55 79" fill="none" stroke="#684c45" strokeWidth="2" strokeLinecap="round"/>
    </> : <>
      <path d="M50 53V92" stroke="#42865b" strokeWidth="6" strokeLinecap="round"/><path d="M48 83Q21 83 26 65Q45 65 48 83M53 76Q77 77 77 60Q56 60 53 76" fill="#70ad67"/>
      <g className={styles.petals}>{[0, 60, 120, 180, 240, 300].map(angle => <ellipse key={angle} cx="50" cy="26" rx="13" ry="20" fill={petals} stroke="#ffffff80" strokeWidth="2" transform={`rotate(${angle} 50 45)`} />)}</g>
      <circle cx="50" cy="45" r="17" fill="#86533b"/><circle cx="45" cy="42" r="2" fill="#fff3c4"/><circle cx="55" cy="42" r="2" fill="#fff3c4"/><path d="M44 50Q50 56 56 50" fill="none" stroke="#fff3c4" strokeWidth="2.5" strokeLinecap="round"/>
    </>}
  </svg>;
}

export function MeadowScene({ blooms = 0 }: { blooms?: number }) {
  return <div className={styles.world} aria-hidden="true">
    <div className={styles.sun}><span /></div>
    <div className={`${styles.cloud} ${styles.cloudOne}`} /><div className={`${styles.cloud} ${styles.cloudTwo}`} />
    <svg className={styles.landscape} viewBox="0 0 1200 500" preserveAspectRatio="none">
      <path d="M0 280Q170 100 390 285Q660 110 850 270Q1060 155 1200 250V500H0Z" fill="#b6dbaa"/>
      <path d="M0 330Q300 210 550 340Q930 190 1200 310V500H0Z" fill="#90cba0"/>
      <path d="M0 395Q220 300 550 400Q890 290 1200 365V500H0Z" fill="#6eb69a"/>
      <path d="M580 500Q450 435 680 378Q810 338 714 320Q945 351 760 402Q620 455 820 500" fill="#d6dfac" opacity=".65"/>
      <path d="M0 470Q240 415 420 475Q950 420 1200 460V500H0Z" fill="#529b80"/>
    </svg>
    <div className={styles.gardenEdge}>{Array.from({ length: 11 }, (_, i) => <span key={i} className={styles.edgeFlower} style={{ left: `${i * 10 - 2}%`, bottom: `${i % 3 * 5 - 9}px`, width: `${38 + i % 3 * 16}px`, animationDelay: `${i * -.6}s` }}><MeadowIcon index={4} variant={i} /></span>)}</div>
    {Array.from({ length: 7 }, (_, i) => <i key={i} className={styles.firefly} style={{ left: `${9 + i * 13}%`, top: `${23 + i % 3 * 19}%`, animationDelay: `${i * -.8}s` }} />)}
    <div className={styles.grownGarden}>{Array.from({ length: Math.min(blooms, 12) }, (_, i) => <span key={i} style={{ left: `${13 + i * 6.4}%`, bottom: `${4 + i % 3 * 5}%` }}><MeadowIcon index={4} variant={i} /></span>)}</div>
  </div>;
}

export function RewardBurst({ x, y, id }: { x: number; y: number; id: number }) {
  return <div key={id} className={styles.reward} style={{ left: `${x}%`, top: `${y}%` }} aria-hidden="true">
    <span className={styles.rewardRing} />
    {Array.from({ length: 10 }, (_, i) => <i key={i} style={{ '--dx': `${Math.cos(i * Math.PI / 5) * 80}px`, '--dy': `${Math.sin(i * Math.PI / 5) * 80}px`, '--turn': `${i * 55}deg`, background: ['#ffce67', '#ffa4af', '#bfb0ff', '#fff8d2'][i % 4] } as CSSProperties} />)}
    <b>★</b>
  </div>;
}
