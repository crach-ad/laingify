import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {picarModuleDefinitions,createPicarModules,PICAR_MANUAL} from '../prisma/picar-pro-modules.mjs';
import {setupRowan,ROWAN_ORG_ID,ROWAN_CLASS_CODE} from '../prisma/enable-rowan-picar.mjs';
const modules=picarModuleDefinitions();
test('six ordered lessons cover all 62 source pages in 48 visual tasks',()=>{
 assert.equal(modules.length,6);
 const tasks=modules.flatMap(m=>m.blocks.filter(b=>b.type==='assembly'));
 assert.equal(tasks.length,48);
 assert.deepEqual([...new Set(tasks.flatMap(b=>b.sourcePages))].sort((a,b)=>a-b),Array.from({length:62},(_,i)=>i+1));
 for(const task of tasks){assert.equal(task.urls.length,task.sourcePages.length);assert.equal(task.sourceUrl,PICAR_MANUAL);assert(task.materials.length);assert(task.actions.length>=2);assert(!task.autoplay);}
});
test('student lessons open with an embedded visual and never send learners to a PDF step',()=>{
 for(const m of modules){
  const first=m.blocks.find(b=>b.type!=='heading');
  assert.equal(first.type,'text');assert(first.url.startsWith('/tutorial/picar-pro/page-'));
  assert(first.text.includes('Tap Next or swipe left'));
  assert(!m.blocks.some(b=>b.type==='link'&&b.url?.includes('.pdf')));
  assert(m.blocks.some(b=>b.type==='assembly'&&b.urls.length&&b.actions.length));
 }
});
test('checkpoints and required criteria align, and safety approval stays instructor-controlled',()=>{
 for(const m of modules){
  const labels=m.criteria.map(c=>c.label);assert.equal(new Set(labels).size,labels.length);
  for(const b of m.blocks.filter(b=>b.type==='checkpoint'))assert(labels.includes(b.criterionLabel));
  for(const c of m.criteria.filter(c=>c.requiresEvidenceType))assert(m.blocks.some(b=>b.type==='checkpoint'&&b.criterionLabel===c.label));
  assert.equal(m.blocks.at(-1).type,'prompt');
 }
 for(const [index,label] of [[0,'Servo preparation confirmed'],[4,'Coach wiring approval'],[5,'Coach final assembly approval']]){
  const criterion=modules[index].criteria.find(c=>c.label===label);assert.equal(criterion.checkType,'RUBRIC');assert.equal(criterion.requiresEvidenceType,undefined);assert.equal(criterion.required,true);
 }
 const wiring=JSON.stringify(modules[4]);
 for(const text of ['CH0','CH4','yellow to white','red to red','brown to black','MPU6050'])assert(wiring.includes(text));
 assert(JSON.stringify(modules[0]).includes('Lesson 5'));
});
test('all visuals exist and the original source PDF is preserved',async()=>{
 const paths=new Set(modules.flatMap(m=>m.blocks.flatMap(b=>b.urls??(b.url?.startsWith('/tutorial/')?[b.url.split('#')[0]]:[]))));
 for(const path of paths)assert((await stat(new URL('../public'+path,import.meta.url))).size>0,path);
 const manifest=JSON.parse(await readFile(new URL('../public/tutorial/picar-pro/source.json',import.meta.url),'utf8'));
 const pdf=await readFile(new URL('../public'+PICAR_MANUAL,import.meta.url));assert.equal(createHash('sha256').update(pdf).digest('hex'),manifest.sha256);
});
test('module writing preserves definition order and serializes assembly content',async()=>{
 const result=await createPicarModules(async data=>data);
 assert.deepEqual(result.map(m=>m.title),modules.map(m=>m.title));
 assert(JSON.parse(result[0].contentJson).some(b=>b.type==='assembly'));
});
test('class setup preview is read-only and refuses an unrelated class-code collision',async()=>{
 let writes=0;
 const prisma={instructor:{findUnique:async()=>({id:'coach'})},class:{findUnique:async()=>null},$transaction:async()=>{writes++;throw new Error('Preview must not write');}};
 const plan=await setupRowan(prisma);assert.equal(plan.className,'Lessons with Rowan');assert.equal(plan.classCode,ROWAN_CLASS_CODE);assert.equal(plan.lessons.length,6);assert.equal(writes,0);
 prisma.class.findUnique=async()=>({id:'other',name:'Different class',orgId:'another-org'});
 await assert.rejects(()=>setupRowan(prisma,{apply:true}),/already used/);assert.equal(writes,0);
 prisma.class.findUnique=async()=>({id:'rowan',name:'Lessons with Rowan',orgId:ROWAN_ORG_ID});
 assert.equal((await setupRowan(prisma)).apply,false);
});
