import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function fixture() {
 const s={auth:true,allowed:true,latest:'audio',type:'AUDIO',remaining:0,deleted:[],progress:null,criterion:null};
 const db={
 evidence:{findFirst:async({where})=>where.id ? (['AUDIO','TEXT'].includes(s.type)?{id:'audio',criterionId:'voice',type:s.type}:null):{id:s.latest},count:async()=>s.remaining,deleteMany:async({where})=>s.deleted.push(where)},
 criterion:{findFirst:async()=>({id:'voice'})},
 criterionStatus:{upsert:async({update})=>s.criterion=update},
 moduleProgress:{updateMany:async({data})=>s.progress=data},
 };
 const deps={
 '@/lib/instructor':{getInstructor:async()=>s.auth?{orgIds:['school']}:null},
 '@/lib/db':{prisma:{$transaction:async fn=>fn(db)}},
 '@/lib/reflection-rewrite':{lockReflection:async()=>{},authorizedRewriteClass:async()=>s.allowed?{}:null},
 };
 const source=fs.readFileSync(new URL('../app/api/instruct/reflection/audio/route.ts',import.meta.url),'utf8');
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={};vm.runInNewContext(code,{exports,require:id=>deps[id],Response,URL});
 return {s,run:(origin='http://localhost')=>exports.POST(new Request('http://localhost/api/instruct/reflection/audio',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({learnerId:'student',moduleId:'module',evidenceId:'audio'})}))};
}
test('reset targets only the audio checkpoint and reopens completion',async()=>{const {s,run}=fixture();assert.equal((await run()).status,200);assert.equal(s.deleted.length,1);assert.equal(s.deleted[0].criterionId,'voice');assert.equal(s.deleted[0].learnerId,'student');assert.equal(s.deleted[0].moduleId,'module');assert.equal(s.criterion.status,'NOT_STARTED');assert.equal(s.progress.status,'IN_PROGRESS');assert.equal(s.progress.completedAt,null);});
for(const [name,change,status] of [['signed out',s=>s.auth=false,401],['other class',s=>s.allowed=false,403],['newer recording',s=>s.latest='new-audio',409],['already removed',s=>s.type='NONE',409],['photo',s=>s.type='PHOTO',409]])test(name+' cannot delete evidence',async()=>{const {s,run}=fixture();change(s);assert.equal((await run()).status,status);assert.equal(s.deleted.length,0);});
test('cross-origin resets are rejected',async()=>{const {s,run}=fixture();assert.equal((await run('https://other.test')).status,403);assert.equal(s.deleted.length,0);});

test('written checkpoint responses can be reset separately',async()=>{const {s,run}=fixture();s.type='TEXT';assert.equal((await run()).status,200);assert.equal(s.deleted[0].type,'TEXT');});
test('resetting audio targets only audio while reopening the reflection',async()=>{const {s,run}=fixture();s.remaining=1;assert.equal((await run()).status,200);assert.equal(s.deleted[0].type,'AUDIO');assert.equal(s.progress.status,'IN_PROGRESS');assert.equal(s.criterion.status,'NOT_STARTED');});
