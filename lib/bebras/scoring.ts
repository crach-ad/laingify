// Server-side answer key. Never import this module into the learner client.
import { challengesFor, type ChallengeSet, type Answer } from './challenges.ts';
const keys: Answer[] = ['Purple Diamond','DACB','lighthouse',['Green','Red','Orange','Purple stars'],['D · blue hat','B · yellow hat','E · purple hat','C · green hat','','A · red hat'],'A','C','House D','11','3','First Severin, then Ladina.','R M',['0','1','3','4','5','6','7','8','9','11','13','16','18'],['Royal Palace','City Hall','South Gate','Namsan Tower','East Gate Market'],'D'];
const castorKeys:Answer[]=['B',['Single bell','Branch','Double bell','Flower'],'A','C',keys[0],keys[1],keys[5],keys[3],keys[8],'A',keys[6],keys[7]];
const normalize=(s:string)=>s.trim().toLowerCase().replace(/\s+/g,' ');
export function scoreAnswer(index:number,answer:Answer|undefined,set:ChallengeSet='juniors'):boolean {
 const key=(set==='castors'?castorKeys:keys)[index]; if(key===undefined || answer===undefined)return false;
 if(Array.isArray(key)) {if(!Array.isArray(answer))return false;const a=set==='juniors'&&index===12?[...answer].sort():answer;const k=set==='juniors'&&index===12?[...key].sort():key;return JSON.stringify(a)===JSON.stringify(k);}
 return typeof answer==='string' && normalize(answer)===normalize(key);
}
export function validAnswer(index:number,value:unknown,set:ChallengeSet='juniors'):value is Answer {
 const c=challengesFor(set)[index];if(!c)return false;
 if(['planes','fair','grid','route','drawings'].includes(c.kind)){
  if(!Array.isArray(value)||value.length>25||!value.every(v=>typeof v==='string'&&v.length<80))return false;
  if(c.kind==='drawings')return value.length<=4&&value.every(v=>v===''||c.options?.includes(v))&&new Set(value.filter(Boolean)).size===value.filter(Boolean).length;
  if(c.kind==='grid')return value.every(v=>/^(?:[0-9]|1[0-9]|2[0-4])$/.test(v)&&v!=='21'&&v!=='23')&&new Set(value).size===value.length;
  return true;
 }
 if(typeof value!=='string'||value.length>200)return false;
 if(c.options)return value===''||c.options.includes(value);
 return true;
}
export const explanationNotes:Record<number,string>={4:'The source explanation contains a typo: C belongs on stilts 4, as shown in its diagram (6 + 7 = 13), not stilts 5. Laingify scores the diagram and height rule.'};
export function results(answers:Record<string,Answer>,set:ChallengeSet='juniors'){return challengesFor(set).map((c,i)=>({id:c.id,title:c.title,correct:scoreAnswer(i,answers[c.id],set),answer:answers[c.id]??'',expected:(set==='castors'?castorKeys:keys)[i],note:set==='juniors'?explanationNotes[i]??null:null,skills:c.skills}));}
