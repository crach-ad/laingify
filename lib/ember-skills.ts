export const SKILL_KEYS=["left","right","drag","highlight"] as const;
export type MouseSkill=typeof SKILL_KEYS[number];
export const SKILL_NAMES:Record<MouseSkill,string>={left:"Left click",right:"Right click",drag:"Drag & drop",highlight:"Highlight text"};
export type SkillResult={correct:number;attempts:number;assisted:number;level:number};
export type SkillReport=Record<MouseSkill,SkillResult>;
export function emptySkills():SkillReport{return Object.fromEntries(SKILL_KEYS.map(k=>[k,{correct:0,attempts:0,assisted:0,level:0}])) as SkillReport;}
export function validSkills(value:unknown):value is SkillReport{
 if(!value||typeof value!=="object")return false;const report=value as SkillReport;
 return SKILL_KEYS.every(k=>{const r=report[k];return r&&[r.correct,r.attempts,r.assisted,r.level].every(Number.isSafeInteger)&&r.correct>=0&&r.correct<=3000&&r.attempts>=r.correct&&r.attempts<=30000&&r.assisted>=0&&r.assisted<=r.correct&&r.level>=0&&r.level<=3&&(r.level===0||r.correct>=3);});
}
export function skillTotals(report:SkillReport){const rows=SKILL_KEYS.map(k=>report[k]);const correct=rows.reduce((n,r)=>n+r.correct,0),attempts=rows.reduce((n,r)=>n+r.attempts,0);return{correct,attempts,accuracy:attempts?Math.round(correct/attempts*100):0};}
export function mergeSkills(reports:SkillReport[]):SkillReport{const result=emptySkills();for(const r of reports)if(validSkills(r))for(const k of SKILL_KEYS){result[k].correct+=r[k].correct;result[k].attempts+=r[k].attempts;result[k].assisted+=r[k].assisted;result[k].level=Math.max(result[k].level,r[k].level);}return result;}
export function selectedTextMatches(selected:string,target:string){return selected.trim().replace(/\s+/g," ")===target;}
export function pointInside(x:number,y:number,rect:{left:number;right:number;top:number;bottom:number}){return x>=rect.left&&x<=rect.right&&y>=rect.top&&y<=rect.bottom;}
