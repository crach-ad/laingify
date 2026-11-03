'use client';

import { useRef, useState, type PointerEvent } from 'react';
import type { Answer } from '@/lib/bebras/challenges';
import { fairBeavers, fairStilts, fairSlots, placeFair } from '@/lib/bebras/fair';
import s from './fair.module.css';

const WIDTH = 1080, HEIGHT = 440, GROUND = 380, UNIT = 18;
const stiltX = (i: number) => 470 + i * 100;
type Drag = { name: string; x: number; y: number; startX: number; startY: number; moved: boolean };

export default function FairBoard({ value, onChange, disabled = false }: {
  value: Answer | undefined; onChange: (value: Answer) => void; disabled?: boolean;
}) {
  const [selected, setSelected] = useState('');
  const [drag, setDrag] = useState<Drag | null>(null);
  const [message, setMessage] = useState('');
  const svg = useRef<SVGSVGElement>(null);
  const dragging = useRef<Drag | null>(null);
  const suppressClick = useRef(false);
  const slots = fairSlots(value);

  function place(name: string, destination: number) {
    if (disabled) return;
    const displaced = destination >= 0 ? slots[destination] : '';
    onChange(placeFair(slots, name, destination));
    setSelected('');
    setMessage(`${name} ${destination < 0 ? 'returned to the starting area' : `placed on stilts ${destination + 1}`}.${displaced && displaced !== name ? ` ${displaced} returned to the starting area.` : ''}`);
  }
  function point(e: PointerEvent<SVGGElement>) {
    const bounds = svg.current!.getBoundingClientRect();
    return { x: (e.clientX - bounds.left) * WIDTH / bounds.width, y: (e.clientY - bounds.top) * HEIGHT / bounds.height };
  }
  function start(e: PointerEvent<SVGGElement>, name: string) {
    if (disabled || e.button !== 0) return;
    const p = point(e);
    suppressClick.current = false;
    dragging.current = { name, ...p, startX: p.x, startY: p.y, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function move(e: PointerEvent<SVGGElement>) {
    const current = dragging.current;
    if (!current || disabled) return;
    const p = point(e);
    const next = { ...current, ...p, moved: current.moved || Math.hypot(p.x - current.startX, p.y - current.startY) > 5 };
    dragging.current = next;
    if (next.moved) setDrag(next);
  }
  function end(e: PointerEvent<SVGGElement>) {
    const current = dragging.current;
    dragging.current = null;
    setDrag(null);
    if (!current?.moved) return;
    suppressClick.current = true;
    const p = point(e);
    if (p.y < 0 || p.y > HEIGHT || p.x < 0 || p.x > WIDTH) return;
    const destination = p.x < 410 ? -1 : Math.round((p.x - stiltX(0)) / 100);
    if (destination >= -1 && destination < 6) place(current.name, destination);
  }
  function activate(name: string) {
    if (disabled) return;
    if (suppressClick.current) { suppressClick.current = false; return; }
    const position = slots.indexOf(name);
    if (selected && selected !== name && position >= 0) place(selected, position);
    else setSelected(selected === name ? '' : name);
  }
  return <div className={s.fair}>
    <p id="fair-instructions">Move the beavers onto stilts so the tops of their hats are all at the same height. Drag a beaver, or select it and then select a pair of stilts. You can also use the placement menus below.</p>
    <div className={s.scroll}>
      <svg ref={svg} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={s.board} role="group" aria-label="Fair beaver placement board" aria-describedby="fair-instructions">
        {Array.from({ length: 21 }, (_, n) => <g key={n} aria-hidden="true"><line x1="24" x2="1050" y1={GROUND - n * UNIT} y2={GROUND - n * UNIT} stroke={n === 0 ? '#9a8c7d' : '#d9dfdc'} /><text x="18" y={GROUND - n * UNIT + 4} textAnchor="end" fontSize="12" fill="#52635a">{n}</text></g>)}
        <g role="button" tabIndex={disabled ? -1 : 0} aria-disabled={disabled} aria-label="Return selected beaver to starting area" className={s.target} onClick={() => selected && place(selected, -1)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (selected) place(selected, -1); } }}>
          <rect x="30" y="30" width="375" height="380" rx="12" fill="transparent" />
          <text x="215" y="425" textAnchor="middle">Starting area</text>
        </g>
        {fairStilts.map((height, i) => <g key={i} className={s.target} role="button" tabIndex={disabled ? -1 : 0} aria-disabled={disabled} aria-label={`Stilts ${i + 1}, footplate ${height} units, ${slots[i] || 'empty'}`} onClick={() => { if (selected) place(selected, i); else if (!disabled) setSelected(slots[i]); }} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (selected) place(selected, i); else if (!disabled) setSelected(slots[i]); } }}>
          <rect x={stiltX(i) - 45} y="15" width="90" height="400" rx="12" fill={selected ? '#e8f3e633' : 'transparent'} />
          <path d={`M${stiltX(i) - 32},${GROUND} V${GROUND - 16 * UNIT} M${stiltX(i) + 32},${GROUND} V${GROUND - 16 * UNIT} M${stiltX(i) - 32},${GROUND - height * UNIT} H${stiltX(i) + 32}`} fill="none" stroke="#b49881" strokeWidth="6" strokeLinecap="round" />
          <text x={stiltX(i)} y="425" textAnchor="middle">Stilts {i + 1}</text>
        </g>)}
        {fairBeavers.map((beaver, i) => {
          const position = slots.indexOf(beaver.name);
          const moving = drag?.name === beaver.name;
          const x = position < 0 ? 65 + i * 74 : stiltX(position);
          const bottom = GROUND - (position < 0 ? 0 : fairStilts[position] * UNIT);
          const dx = moving ? drag.x - drag.startX : 0, dy = moving ? drag.y - drag.startY : 0;
          return <g key={beaver.name} transform={`translate(${dx},${dy})`} role="button" tabIndex={disabled ? -1 : 0} aria-disabled={disabled} aria-pressed={selected === beaver.name} aria-label={`${beaver.name}, ${beaver.height} units tall, ${position < 0 ? 'in starting area' : `on stilts ${position + 1}`}`} className={s.beaver} onPointerDown={e => start(e, beaver.name)} onPointerMove={move} onPointerUp={end} onPointerCancel={() => { dragging.current = null; setDrag(null); suppressClick.current = true; }} onClick={() => activate(beaver.name)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(beaver.name); } if (e.key === 'Escape') setSelected(''); }}>
            <rect x={x - 37} y={bottom - beaver.height * UNIT - 3} width="74" height={beaver.height * UNIT + 6} rx="8" fill={selected === beaver.name ? '#e8ddff88' : 'transparent'} stroke={selected === beaver.name ? '#7154ad' : 'transparent'} strokeWidth="3" />
            <image href={`/games/bebras/fair-${i}.svg`} x={x - 36} y={bottom - beaver.height * UNIT} width="72" height={beaver.height * UNIT} preserveAspectRatio="none" pointerEvents="none" />
            <text x={x} y={bottom + 16} textAnchor="middle" fontWeight="bold" pointerEvents="none">{String.fromCharCode(65 + i)}</text>
          </g>;
        })}
      </svg>
    </div>
    <p className={s.status} role="status">{selected ? `${selected} selected. Choose stilts or the starting area.` : message || 'Five beavers, six pairs of stilts. One pair will stay empty.'}</p>
    <div className={s.menus}>{fairBeavers.map(beaver => <label key={beaver.name}>{beaver.name}<select disabled={disabled} value={slots.indexOf(beaver.name)} onChange={e => place(beaver.name, Number(e.target.value))}><option value={-1}>Starting area</option>{fairStilts.map((height, i) => <option key={i} value={i}>Stilts {i + 1} · {height} units</option>)}</select></label>)}</div>
    <button type="button" className={s.clear} disabled={disabled} onClick={() => { onChange([]); setSelected(''); setDrag(null); dragging.current = null; setMessage('All beavers returned to the starting area.'); }}>Reset beavers</button>
  </div>;
}
