import { challengesFor, type ChallengeSet, type Answer } from './challenges.ts';
export type Run = {setId?:ChallengeSet;classId:string;version:number;startedAt:number;finishedAt:number|null;lastSeen:number;active:boolean;current:number;answers:Record<string,Answer>;changes:Record<string,number>;activeMs:Record<string,number>;visits:Record<string,number>};
export function newRun(classId:string,now:number,setId:ChallengeSet='juniors'):Run{const challenges=challengesFor(setId);return {setId,classId,version:0,startedAt:now,finishedAt:null,lastSeen:now,active:true,current:0,answers:{},changes:{},activeMs:{},visits:{[challenges[0].id]:1}};}
export function advance(run:Run,input:{current:number;answer?:Answer;next?:number;active:boolean;finish?:boolean},now:number):Run{
 if(run.finishedAt)return run;
 const challenges=challengesFor(run.setId);
 const r:Run=structuredClone(run);const old=challenges[r.current].id;
 // Heartbeats arrive every 15s while visible and recently used. Bound gaps so
 // closing a laptop or losing the network cannot accrue hours of active time.
 const delta=now-r.lastSeen;
 if(r.active&&delta>=0&&delta<=30000)r.activeMs[old]=(r.activeMs[old]??0)+delta;
 if(input.answer!==undefined){const id=challenges[input.current].id;if(JSON.stringify(r.answers[id])!==JSON.stringify(input.answer)){r.answers[id]=input.answer;r.changes[id]=(r.changes[id]??0)+1;}}
 if(input.next!==undefined&&input.next!==r.current){r.current=input.next;const id=challenges[r.current].id;r.visits[id]=(r.visits[id]??0)+1;}
 r.active=input.active;r.lastSeen=now;r.version++;
 if(input.finish){r.finishedAt=now;r.active=false;}
 return r;
}
