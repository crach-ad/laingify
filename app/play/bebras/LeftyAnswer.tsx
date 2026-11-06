'use client';
import {gridWalls,type Answer} from '@/lib/bebras/challenges';
import s from './lefty.module.css';
const start=21,goal=23;
const wall=(a:number,b:number)=>gridWalls.some(([x,y])=>(x===a&&y===b)||(x===b&&y===a));
export default function LeftyAnswer({value,onChange,disabled}:{value:Answer|undefined;onChange:(v:Answer)=>void;disabled:boolean}){
 const selected=Array.isArray(value)?value:[];
 const marked=(i:number)=>i===start||i===goal||selected.includes(String(i));
 const centre=(i:number)=>[i%5*100+50,Math.floor(i/5)*100+50];
 return <div className={s.root}><p>Select the squares Lefty visits. Select a square again to remove it.</p><div className={s.legend}><span>↑ Starts facing up</span><span>↰ Left turns only</span><span>━ Walls block movement</span></div>
 <div className={s.board} role="group" aria-label="Lefty maze: five rows and five columns">
 {Array.from({length:25},(_,i)=><button type="button" key={i} className={`${s.cell} ${selected.includes(String(i))?s.selected:''} ${i===start?s.start:i===goal?s.goal:''}`} disabled={disabled||i===start||i===goal} aria-label={`Row ${Math.floor(i/5)+1}, column ${i%5+1}${i===start?', start, facing up':i===goal?', goal':''}`} aria-pressed={i===start||i===goal?undefined:selected.includes(String(i))} onClick={()=>onChange(selected.includes(String(i))?selected.filter(v=>v!==String(i)):[...selected,String(i)])}>
 {i===start?<span className={s.robot}><svg viewBox="0 0 60 72" aria-hidden="true"><path d="M30 3 17 18h8v10h10V18h8Z" fill="#174b79"/><rect x="9" y="31" width="42" height="32" rx="10" fill="#fff" stroke="#174b79" strokeWidth="3"/><circle cx="22" cy="43" r="4" fill="#174b79"/><circle cx="38" cy="43" r="4" fill="#174b79"/><path d="M22 54h16" stroke="#174b79" strokeWidth="3"/><path d="M3 41v13m54-13v13" stroke="#174b79" strokeWidth="5" strokeLinecap="round"/></svg><small>START ↑</small></span>:i===goal?<span className={s.goalIcon}>⚑<small>GOAL</small></span>:selected.includes(String(i))?<span className={s.dot} aria-hidden="true"/>:<span className={s.coordinate} aria-hidden="true">{Math.floor(i/5)+1}·{i%5+1}</span>}
 </button>)}
 <svg className={s.overlay} viewBox="0 0 500 500" aria-hidden="true">
 {Array.from({length:25},(_,a)=>[a%5<4?a+1:-1,a<20?a+5:-1].filter(b=>b>=0&&marked(a)&&marked(b)&&!wall(a,b)).map(b=>{const [x1,y1]=centre(a),[x2,y2]=centre(b);return <line key={`${a}-${b}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#7653c6" strokeWidth="10" strokeLinecap="round"/>}))}
 {gridWalls.map(([a,b])=>{const [x,y]=centre(a);return a+1===b?<line className={s.wall} key={a} x1={x+50} y1={y-50} x2={x+50} y2={y+50}/>:<line className={s.wall} key={a} x1={x-50} y1={y+50} x2={x+50} y2={y+50}/>})}
 </svg></div><p className={s.note}>Purple lines join selected neighbouring squares where there is no wall. They show your selection, not whether the route is correct.</p><button type="button" className={s.clear} disabled={disabled} onClick={()=>onChange([])}>Clear selected squares</button></div>;
}
