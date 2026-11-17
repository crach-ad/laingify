import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function fixture(){
 const state={auth:true,allowed:true,photo:{id:'photo',criterionId:'picture'},remaining:[],deleted:[],reset:[],progress:false};
 const db={evidence:{findFirst:async()=>state.photo,delete:async({where})=>{state.deleted.push(where.id);state.photo=null;},findMany:async()=>state.remaining},criterion:{findMany:async()=>[{id:'picture'},{id:'other-picture'}]},criterionStatus:{upsert:async({create})=>state.reset.push(create.criterionId)},moduleProgress:{updateMany:async()=>state.progress=true}};
 const deps={'@/lib/instructor':{getInstructor:async()=>state.auth?{orgIds:['school']}:null},'@/lib/db':{prisma:{$transaction:async fn=>fn(db)}},'@/lib/reflection-rewrite':{lockReflection:async()=>{},authorizedRewriteClass:async()=>state.allowed?{}:null}};
 const source=fs.readFileSync(new URL('../app/api/instruct/evidence/photo/route.ts',import.meta.url),'utf8');const exports={};vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:id=>deps[id],Response,URL});
 return{state,run:(origin='http://localhost')=>exports.DELETE(new Request('http://localhost/api/instruct/evidence/photo',{method:'DELETE',headers:{origin,'content-type':'application/json'},body:JSON.stringify({learnerId:'learner',moduleId:'module',evidenceId:'photo'})}))};
}
test('delete only the selected photo and reopen its checkpoint',async()=>{const{state,run}=fixture();assert.equal((await run()).status,200);assert.deepEqual(state.deleted,['photo']);assert.deepEqual(state.reset,['picture']);assert.equal(state.progress,true);});
test('preserve completion when another photo still satisfies the checkpoint',async()=>{const{state,run}=fixture();state.remaining=[{id:'other',criterionId:'picture'}];assert.equal((await run()).status,200);assert.deepEqual(state.reset,[]);assert.equal(state.progress,false);});
test('repeated request never deletes a replacement photo',async()=>{const{state,run}=fixture();await run();assert.equal((await run()).status,404);assert.deepEqual(state.deleted,['photo']);});
for(const[key,status]of[['auth',401],['allowed',403]])test(key+' protects deletion',async()=>{const{state,run}=fixture();state[key]=false;assert.equal((await run()).status,status);assert.deepEqual(state.deleted,[]);});
test('cross-origin deletion is rejected',async()=>{const{state,run}=fixture();assert.equal((await run('https://other.test')).status,403);assert.deepEqual(state.deleted,[]);});
