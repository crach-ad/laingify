// Opt-in integration check. Creates an isolated test org, never uses student
// identities, and removes only records it created in its finally block.
// BEBRAS_TEST_BASE_URL=http://localhost:3108 node --env-file=... tests/bebras-api.mjs
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import { signToken } from '../lib/signed-token.ts';
import { challengesFor,titleFor } from '../lib/bebras/challenges.ts';
import { results } from '../lib/bebras/scoring.ts';
const setId=process.env.BEBRAS_TEST_SET==='castors-2024'?'castors-2024':process.env.BEBRAS_TEST_SET==='juniors-2024'?'juniors-2024':process.env.BEBRAS_TEST_SET==='castors'?'castors':'juniors';const challenges=challengesFor(setId);const count=challenges.length;
const base=process.env.BEBRAS_TEST_BASE_URL;if(!base||!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(base))throw Error('Explicit localhost BEBRAS_TEST_BASE_URL required.');
const p=new PrismaClient();let org,klass,learner,mod,teacher,otherMod;
try{
 org=await p.org.create({data:{name:`Bebras integration ${crypto.randomUUID()}`}});
 klass=await p.class.create({data:{orgId:org.id,name:'Test class',classCode:`TEST-${crypto.randomUUID()}`}});
 learner=await p.learner.create({data:{displayName:'Bebras integration test'}});
 teacher=await p.instructor.create({data:{orgId:org.id,displayName:'Test instructor',email:`${crypto.randomUUID()}@example.invalid`,pin:crypto.randomUUID()}});
 mod=await p.module.create({data:{orgId:org.id,title:titleFor(setId),topic:'Computational Thinking',summary:'Test only',badgeName:'Test',criteria:{create:challenges.map((c,i)=>({label:c.title,order:i}))}}});
 await p.rosterEntry.create({data:{learnerId:learner.id,classId:klass.id}});await p.classModule.create({data:{classId:klass.id,moduleId:mod.id}});
 const cookie='ll_session='+signToken('learner',{learnerId:learner.id,classId:klass.id,via:'pin'});
 const headers={'Content-Type':'application/json',origin:base,cookie};
 const post=async b=>{const r=await fetch(base+'/api/bebras',{method:'POST',headers,body:JSON.stringify(b)});return {status:r.status,data:await r.json()}};
 const player=await fetch(base+'/play/bebras',{headers});assert.equal(player.status,200);assert.match(await player.text(),/My modules/);
 const dashboard=await fetch(base+'/learn',{headers});assert.equal(dashboard.status,200);const dashboardHtml=await dashboard.text();assert.doesNotMatch(dashboardHtml,/Mouse Meadow challenge tabs/);assert.match(dashboardHtml,/learn\/topic\/bebras-challenges/);assert.match(dashboardHtml,/Bebras challenges/);
 const topic=await fetch(base+'/learn/topic/bebras-challenges',{headers});assert.equal(topic.status,200);assert.ok((await topic.text()).includes(titleFor(setId)));
 const modulePage=await fetch(base+'/learn/'+mod.id,{headers,redirect:'manual'});assert.equal(modulePage.status,307);assert.equal(modulePage.headers.get('location'),`/play/bebras?set=${setId}`);
 const bookmark=await fetch(base+'/play/mouse/bebras',{headers,redirect:'manual'});assert.equal(bookmark.status,307);assert.equal(bookmark.headers.get('location'),'/play/bebras');
 assert.equal((await fetch(base+'/api/bebras')).status,403);
 assert.equal((await fetch(base+'/api/bebras',{method:'POST',headers:{...headers,origin:'https://wrong.invalid'},body:'{}'})).status,403);
 const [a,b]=await Promise.all([post({action:'start'}),post({action:'start'})]);assert.equal(a.status,200,JSON.stringify(a.data));assert.equal(a.data.id,b.data.id);let current=a.data;assert.equal(current.results,null);
 assert.equal((await fetch(`${base}/api/bebras/explanation?session=${current.id}&question=0`,{headers})).status,403);
 const keys=results({},setId);
 const submit=answer=>post({action:'submit',id:current.id,version:current.run.version,current:0,answer,active:true});
 assert.equal((await submit('')).status,400);
 assert.equal((await submit(undefined)).status,400);
 const wrong=Array.isArray(keys[0].expected)?['']:challenges[0].options.find(v=>v!==keys[0].expected);
 // Use a nonempty, structurally valid incorrect arrangement for array questions.
 const incorrect=Array.isArray(keys[0].expected)?[challenges[0].options.find(v=>v!==keys[0].expected[0])]:wrong;
 const failed=await submit(incorrect);assert.equal(failed.status,200,JSON.stringify(failed.data));current=failed.data;
 assert.equal(current.run.current,0);assert.equal(current.run.checks[challenges[0].id].correct,false);
 assert.equal(current.results,null);assert.ok(!JSON.stringify(current).includes('"expected"'));
 const passed=await submit(keys[0].expected);assert.equal(passed.status,200);current=passed.data;
 assert.deepEqual(current.run.checks[challenges[0].id],{answer:keys[0].expected,correct:true,attempts:2});
 assert.equal(current.results,null);
 assert.equal((await fetch(`${base}/api/bebras/explanation?session=${current.id}&question=0`,{headers})).status,403);

 for(let i=0;i<count;i++){
  const saved=await post({action:'save',id:current.id,version:current.run.version,current:i,next:Math.min(i+1,count-1),answer:keys[i].expected,active:true});assert.equal(saved.status,200,JSON.stringify(saved.data));current=saved.data;
 }
 assert.equal(current.run.checks[challenges[0].id].attempts,2);assert.equal(Object.keys(current.run.checks).length,1);
 const resumed=await (await fetch(base+'/api/bebras',{headers})).json();assert.deepEqual(resumed.run.answers,current.run.answers);assert.equal(resumed.results,null);
 const conflict=await post({action:'save',id:current.id,version:0,current:count-1,answer:keys[count-1].expected,active:true});assert.equal(conflict.status,409);
 const body={action:'finish',id:current.id,version:current.run.version,current:count-1,answer:keys[count-1].expected,active:true};const finished=await Promise.all([post(body),post(body)]);for(const r of finished){assert.equal(r.status,200);assert.equal(r.data.results.filter(a=>a.correct).length,count);}
 assert.equal(await p.submission.count({where:{learnerId:learner.id,moduleId:mod.id}}),1);
 assert.equal(await p.criterionStatus.count({where:{learnerId:learner.id,status:'MET'}}),count);
 assert.equal((await p.moduleProgress.findUnique({where:{learnerId_moduleId:{learnerId:learner.id,moduleId:mod.id}}})).status,'COMPLETED');
 assert.equal((await fetch(`${base}/api/bebras/explanation?session=${current.id}&question=0`,{headers})).status,200);
 const teacherCookie='ll_instructor='+signToken('instructor',{instructorId:teacher.id});
 const csv=await fetch(`${base}/instruct/class/${klass.id}/bebras/export`,{headers:{cookie:teacherCookie}});assert.equal(csv.status,200);assert.match(await csv.text(),/Bebras integration test/);
 assert.equal((await fetch(`${base}/instruct/class/cmt06zgcb0015gje41z4tehez/bebras/export`,{headers:{cookie:teacherCookie}})).status,404);
 const retake=await post({action:'start',previousId:current.id});assert.equal(retake.status,200);assert.notEqual(retake.data.id,current.id);assert.equal(await p.learnerEvent.count({where:{learnerId:learner.id,type:'bebras_session'}}),2);
 // A second assigned sequence must never reuse the first sequence's run or scores.
 const otherSet=setId==='juniors'?'castors':'juniors';
 assert.equal((await fetch(`${base}/api/bebras?set=${otherSet}`,{headers})).status,403);
 otherMod=await p.module.create({data:{orgId:org.id,title:titleFor(otherSet),topic:'Computational Thinking',summary:'Second sequence test',badgeName:'Test'}});
 await p.classModule.create({data:{classId:klass.id,moduleId:otherMod.id,order:1}});
 const hub=await (await fetch(base+'/play/bebras',{headers})).text();assert.match(hub,/Choose your Bebras challenge/);assert.ok(hub.includes(`set=${otherSet}`));
 const otherStart=await fetch(`${base}/api/bebras?set=${otherSet}`,{method:'POST',headers,body:JSON.stringify({action:'start'})});assert.equal(otherStart.status,200);const other=await otherStart.json();assert.equal(other.run.setId,otherSet);assert.notEqual(other.id,retake.data.id);
 const wrongSave=await fetch(`${base}/api/bebras?set=${otherSet}`,{method:'POST',headers,body:JSON.stringify({action:'save',id:retake.data.id,version:0,current:0,active:true})});assert.equal(wrongSave.status,404);
 assert.equal((await fetch(`${base}/api/bebras/explanation?set=${otherSet}&session=${current.id}&question=0`,{headers})).status,404);
 const selected=await (await fetch(`${base}/api/bebras?set=${setId}`,{headers})).json();assert.equal(selected.id,retake.data.id);
 const otherCsv=await (await fetch(`${base}/instruct/class/${klass.id}/bebras/export?set=${otherSet}`,{headers:{cookie:teacherCookie}})).text();assert.ok(otherCsv.includes(other.id));assert.ok(!otherCsv.includes(current.id));
 assert.equal((await fetch(`${base}/api/bebras?set=unassigned`,{headers})).status,403);
 console.log('PASS: multiple assigned sequences keep saves, explanations, and teacher reports isolated.');
 console.log('PASS: auth, origin, concurrent start/finish, all assigned answers, resume, conflicts, grading, completion, protected explanations, teacher CSV isolation, retakes.');
}finally{
 if(learner){await p.sprite.deleteMany({where:{learnerId:learner.id}});await p.criterionStatus.deleteMany({where:{learnerId:learner.id}});await p.learnerEvent.deleteMany({where:{learnerId:learner.id}});await p.submission.deleteMany({where:{learnerId:learner.id}});await p.moduleProgress.deleteMany({where:{learnerId:learner.id}});await p.rosterEntry.deleteMany({where:{learnerId:learner.id}});await p.learner.delete({where:{id:learner.id}});}
 for(const testModule of [otherMod,mod].filter(Boolean)){await p.classModule.deleteMany({where:{moduleId:testModule.id}});await p.criterion.deleteMany({where:{moduleId:testModule.id}});await p.module.delete({where:{id:testModule.id}});}
 if(teacher)await p.instructor.delete({where:{id:teacher.id}});
 if(klass)await p.class.delete({where:{id:klass.id}});if(org)await p.org.delete({where:{id:org.id}});await p.$disconnect();
}
