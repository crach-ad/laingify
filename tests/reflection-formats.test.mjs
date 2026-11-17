import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { createRequire } from 'node:module';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const require=createRequire(import.meta.url);
function load(path,deps={}) {
 const code=ts.transpileModule(fs.readFileSync(new URL('../'+path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const exports={};vm.runInNewContext(code,{exports,require:id=>deps[id]??require(id),Response,URL,Date,console});return exports;
}
function fixture() {
 const state={saved:null,graded:false,transcript:'',feedback:null,classCode:'WSR-4E'};
 const snapshot={latest:null,pending:null};
 const db={
 class:{findUnique:async()=>({orgId:'school',band:'EARLY',classCode:state.classCode})},learner:{findUnique:async()=>({})},module:{findUnique:async()=>({orgId:'school',title:'Reflection'})},criterion:{findMany:async()=>[]},classModule:{findUnique:async()=>({})},rosterEntry:{findUnique:async()=>({})},
 submission:{create:async({data})=>{state.saved=data;return{id:'saved'};}},autoFeedback:{create:async({data})=>state.feedback=data},
 };db.$transaction=async fn=>fn(db);
 const api=load('app/api/submission/route.ts',{
 'next/server':{NextResponse:{json:(data,options)=>Response.json(data,options)}},
 '@/lib/db':{prisma:db},'@/lib/session':{getSession:async()=>({learnerId:'student',classId:'class'})},
 '@/lib/gemini':{transcribeAudio:async()=>({transcript:state.transcript}),autoFeedback:async()=>({summary:'Feedback',metIds:[],missingIds:[],nextSteps:'',aiUsed:false})},
 '@/lib/completion':{applyFeedbackToCriteria:async()=>state.graded=true,evaluateModule:async()=>({criteria:[],complete:false}),assembleProjectIfComplete:async()=>({complete:false})},
 '@/lib/reflection-rewrite':{lockReflection:async()=>{},reflectionSnapshot:async()=>snapshot,ReflectionConflict:class extends Error{}},
 });
 return {state,post:body=>api.POST(new Request('http://localhost/api/submission',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({moduleId:'module',...body})}))};
}
test('audio is preserved without transcription and is not falsely graded',async()=>{const {state,post}=fixture();const audioUrl='data:audio/webm;base64,YWJj';assert.equal((await post({audioUrl})).status,200);assert.equal(state.saved.audioUrl,audioUrl);assert.equal(state.saved.content,'Audio reflection');assert.equal(state.graded,false);});
test('transcribed audio is assessed and remains playable',async()=>{const {state,post}=fixture();state.transcript='I built a bridge and tested it.';assert.equal((await post({audioUrl:'data:audio/mp4;codecs=mp4a.40.2;base64,YWJj'})).status,200);assert.equal(state.saved.content,state.transcript);assert.equal(state.graded,true);});
test('written reflection saves as text',async()=>{const {state,post}=fixture();assert.equal((await post({content:'I changed the shape of my model.'})).status,200);assert.equal(state.saved.audioUrl,null);assert.equal(state.graded,true);});
test('invalid audio URLs are rejected without saving',async()=>{const {state,post}=fixture();for(const audioUrl of ['javascript:alert(1)','https://other.test/file.mp3','data:text/html;base64,YWJj'])assert.equal((await post({audioUrl})).status,400);assert.equal(state.saved,null);});
const audio=load('components/AudioCheckpoint.tsx');
const input=load('components/ReflectionInput.tsx',{'./AudioCheckpoint':audio}).default;
for(const mode of ['record','type'])test('learner can select '+mode,()=>{const html=renderToStaticMarkup(createElement(input,{value:'',onChange:()=>{},audioUrl:null,onAudio:()=>{},mode,onMode:()=>{},busy:false}));assert.match(html,/>Record</);assert.match(html,/>Type</);assert.match(html,mode==='type'?/textarea/:/Record your answer/);});
const reset=load('app/instruct/review/[learnerId]/[moduleId]/ReopenReflection.tsx',{'next/navigation':{useRouter:()=>({refresh(){}})}}).default;
for(const format of ['audio','written'])test('instructor sees a separate '+format+' reset label',()=>{const html=renderToStaticMarkup(createElement(reset,{learnerId:'student',moduleId:'module',submissionId:null,evidenceId:'evidence',format}));assert.match(html,new RegExp('Reset '+format+' reflection'));});

test('audio submissions remain disabled outside WSR',async()=>{const {state,post}=fixture();state.classCode='OTHER';assert.equal((await post({audioUrl:'data:audio/webm;base64,YWJj'})).status,403);assert.equal(state.saved,null);});
test('non-WSR text inputs do not offer a recording option',()=>{const html=renderToStaticMarkup(createElement(input,{value:'',onChange:()=>{},audioUrl:null,onAudio:()=>{},mode:'type',onMode:()=>{},busy:false,allowRecording:false}));assert.doesNotMatch(html,/>Record</);assert.match(html,/textarea/);});

const workspace=load('app/learn/[moduleId]/ModuleWorkspace.tsx',{'@/components/ReflectionInput':{default:input},'@/app/learn/CameraPhotoButton':{default:()=>null}}).default;
test('Windsor modules without written criteria still offer both reflection formats',()=>{
 const html=renderToStaticMarkup(createElement(workspace,{moduleId:'module',allowReflectionFormats:true,badge:{name:'Maker',icon:'*',description:''},spriteName:'Helper',initialCriteria:[],initialEvidence:[],initialFeedback:null,initialThreads:[],initialComplete:true,initialProject:null}));
 assert.match(html,/>Record</);assert.match(html,/>Type</);
});
const tutorialDeps={'@/components/ReflectionInput':{default:input},'@/components/AudioCheckpoint':audio,'@/lib/track':{track(){},flushEvents(){}},'@/lib/client-image':{},'motion/react':{motion:{div:'div'}}};
for(const name of ['VideoCheckpoint','SlideShow','ScratchBlocks','CircuitSim','MicrobitSim','KnexViewer','StlViewer'])tutorialDeps['@/components/'+name]={default:()=>null};
tutorialDeps['@/app/learn/CameraPhotoButton']={default:()=>null};
const tutorial=load('app/learn/[moduleId]/Tutorial.tsx',tutorialDeps).default;
const baseTutorial={moduleId:'module',badge:{name:'Maker',icon:'*'},blocks:[{type:'checkpoint',capture:'audio',criterionLabel:'Reflection',text:'Tell me what you made.'}],criteria:[{id:'voice',label:'Reflection',status:'MET'}],evidence:[{id:'audio',criterionId:'voice',type:'AUDIO',url:'data:audio/webm;base64,YWJj'}],initialComplete:true,hasSubmission:false,allowReflectionFormats:true};
test('completed Windsor tutorials offer a route back to record or type',()=>{const html=renderToStaticMarkup(createElement(tutorial,baseTutorial));assert.match(html,/Add or update reflection — record or type/);});
test('reset photo checkpoint opens even when the module was previously complete',()=>{const html=renderToStaticMarkup(createElement(tutorial,{...baseTutorial,blocks:[{type:'checkpoint',capture:'photo',criterionLabel:'Photo',text:'Upload a photo.'}],criteria:[{id:'photo',label:'Photo',status:'NOT_STARTED'}],evidence:[],resetCriterionId:'photo'}));assert.match(html,/Upload a photo/);assert.doesNotMatch(html,/You earned the/);});
test('saved Windsor reflection checkpoints still show both format controls',()=>{const html=renderToStaticMarkup(createElement(tutorial,{...baseTutorial,initialComplete:false,hasSubmission:false,resetCriterionId:'voice'}));assert.match(html,/>Record</);assert.match(html,/>Type</);});
