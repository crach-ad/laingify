'use client';
import {useRef,useState} from 'react';
import {fairNames,type Answer} from '@/lib/bebras/challenges';
import s from './bebras.module.css';
const homes=[-59.054,53.216,164.206,279.83,400];
const ladders=[522.098,630.372,738.367,852.434,965.174,1078.01];
const feet=[425.98,401,448.984,333.997,305,475.75];
const heights=[291,220,146,244,268];
export default function FairAnswer({value,onChange,disabled}:{value:Answer|undefined;onChange:(v:Answer)=>void;disabled:boolean}){
 const slots=Array.from({length:6},(_,i)=>Array.isArray(value)?value[i]??'':'');
 const [picked,setPicked]=useState<number|null>(null);
 const [drag,setDrag]=useState<{animal:number;dx:number;dy:number}|null>(null);
 const gesture=useRef<{animal:number;x:number;y:number;moved:boolean}|null>(null);
 const svg=useRef<SVGSVGElement>(null);
 function point(e:React.PointerEvent){const p=svg.current!.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.current!.getScreenCTM()!.inverse());}
 function place(animal:number,index:number){if(disabled)return;const next=slots.map(v=>v===fairNames[animal]?'':v);if(index>=0)next[index]=fairNames[animal];onChange(next);setPicked(null);}
 function select(animal:number){if(!disabled)setPicked(animal);}
 return <div><p className={s.hint}>Drag an animal onto a ladder. You can move it again or return it to the ground. Or select an animal, then select a ladder.</p>
 <div className={s.fairScroll}><svg ref={svg} className={s.fairBoard} viewBox="-100 -20 1328.266 565" role="group" aria-label="Fair: move the animals onto the stilts"
 onPointerMove={e=>{const g=gesture.current;if(!g)return;const p=point(e);const dx=p.x-g.x,dy=p.y-g.y;if(Math.abs(dx)+Math.abs(dy)>5)g.moved=true;if(g.moved)setDrag({animal:g.animal,dx,dy});}}
 onPointerUp={e=>{const g=gesture.current;if(!g)return;const p=point(e);gesture.current=null;setDrag(null);if(disabled)return;if(g.moved){const index=ladders.findIndex(x=>p.x>=x-8&&p.x<=x+108);if(p.y>=-20&&p.y<=530&&(index>=0||p.x<510))place(g.animal,index);}else select(g.animal);}}
 onPointerCancel={()=>{gesture.current=null;setDrag(null)}}>
 <image href="/games/bebras/fair/board.svg" x="-100" y="0" width="1328.266" height="500"/>
 {ladders.map((x,i)=><g key={i} role="button" tabIndex={disabled?-1:0} aria-label={`Ladder ${i+1}: ${slots[i]||'empty'}`} onClick={()=>{if(picked!==null)place(picked,i)}} onKeyDown={e=>{if((e.key==='Enter'||e.key===' ')&&picked!==null){e.preventDefault();place(picked,i)}}}><rect x={x} y="0" width="100" height="500" fill={picked!==null?'#7953b210':'transparent'} stroke={picked!==null?'#7953b2':'transparent'} strokeDasharray="7 5"/><text x={x+50} y="530" textAnchor="middle" fontSize="22">{i+1}</text></g>)}
 {[0,1,2,3,4].sort((a,b)=>(a===drag?.animal?1:0)-(b===drag?.animal?1:0)).map(animal=>{const index=slots.indexOf(fairNames[animal]);const dx=index<0?0:ladders[index]-homes[animal],dy=index<0?0:feet[index]-500;const moving=drag?.animal===animal?drag:null;return <g key={animal} role="button" tabIndex={disabled?-1:0} aria-label={`${fairNames[animal]}, ${index<0?'on ground':`on ladder ${index+1}`}`} aria-pressed={picked===animal} transform={`translate(${dx+(moving?.dx??0)} ${dy+(moving?.dy??0)})`} style={{cursor:disabled?'default':'grab'}} onPointerDown={e=>{if(disabled)return;e.preventDefault();e.stopPropagation();const p=point(e);gesture.current={animal,x:p.x,y:p.y,moved:false};svg.current!.setPointerCapture(e.pointerId);}} onClick={e=>e.stopPropagation()} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(animal)}}}>
 <image href={`/games/bebras/fair/animal-${animal}.svg`} x="-100" y="0" width="1328.266" height="500" pointerEvents="none"/>
 <rect x={homes[animal]} y={500-heights[animal]} width="100" height={heights[animal]} rx="8" fill="transparent" stroke={picked===animal?'#7953b2':'transparent'} strokeWidth="4"/>
 </g>})}
 </svg></div><p role="status" className={s.hint}>{picked===null?'Select or drag any animal to move it.':`${fairNames[picked]} selected. Choose a ladder or return it to the ground.`}</p><div className={s.submitRow}><button type="button" className={s.secondary} disabled={disabled||picked===null} onClick={()=>{if(picked!==null)place(picked,-1)}}>Return selected animal to ground</button><button type="button" className={s.secondary} disabled={disabled} onClick={()=>{onChange([]);setPicked(null);setDrag(null);gesture.current=null}}>Reset animals</button></div></div>;
}
