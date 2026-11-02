import { createHash } from 'node:crypto';
export type GlobalClimb = { id: string; learnerId: string; leaps: number; startLeap: number; correct: number; attempts: number; streak: number; elapsed: number; practice: string; pace: string; scope: string; yearGroup?: string | null };
export function explorerName(id: string) { return `Explorer ${createHash('sha256').update(`leaper-global:${id}`).digest('hex').slice(0, 10).toUpperCase()}`; }
export function stageFor(leaps: number) {
  return leaps >= 150 ? 'Stars reached' : leaps >= 100 ? 'Moon to the stars' : leaps >= 80 ? 'Near space' : leaps >= 60 ? 'High atmosphere' : leaps >= 40 ? 'Cloud peaks' : leaps >= 20 ? 'Misty mountains' : 'Jungle canopy';
}
export function yearGroupFromClass(name: string): string | null {
  if (/\breception\b/i.test(name)) return 'Reception';
  if (/\bkindergarten\b/i.test(name)) return 'Kindergarten';
  const match = name.match(/\b(years?|yrs?\.?|grades?)\s*(\d{1,2})([a-z]?)(?:\s*([&/–-])\s*(?:(?:year|yr|grade)\.?\s*)?(\d{1,2})[a-z]?)?/i);
  if (!match) return null;
  const first = Number(match[2]), second = match[5] ? Number(match[5]) : first;
  if (first < 1 || first > 13 || second < 1 || second > 13) return null;
  const label = /^grade/i.test(match[1]) ? 'Grade' : 'Year';
  return first === second ? `${label} ${first}` : `${label}s ${first} & ${second}`;
}
export function rankGlobalClimbs(rows: GlobalClimb[], viewer: string, pace = 'easy') {
  const compare = (a: GlobalClimb, b: GlobalClimb) => b.leaps-a.leaps || b.correct/b.attempts-a.correct/a.attempts || b.streak-a.streak || a.elapsed-b.elapsed || a.id.localeCompare(b.id);
  const best = new Map<string, GlobalClimb>();
  for(const stored of rows) {
    const row = stored.pace === 'relaxed' ? { ...stored, pace: 'easy' } : stored;
    if (!['easy','medium','hard'].includes(pace) || row.pace !== pace) continue;
    if(!row.id || !row.learnerId || ![row.leaps,row.startLeap,row.correct,row.attempts,row.streak,row.elapsed].every(Number.isSafeInteger) || row.leaps<=row.startLeap || row.leaps>150 || row.startLeap<0 || row.correct<=0 || row.attempts<row.correct || row.streak<0 || row.elapsed<=0) continue;
    if(!['all','home','top','bottom'].includes(row.practice) || !['easy','medium','hard','relaxed','steady','speedy','falls'].includes(row.pace) || !['full','letters','words'].includes(row.scope)) continue;
    const old=best.get(row.learnerId);if(!old || compare(row,old)<0)best.set(row.learnerId,row);
  }
  const ranked=[...best.values()].sort(compare).map((r,i)=>({rank:i+1,username:explorerName(r.learnerId),yearGroup:r.yearGroup ?? null,leaps:r.leaps,stage:stageFor(r.leaps),accuracy:r.correct/r.attempts*100,streak:r.streak,elapsed:r.elapsed,practice:r.practice,pace:r.pace,scope:r.scope,you:r.learnerId===viewer}));
  return {entries:ranked.slice(0,50),personal:ranked.find(r=>r.you)??null,total:ranked.length};
}
