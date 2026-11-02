import { createHash } from 'node:crypto';
export type GlobalClimb = { id: string; learnerId: string; leaps: number; startLeap: number; correct: number; attempts: number; streak: number; elapsed: number; practice: string; pace: string; scope: string };
export function explorerName(id: string) { return `Explorer ${createHash('sha256').update(`leaper-global:${id}`).digest('hex').slice(0, 10).toUpperCase()}`; }
export function stageFor(leaps: number) {
  return leaps >= 150 ? 'Stars reached' : leaps >= 100 ? 'Moon to the stars' : leaps >= 80 ? 'Near space' : leaps >= 60 ? 'High atmosphere' : leaps >= 40 ? 'Cloud peaks' : leaps >= 20 ? 'Misty mountains' : 'Jungle canopy';
}
export function rankGlobalClimbs(rows: GlobalClimb[], viewer: string) {
  const compare = (a: GlobalClimb, b: GlobalClimb) => b.leaps-a.leaps || b.correct/b.attempts-a.correct/a.attempts || b.streak-a.streak || a.elapsed-b.elapsed || a.id.localeCompare(b.id);
  const best = new Map<string, GlobalClimb>();
  for(const row of rows) {
    if(!row.id || !row.learnerId || ![row.leaps,row.startLeap,row.correct,row.attempts,row.streak,row.elapsed].every(Number.isSafeInteger) || row.leaps<=row.startLeap || row.leaps>150 || row.startLeap<0 || row.correct<=0 || row.attempts<row.correct || row.streak<0 || row.elapsed<=0) continue;
    if(!['all','home','top','bottom'].includes(row.practice) || !['easy','medium','hard','relaxed','steady','speedy','falls'].includes(row.pace) || !['full','letters','words'].includes(row.scope)) continue;
    const old=best.get(row.learnerId);if(!old || compare(row,old)<0)best.set(row.learnerId,row);
  }
  const ranked=[...best.values()].sort(compare).map((r,i)=>({rank:i+1,username:explorerName(r.learnerId),leaps:r.leaps,stage:stageFor(r.leaps),accuracy:r.correct/r.attempts*100,streak:r.streak,elapsed:r.elapsed,practice:r.practice,pace:r.pace,scope:r.scope,you:r.learnerId===viewer}));
  return {entries:ranked.slice(0,50),personal:ranked.find(r=>r.you)??null,total:ranked.length};
}
