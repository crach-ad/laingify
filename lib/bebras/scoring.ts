// Server-side answer key. Never import this module into the learner client.
import { challengesFor, type ChallengeSet, type Answer } from './challenges.ts';
const keys: Answer[] = ['Purple Diamond','DACB','lighthouse',['Green','Red','Orange','Purple stars'],['D · blue hat','B · yellow hat','E · purple hat','C · green hat','','A · red hat'],'A','C','House D','11','3','First Severin, then Ladina.','R M',['0','1','3','4','5','6','7','8','9','11','13','16','18'],['Royal Palace','City Hall','South Gate','Namsan Tower','East Gate Market'],'D'];
const castorKeys:Answer[]=['B',['Single bell','Branch','Double bell','Flower'],'A','C',keys[0],keys[1],keys[5],keys[3],keys[8],'A',keys[6],keys[7]];
const juniors2024Keys:Answer[]=[['White','Black','Black'],'B','1','D',['','','','','Ship','','',''],['Red','Yellow','Blue'],['','Right','Right','','Up','','','','',''],['Mushrooms','Cheese','Onions'],['1','2','5','7'],'5',['ABC','123','123','Yes / No','Yes / No'],['James','Emma','Diana','Lee','Hannah','Bella','Alice','Raul','Maya'],'C',['Green broad tree','Mint tree','Dark green tree','Square tree','Pink tree'],['Ana','Cene','Darja','Beti','Emil'],'If there is a slice of pizza, there is no crown.',['no beaver swam in the pond with the waterfall.'],'Alfred wore a tie or he used a walking stick.'];
const castors2024Keys:Answer[]=[['Skewer 3','Skewer 2','Skewer 4','Skewer 1'],'B','C','D','B',...([1,5,2,3,0,7,9,6,11,8].map(i=>juniors2024Keys[i]))];
const keysFor=(set:ChallengeSet)=>set==='castors-2024'?castors2024Keys:set==='juniors-2024'?juniors2024Keys:set==='castors'?castorKeys:keys;
const normalize=(s:string)=>s.trim().toLowerCase().replace(/\s+/g,' ');
export function scoreAnswer(index:number,answer:Answer|undefined,set:ChallengeSet='juniors'):boolean {
 const key=keysFor(set)[index]; if(key===undefined || answer===undefined)return false;
 if((set==='juniors-2024'&&index===2)||(set==='castors-2024'&&index===7))return answer==='1'||answer==='6';
 if(Array.isArray(key)) {if(!Array.isArray(answer))return false;const a=(set==='juniors'&&index===12)||challengesFor(set)[index].kind==='multi'?[...answer].sort():answer;const k=(set==='juniors'&&index===12)||challengesFor(set)[index].kind==='multi'?[...key].sort():key;return JSON.stringify(a)===JSON.stringify(k);}
 return typeof answer==='string' && normalize(answer)===normalize(key);
}
export function validAnswer(index:number,value:unknown,set:ChallengeSet='juniors'):value is Answer {
 const c=challengesFor(set)[index];if(!c)return false;
 if(c.kind==='placement'||c.kind==='matching'||c.kind==='multi'){
  if(!Array.isArray(value)||value.length>(c.kind!=='multi'?c.slotLabels!.length:(c.selectionLimit??c.options!.length))||!value.every(v=>typeof v==='string'&&(v===''&&c.kind!=='multi'||c.options!.includes(v))))return false;
  return c.options!.every((o,i)=>value.filter(v=>v===o).length<=(c.kind!=='multi'?(c.limits?.[i]??1):1));
 }
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
export function results(answers:Record<string,Answer>,set:ChallengeSet='juniors'){return challengesFor(set).map((c,i)=>({id:c.id,title:c.title,correct:scoreAnswer(i,answers[c.id],set),answer:answers[c.id]??'',expected:keysFor(set)[i],note:((set==='juniors-2024'&&i===2)||(set==='castors-2024'&&i===7))?'Either dot 1 (mast top) or dot 6 (centre of the hull) is a valid start.':set==='juniors'?explanationNotes[i]??null:null,alternatives:((set==='juniors-2024'&&i===2)||(set==='castors-2024'&&i===7))?['1','6']:undefined,skills:c.skills}));}
