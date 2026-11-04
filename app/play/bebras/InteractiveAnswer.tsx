'use client';
/* eslint-disable @next/next/no-img-element */
import {useState} from 'react';
import type {Answer,Challenge} from '@/lib/bebras/challenges';
import s from './interactive.module.css';

export default function InteractiveAnswer({challenge:c,value,onChange,disabled}:{challenge:Challenge;value:Answer|undefined;onChange:(v:Answer)=>void;disabled:boolean}){
 const [picked,setPicked]=useState('');
 const options=c.options??[];
 const arr=Array.isArray(value)?value:[];
 const slots=(c.slotLabels??[]).map((_,i)=>arr[i]??'');
 function place(i:number,token:string){
  if(disabled||!options.includes(token))return;
  const limit=c.limits?.[options.indexOf(token)]??1;
  const next=[...slots];
  // Moving a unique piece frees its old space. Repeated pieces have a finite supply.
  if(limit===1)next.forEach((v,j)=>{if(v===token)next[j]=''});
  else if(next.filter((v,j)=>v===token&&j!==i).length>=limit)return;
  next[i]=token;onChange(next);setPicked('');
 }
 function tokenContent(token:string){const i=options.indexOf(token);return <>{c.id.endsWith('-robot-path')&&<b aria-hidden="true" className={s.arrow}>{token==='Up'?'↑':'→'}</b>}{c.optionImages?.[i]&&<img src={c.optionImages[i]} alt=""/>}<span>{token}</span></>}
 const clear=<button className={s.clear} type="button" disabled={disabled} onClick={()=>{onChange(c.kind==='hotspots'?'':[]);setPicked('')}}>Clear answer</button>;
 if(c.kind==='multi')return <div><p>Select {c.selectionLimit?`${c.selectionLimit} options`:'all the spaces you choose'}. Select again to remove.</p><div className={s.tokens}>{options.map(o=><button key={o} type="button" disabled={disabled||(!arr.includes(o)&&!!c.selectionLimit&&arr.length>=c.selectionLimit)} aria-pressed={arr.includes(o)} onClick={()=>onChange(arr.includes(o)?arr.filter(v=>v!==o):[...arr,o])}>{tokenContent(o)}</button>)}</div>{clear}</div>;
 if(c.kind==='hotspots')return <div><p>{c.interactionHint??'Select a starting dot on the drawing.'}</p><div className={s.board}><img src={c.boardImage} alt={`${c.title} selection diagram`}/>{c.spots!.map((p,i)=><button key={i} type="button" disabled={disabled} className={s.dot} style={{left:`${p.x}%`,top:`${p.y}%`,width:c.hotspotLabels?44:undefined,height:c.hotspotLabels?44:undefined}} aria-label={c.hotspotLabels?.[i]??`Starting dot ${options[i]}`} aria-pressed={value===options[i]} onClick={()=>onChange(options[i])}/>)}</div>{clear}</div>;
 function target(i:number){const token=slots[i];const p=c.spots?.[i];return <button key={i} type="button" disabled={disabled} className={p?s.target:s.slot} style={p?{left:`${p.x}%`,top:`${p.y}%`,width:p.w?`${p.w}%`:undefined,height:p.h?`${p.h}%`:undefined}:undefined} aria-label={`${c.slotLabels![i]}: ${token||'empty'}`} aria-pressed={!!token} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();place(i,e.dataTransfer.getData('text/plain'))}} onClick={()=>{if(picked)place(i,picked);else if(token){const next=[...slots];next[i]='';onChange(next);setPicked(token)}}}>
 {!p&&<strong>{c.slotLabels![i]}</strong>}{c.targetImages?.[i]&&<img src={c.targetImages[i]} alt={c.slotLabels![i]}/>}{token?tokenContent(token):<span>{p?'○':'Drop here'}</span>}</button>}
 return <div><p>Drag a piece to a space, or select a piece and then a space. Select a placed piece to move or remove it.</p><div className={s.tokens}>{options.map((o,i)=>{const limit=c.limits?.[i]??1;const used=slots.filter(v=>v===o).length;return <button key={o} type="button" disabled={disabled} draggable={!disabled} aria-pressed={picked===o} onDragStart={e=>{e.dataTransfer.setData('text/plain',o);setPicked(o)}} onClick={()=>setPicked(picked===o?'':o)}>{tokenContent(o)}<small>{Math.max(0,limit-used)} available{limit===1&&used?' · move existing':''}</small></button>})}</div>
 <p className={s.status} role="status">{picked?`${picked} selected. Choose a space.`:'Choose a piece to begin.'}</p>
 {c.boardImage?<div className={s.board}><img src={c.boardImage} alt={`${c.title} placement board`}/>{slots.map((_,i)=>target(i))}</div>:<div className={s.slots}>{slots.map((_,i)=>target(i))}</div>}{clear}</div>;
}
