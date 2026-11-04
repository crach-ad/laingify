import { prisma } from '@/lib/db';
import { BEBRAS_TITLES, setForTitle, challengesFor,hasAnswer } from './challenges';
import { results } from './scoring';
import type { Run } from './state';
export async function loadBebrasReport(classId:string,orgIds:string[],requestedSet?:string|null){
 const klass=await prisma.class.findFirst({where:{id:classId,orgId:{in:orgIds}},include:{roster:{include:{learner:{select:{id:true,displayName:true}}}},modules:{where:{module:{title:{in:BEBRAS_TITLES}}},include:{module:true}}}});
 if(!klass)return null;
 const assignments=[...klass.modules].sort((a,b)=>a.order-b.order||a.id.localeCompare(b.id));
 const selected=requestedSet?assignments.find(a=>setForTitle(a.module.title)===requestedSet):assignments[0];
 if(!selected)return null;
 const events=await prisma.learnerEvent.findMany({where:{type:'bebras_session',moduleId:selected.moduleId,id:{startsWith:`bebras:${classId}:`},learnerId:{in:klass.roster.map(r=>r.learnerId)}},orderBy:{createdAt:'desc'}});
 const sessions=events.flatMap(e=>{try{const run:Run=JSON.parse(e.meta);if(run.classId!==classId)return [];return [{id:e.id,learnerId:e.learnerId,run,results:results(run.answers,run.setId)}]}catch{return []}});
 return {klass,sessions,setId:setForTitle(selected.module.title),sets:assignments.map(a=>setForTitle(a.module.title))};
}
export function csvCell(v:unknown){let text=String(v??'');if(/^[=+@\-\t\r]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';}
export function reportCsv(data:NonNullable<Awaited<ReturnType<typeof loadBebrasReport>>>){
 const rows:unknown[][]=[['Class','Student','Session','Started UTC','Finished UTC','Status','Challenge','Answer','Outcome','Answer revisions','Visits','Active seconds','Session elapsed seconds','Thinking skills']];
 for(const roster of data.klass.roster){const sessions=data.sessions.filter(s=>s.learnerId===roster.learnerId);if(!sessions.length){rows.push([data.klass.name,roster.learner.displayName,'','','','Not started']);continue;}
 for(const session of sessions)for(const [i,c] of challengesFor(session.run.setId).entries()){const r=session.run;const a=r.answers[c.id];rows.push([data.klass.name,roster.learner.displayName,session.id,new Date(r.startedAt).toISOString(),r.finishedAt?new Date(r.finishedAt).toISOString():'',r.finishedAt?'Finished':'In progress',c.title,Array.isArray(a)?a.join(' | '):a??'',!hasAnswer(a)?'Unanswered':session.results[i].correct?'Correct':'Incorrect',Math.max(0,(r.changes[c.id]??0)-1),r.visits[c.id]??0,Math.round((r.activeMs[c.id]??0)/1000),Math.round(((r.finishedAt??r.lastSeen)-r.startedAt)/1000),c.skills.join(' | ')]);}}
 return rows.map(r=>r.map(csvCell).join(',')).join('\r\n');
}
