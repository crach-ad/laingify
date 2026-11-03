// Opt-in integration check. Creates an isolated test org, never uses student
// identities, and removes only records it created in its finally block.
// BEBRAS_TEST_BASE_URL=http://localhost:3108 node --env-file=... tests/bebras-api.mjs
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import { signToken } from '../lib/signed-token.ts';
import { challenges } from '../lib/bebras/challenges.ts';
import { results } from '../lib/bebras/scoring.ts';
const base=process.env.BEBRAS_TEST_BASE_URL;if(!base||!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(base))throw Error('Explicit localhost BEBRAS_TEST_BASE_URL required.');
const p=new PrismaClient();let org,klass,learner,mod,teacher;
try{
 org=await p.org.create({data:{name:`Bebras integration ${crypto.randomUUID()}`}});
 klass=await p.class.create({data:{orgId:org.id,name:'Test class',classCode:`TEST-${crypto.randomUUID()}`}});
 learner=await p.learner.create({data:{displayName:'Bebras integration test'}});
 teacher=await p.instructor.create({data:{orgId:org.id,displayName:'Test instructor',email:`${crypto.randomUUID()}@example.invalid`,pin:crypto.randomUUID()}});
 mod=await p.module.create({data:{orgId:org.id,title:'Bebras Juniors 2025',topic:'Computational Thinking',summary:'Test only',badgeName:'Test',criteria:{create:challenges.map((c,i)=>({label:c.title,order:i}))}}});
 await p.rosterEntry.create({data:{learnerId:learner.id,classId:klass.id}});await p.classModule.create({data:{classId:klass.id,moduleId:mod.id}});
 const cookie='ll_session='+signToken('learner',{learnerId:learner.id,classId:klass.id,via:'pin'});
 const headers={'Content-Type':'application/json',origin:base,cookie};
 const post=async b=>{const r=await fetch(base+'/api/bebras',{method:'POST',headers,body:JSON.stringify(b)});return {status:r.status,data:await r.json()}};
 assert.equal((await fetch(base+'/api/bebras')).status,403);
 assert.equal((await fetch(base+'/api/bebras',{method:'POST',headers:{...headers,origin:'https://wrong.invalid'},body:'{}'})).status,403);
 const [a,b]=await Promise.all([post({action:'start'}),post({action:'start'})]);assert.equal(a.status,200);assert.equal(a.data.id,b.data.id);let current=a.data;assert.equal(current.results,null);
 assert.equal((await fetch(`${base}/api/bebras/explanation?session=${current.id}&question=0`,{headers})).status,403);
 const keys=results({});
 for(let i=0;i<15;i++){
  const saved=await post({action:'save',id:current.id,version:current.run.version,current:i,next:Math.min(i+1,14),answer:keys[i].expected,active:true});assert.equal(saved.status,200,JSON.stringify(saved.data));current=saved.data;
 }
 const resumed=await (await fetch(base+'/api/bebras',{headers})).json();assert.deepEqual(resumed.run.answers,current.run.answers);assert.equal(resumed.results,null);
 const conflict=await post({action:'save',id:current.id,version:0,current:14,answer:'A',active:true});assert.equal(conflict.status,409);
 const body={action:'finish',id:current.id,version:current.run.version,current:14,answer:'D',active:true};const finished=await Promise.all([post(body),post(body)]);for(const r of finished){assert.equal(r.status,200);assert.equal(r.data.results.filter(a=>a.correct).length,15);}
 assert.equal(await p.submission.count({where:{learnerId:learner.id,moduleId:mod.id}}),1);
 assert.equal(await p.criterionStatus.count({where:{learnerId:learner.id,status:'MET'}}),15);
 assert.equal((await p.moduleProgress.findUnique({where:{learnerId_moduleId:{learnerId:learner.id,moduleId:mod.id}}})).status,'COMPLETED');
 assert.equal((await fetch(`${base}/api/bebras/explanation?session=${current.id}&question=0`,{headers})).status,200);
 const teacherCookie='ll_instructor='+signToken('instructor',{instructorId:teacher.id});
 const csv=await fetch(`${base}/instruct/class/${klass.id}/bebras/export`,{headers:{cookie:teacherCookie}});assert.equal(csv.status,200);assert.match(await csv.text(),/Bebras integration test/);
 assert.equal((await fetch(`${base}/instruct/class/cmt06zgcb0015gje41z4tehez/bebras/export`,{headers:{cookie:teacherCookie}})).status,404);
 const retake=await post({action:'start',previousId:current.id});assert.equal(retake.status,200);assert.notEqual(retake.data.id,current.id);assert.equal(await p.learnerEvent.count({where:{learnerId:learner.id,type:'bebras_session'}}),2);
 console.log('PASS: auth, origin, concurrent start/finish, all 15 answers, resume, conflicts, grading, completion, protected explanations, teacher CSV isolation, retakes.');
}finally{
 if(learner){await p.criterionStatus.deleteMany({where:{learnerId:learner.id}});await p.learnerEvent.deleteMany({where:{learnerId:learner.id}});await p.submission.deleteMany({where:{learnerId:learner.id}});await p.moduleProgress.deleteMany({where:{learnerId:learner.id}});await p.rosterEntry.deleteMany({where:{learnerId:learner.id}});await p.learner.delete({where:{id:learner.id}});}
 if(mod){await p.classModule.deleteMany({where:{moduleId:mod.id}});await p.criterion.deleteMany({where:{moduleId:mod.id}});await p.module.delete({where:{id:mod.id}});}
 if(teacher)await p.instructor.delete({where:{id:teacher.id}});
 if(klass)await p.class.delete({where:{id:klass.id}});if(org)await p.org.delete({where:{id:org.id}});await p.$disconnect();
}
