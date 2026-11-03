import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { bebrasAccess } from '@/lib/bebras/access';
import { challenges } from '@/lib/bebras/challenges';
import { newRun, advance, type Run } from '@/lib/bebras/state';
import { validAnswer, results, answerFeedback } from '@/lib/bebras/scoring';
const json=(v:unknown,status=200)=>NextResponse.json(v,{status,headers:{'Cache-Control':'private, no-store'}});
function response(id:string,run:Run){return {id,run,serverNow:Date.now(),results:run.finishedAt?results(run.answers):null,checks:Object.fromEntries(challenges.map((c,i)=>[c.id,answerFeedback(i,run.answers[c.id])]))};}
export async function GET(){
 try{const ctx=await bebrasAccess();if(!ctx)return json({error:'Sign in to an assigned class.'},403);
 const row=await prisma.learnerEvent.findFirst({where:{learnerId:ctx.session.learnerId,moduleId:ctx.assignment.moduleId,type:'bebras_session',id:{startsWith:`bebras:${ctx.session.classId}:`}},orderBy:{createdAt:'desc'}});
 return json(row?response(row.id,JSON.parse(row.meta)):null);
 }catch{return json({error:'Could not load your session. Please retry.'},503);}
}
export async function POST(req:Request){
 if(req.headers.get('origin')!==new URL(req.url).origin)return json({error:'Invalid origin.'},403);
 try{
  const ctx=await bebrasAccess();if(!ctx)return json({error:'Sign in to an assigned class.'},403);
  const text=await req.text();if(text.length>5000)return json({error:'Request too large.'},413);
  let b;try{b=JSON.parse(text);}catch{return json({error:'Invalid JSON.'},400);}
  if(!b||!['start','save','finish','check'].includes(b.action))return json({error:'Invalid action.'},400);
  if(b.action==='check'){
   if(!Number.isInteger(b.question)||b.question<0||b.question>=challenges.length||!validAnswer(b.question,b.answer))return json({error:'Invalid response.'},400);
   return json({correct:answerFeedback(b.question,b.answer)});
  }
  if(b.action!=='start' && (typeof b.id!=='string'||!Number.isInteger(b.version)||!Number.isInteger(b.current)||b.current<0||b.current>=challenges.length||typeof b.active!=='boolean'||(b.next!==undefined&&(!Number.isInteger(b.next)||b.next<0||b.next>=challenges.length))||(b.answer!==undefined&&!validAnswer(b.current,b.answer))))return json({error:'Invalid response.'},400);
  const {learnerId,classId}=ctx.session;const moduleId=ctx.assignment.moduleId;
  const output=await prisma.$transaction(async tx=>{
   // Serialize all tabs for this learner and module, including double Start.
   await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`bebras:${classId}:${learnerId}:${moduleId}`}))`;
   if(b.action==='start'){
    const previous=await tx.learnerEvent.findFirst({where:{learnerId,moduleId,type:'bebras_session',id:{startsWith:`bebras:${classId}:`}},orderBy:{createdAt:'desc'}});
    if(previous){const run:Run=JSON.parse(previous.meta);if(!run.finishedAt)return {data:response(previous.id,run),status:200};
     if(b.previousId!==previous.id)return {data:response(previous.id,run),status:200};}
    const run=newRun(classId,Date.now());const row=await tx.learnerEvent.create({data:{id:`bebras:${classId}:${crypto.randomUUID()}`,learnerId,moduleId,type:'bebras_session',meta:JSON.stringify(run)}});
    await tx.moduleProgress.upsert({where:{learnerId_moduleId:{learnerId,moduleId}},create:{learnerId,moduleId},update:{}});
    return {data:response(row.id,run),status:200};
   }
   const row=await tx.learnerEvent.findFirst({where:{id:b.id,learnerId,moduleId,type:'bebras_session'}});if(!row)return {data:{error:'Session not found.'},status:404};
   const current:Run=JSON.parse(row.meta);if(current.classId!==classId)return {data:{error:'Wrong class.'},status:403};
   if(current.finishedAt)return {data:response(row.id,current),status:200};
   if(current.version!==b.version)return {data:{error:'Your session changed in another tab. Reload before continuing.',...response(row.id,current)},status:409};
   if(current.current!==b.current)return {data:{error:'Reload to return to your current challenge.'},status:409};
   const run=advance(current,{current:b.current,answer:b.answer,next:b.next,active:b.active,finish:b.action==='finish'},Date.now());
   await tx.learnerEvent.update({where:{id:row.id},data:{meta:JSON.stringify(run)}});
   if(run.finishedAt){
    const scored=results(run.answers);const activeSeconds=Math.round(Object.values(run.activeMs).reduce((a,b)=>a+b,0)/1000);
    await tx.moduleProgress.upsert({where:{learnerId_moduleId:{learnerId,moduleId}},create:{learnerId,moduleId,status:'COMPLETED',completedAt:new Date(run.finishedAt),timeOnTaskSeconds:activeSeconds},update:{status:'COMPLETED',completedAt:new Date(run.finishedAt),timeOnTaskSeconds:{increment:activeSeconds}}});
    const criteria=await tx.criterion.findMany({where:{moduleId},orderBy:{order:'asc'}});
    for(const [i,c] of criteria.entries())if(scored[i]?.correct)await tx.criterionStatus.upsert({where:{learnerId_criterionId:{learnerId,criterionId:c.id}},create:{learnerId,criterionId:c.id,status:'MET',decidedBy:'system'},update:{status:'MET',decidedBy:'system'}});
    await tx.submission.create({data:{learnerId,moduleId,content:`Bebras session ${row.id}: ${scored.filter(r=>r.correct).length}/15 correct. Elapsed ${Math.round((run.finishedAt-run.startedAt)/1000)} seconds; active ${activeSeconds} seconds.\n`+scored.map(r=>`${r.title}: ${r.correct?'Correct':'Not correct / unanswered'} — ${JSON.stringify(r.answer)}`).join('\n')}});
   }
   return {data:response(row.id,run),status:200};
  },{timeout:20000});return json(output.data,output.status);
 }catch{return json({error:'Progress was not confirmed saved. Check your connection and retry.'},503);}
}
