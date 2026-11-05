import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { createRequire } from 'node:module';
import { renderToStaticMarkup } from 'react-dom/server';
const require = createRequire(import.meta.url);
function load(path, mocks = {}) {
  const code = ts.transpileModule(fs.readFileSync(new URL('../' + path, import.meta.url), 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: id => mocks[id] ?? require(id), console, process, Buffer });
  return exports.default;
}
const React = require('react');
test('saved pitch takes can be selected without exposing storage URLs', () => {
  const Player = load('components/VideoCheckpoint.tsx');
  const html = renderToStaticMarkup(React.createElement(Player, { moduleId:'pitch',criterionId:'video',savedUrl:'/api/evidence/video/take2',savedVideos:[{id:'take1',url:'/api/evidence/video/take1',caption:'First take'},{id:'take2',url:'/api/evidence/video/take2',caption:'Second take'}],onSaved:()=>{} }));
  assert.match(html, /Choose a take/);
  assert.match(html, /value="\/api\/evidence\/video\/take2" selected/);
  assert.match(html, /<video[^>]*src="\/api\/evidence\/video\/take2"/);
  assert.match(html, /First take/);
  assert.doesNotMatch(html, /supabase/);
});
async function dashboard(orgName, assigned = true) {
  const noop = () => null;
  const module = {id:'pitch',title:'Elevator Pitch Analysis',topic:'Empowerment Series',progress:[{status:'IN_PROGRESS'}],criteria:[{id:'video',required:true},{id:'reflection',required:true}],badgeIcon:'🎬'};
  const Dashboard = load('app/learn/page.tsx', {
    'next/link':({children,...props})=>React.createElement('a',props,children),
    '@/lib/db':{prisma:{org:{findUnique:async()=>({name:orgName})},classModule:{findMany:async()=>assigned?[{id:'assigned',module}]:[]},project:{findMany:async()=>[]},criterionStatus:{findMany:async()=>[{criterionId:'video',status:'MET'}]}}},
    '@/lib/bands':{bandConfig:()=>({textScale:'',ageRange:'13–18'})},
    '@/lib/learner':{requireLearner:async()=>({learner:{id:'student',displayName:'Demo'},klass:{id:'class',orgId:'org',name:'IgniteHer',classCode:'IGNITE'},sprite:{}})},
    '@/lib/topics':{slugifyTopic:()=> 'empowerment-series',moduleTopic:m=>m.topic},
    '@/lib/class-resources':{classResources:()=>[]},
    '@/lib/class-features':{offersLetterLeaperLink:async()=>false},
    '@/lib/typing-access':{letterLeaperModuleId:async()=>null},
    '@/components/Logo':noop,'./SpriteChat':noop,'./SpriteCustomizer':noop,'./LogoutButton':noop,'./PhotoCapture':noop,
  });
  return renderToStaticMarkup(await Dashboard());
}
test('IgniteHer pitch tile is above badges, normal grid width, and has individual progress', async()=>{
  const html = await dashboard('IgniteHer');
  assert.match(html, /aria-label="Featured module" class="mt-8 grid gap-3 sm:grid-cols-2"/);
  assert.match(html, /href="\/learn\/pitch"/);
  assert.ok(html.indexOf('Featured module') < html.indexOf('<h2 class="text-base font-semibold">Badges'));
  assert.match(html, /50%/);
  assert.doesNotMatch(await dashboard('Other org'), /Featured module/);
  assert.doesNotMatch(await dashboard('IgniteHer',false), /Featured module/);
});
