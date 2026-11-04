import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { bebrasAccess } from '@/lib/bebras/access';
import { prisma } from '@/lib/db';
import { challengesFor } from '@/lib/bebras/challenges';
export async function GET(req:Request){
 const ctx=await bebrasAccess(new URL(req.url).searchParams.get('set'));if(!ctx)return new Response('Sign in to your assigned class.',{status:403});
 const challenges=challengesFor(ctx.setId);
 const p=new URL(req.url).searchParams;const q=Number(p.get('question'));if(!p.has('question')||!Number.isInteger(q)||q<0||q>=challenges.length)return new Response('Not found',{status:404});
 const row=await prisma.learnerEvent.findFirst({where:{id:p.get('session')??'',type:'bebras_session',learnerId:ctx.session.learnerId,moduleId:ctx.assignment.moduleId}});
 if(!row)return new Response('Not found',{status:404});const run=JSON.parse(row.meta);
 if(!run.finishedAt||run.classId!==ctx.session.classId)return new Response('Finish the session before viewing answers.',{status:403});
 const bytes=await readFile(path.join(process.cwd(),'content/bebras/explanations',`${challenges[q].id}-review.png`));
 return new Response(bytes,{headers:{'Content-Type':'image/png','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
