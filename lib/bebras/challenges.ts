import juniors2024Content from './juniors-2024.json' with { type: 'json' };
import castorsContent from './castors.json' with { type: 'json' };
import content from './content.json' with { type: 'json' };
export const BEBRAS_TITLE = 'Bebras Juniors 2025';
export const BEBRAS_TOPIC = 'Computational Thinking';
export type Answer = string | string[];
export type Challenge = typeof content[number] & { kind: 'choice' | 'text' | 'number' | 'planes' | 'fair' | 'grid' | 'route' | 'drawings' | 'placement' | 'multi' | 'hotspots'; slotLabels?: string[]; limits?: number[]; selectionLimit?: number; boardImage?: string; spots?: {x:number;y:number;w?:number;h?:number}[]; targetImages?: string[]; options?: string[]; optionImages?: string[] };
const kinds: Challenge['kind'][] = ['choice','choice','text','planes','fair','choice','choice','choice','choice','number','choice','choice','grid','route','choice'];
const options: Record<number,string[]> = {
  1:['Orange Star','Green Triangle','Blue Pentagon','Purple Diamond','Red Ellipse'],
  2:['ABDC','BCAD','CDBA','DACB'],6:['A','B','C','D'],7:['A','B','C','D'],8:['House A','House B','House C','House D'],9:['10','11','12','13'],
  11:['Ladina only.','First Severin, then Quirnia.','First Severin, then Ladina.','First Quirina, then Severin, then Ladina.'],12:['M R','R R R M','R M','M R M R M R'],15:['A','B','C','D'],
};
export const challenges: Challenge[] = content.map((c,i)=>({...c,kind:kinds[i],options:options[c.number],...([6,7].includes(c.number)?{optionImages:[0,1,2,3].map(n=>`/games/bebras/${c.id}-option-${n}.png`)}:{})}));
export const planeNames=['Green','Red','Orange','Purple stars'];
export const fairNames=['A · red hat','B · yellow hat','C · green hat','D · blue hat','E · purple hat'];
export const places=['Royal Palace','City Hall','South Gate','Namsan Tower','East Gate Market','History Museum','Folk Village'];
export const gridWalls = [[1,2],[7,12],[12,13],[16,17],[22,23],[14,19]];
export function hasAnswer(answer: Answer | undefined): boolean { return Array.isArray(answer) ? answer.some(Boolean) : typeof answer==='string' && answer.trim().length>0; }
export function formatTime(ms:number){const secs=Math.max(0,Math.floor(ms/1000)); return `${Math.floor(secs/60)}:${String(secs%60).padStart(2,'0')}`;}

export type ChallengeSet = 'juniors' | 'castors' | 'juniors-2024';
export const BEBRAS_TITLES = [BEBRAS_TITLE, 'Bebras Castors 2025', 'Bebras Juniors 2024'];
export function setForTitle(title:string):ChallengeSet {return title==='Bebras Juniors 2024'?'juniors-2024':title==='Bebras Castors 2025'?'castors':'juniors';}
const castors:Challenge[]=castorsContent.map(c=>({...('juniorIndex' in c && typeof c.juniorIndex==='number'?challenges[c.juniorIndex]:{}),...c})) as Challenge[];
export function challengesFor(set:ChallengeSet='juniors'):Challenge[]{return set==='juniors-2024'?juniors2024Content as Challenge[]:set==='castors'?castors:challenges;}
export function titleFor(set:ChallengeSet){return set==='juniors-2024'?'Bebras Juniors 2024':set==='castors'?'Bebras Castors 2025':BEBRAS_TITLE;}
