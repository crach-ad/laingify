import {skillTotals,emptySkills,type SkillReport} from "./ember-skills.ts";
export type RunnerStats = { distance: number; apples: number; combo: number; score: number; elapsed: number; hearts: number; chain: number; shield: boolean; speed: number };
export type RunnerScore = Pick<RunnerStats, "distance" | "apples" | "combo" | "score" | "elapsed"> & { id: string; playerId: string; nickname: string; mode: string; skills?: SkillReport };
export const initialRunnerStats: RunnerStats = { distance:0, apples:0, combo:0, score:0, elapsed:0, hearts:3, chain:0, shield:false, speed:7 };
export function runnerPoints(distance:number, apples:number, combo:number) { return distance + apples*50 + combo*25; }
export function validRunnerScore(value: unknown): value is RunnerScore {
  if(!value || typeof value!=="object")return false;
  const s=value as RunnerScore;
  return [s.id,s.playerId,s.nickname,s.mode].every(v=>typeof v==="string") && /^[\w-]{8,80}$/.test(s.id) && /^[\w-]{8,80}$/.test(s.playerId) && /^[a-zA-Z0-9 _-]{2,20}$/.test(s.nickname) && ["cruise","rush"].includes(s.mode) && [s.distance,s.apples,s.combo,s.score,s.elapsed].every(Number.isSafeInteger) && s.distance>=0 && s.distance<=1000000 && s.apples>=0 && s.apples<=100000 && s.combo>=0 && s.combo<=s.apples && s.elapsed>=1 && s.elapsed<=86400000 && s.score===runnerPoints(s.distance,s.apples,s.combo);
}
export function rankRunnerScores<T extends RunnerScore>(rows:T[]) {
 const seen=new Set<string>();
 return [...rows].sort((a,b)=>skillTotals(b.skills||emptySkills()).correct-skillTotals(a.skills||emptySkills()).correct||skillTotals(b.skills||emptySkills()).accuracy-skillTotals(a.skills||emptySkills()).accuracy||b.score-a.score||b.distance-a.distance||a.elapsed-b.elapsed).filter(r=>{if(seen.has(r.playerId))return false;seen.add(r.playerId);return true;}).slice(0,20);
}
// Every obstacle row leaves an escape lane. Alternating patterns avoid dead ends.
export function runnerRow(row:number, random:number) { const safe=Math.min(2,Math.max(0,Math.floor(random*3))); return {safe, blocked: row<5 || row%3===0 ? [(safe+1)%3] : [0,1,2].filter(l=>l!==safe)}; }
