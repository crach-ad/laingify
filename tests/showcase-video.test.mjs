import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { createRequire } from 'node:module';
import { inspireHerShowcaseData } from '../prisma/inspire-her-showcase-module.mjs';
import { elevatorPitchAnalysisData } from '../prisma/elevator-pitch-analysis-module.mjs';
const require = createRequire(import.meta.url);
function load(path, mocks) {
  const code = ts.transpileModule(fs.readFileSync(new URL('../' + path, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: id => mocks[id] ?? require(id), Response, Request, URL, Date, console, process, Buffer });
  return exports;
}
function setup() {
  const state = { session: { learnerId: 'student-a', classId: 'class-a' }, instructor: null, roster: true, assigned: true, criterion: true, evidence: null, writes: 0, size: 100, mime: 'video/mp4', calls: [] };
  class NR extends Response { static redirect(url, init) { return new Response(null, { status: init.status, headers: { ...init.headers, Location: url } }); } }
  const tokens = new Map(); let token = 0;
  const mocks = {
    'next/server': { NextResponse: NR },
    '@/lib/session': { getSession: async () => state.session },
    '@/lib/instructor': { getInstructor: async () => state.instructor },
    '@/lib/signed-token': { signToken: (_, t) => { const key = String(++token); tokens.set(key,t); return key; }, verifyToken: (_, t) => tokens.get(t) ?? null },
    '@/lib/completion': { recomputeEvidenceCriteria: async () => {}, assembleProjectIfComplete: async () => ({ complete: false }) },
    '@/lib/db': { prisma: {
      rosterEntry: { findFirst: async () => state.roster ? {} : null }, classModule: { findUnique: async () => state.assigned ? {} : null }, criterion: { findFirst: async () => state.criterion ? {} : null },
      module: { findUnique: async () => ({ orgId: 'org-a' }) },
      evidence: { findUnique: async () => state.evidence, upsert: async ({ create }) => { state.writes++; state.evidence ??= create; return state.evidence; } },
    } },
    '@/lib/video-storage': { VIDEO_BUCKET: 'private', VIDEO_LIMIT: 50 * 1024 * 1024, VIDEO_TYPES: ['video/mp4','video/webm','video/quicktime'], objectPath: (...p) => p.join('/'), videoConfig: () => ({ base: 'https://storage.test/storage/v1' }), storage: async (path) => { state.calls.push(path); if(path.startsWith('/object/info/'))return {size:state.size,content_type:state.mime,metadata:{}};return path.startsWith('/object/upload/') ? {url:'/object/upload/sign/private/test?token=upload'} : {signedURL:'/object/sign/private/test?token=read'}; } },
  };
  const { POST } = load('app/api/evidence/video/route.ts', mocks);
  const { GET } = load('app/api/evidence/video/[id]/route.ts', mocks);
  const post = (body, origin='https://app.test') => POST(new Request('https://app.test/api/evidence/video', { method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body) }));
  const start = () => post({action:'start',moduleId:'module-a',criterionId:'criterion-a',size:100,mime:'video/mp4',name:'pitch.mp4'});
  const get = () => GET(new Request('https://app.test/api/evidence/video/id'), { params: Promise.resolve({ id:'id' }) });
  return {state,post,start,get,tokens};
}
test('module sequence pairs visual uploads with recordings and ends in project link',()=>{const d=inspireHerShowcaseData(),b=JSON.parse(d.contentJson).filter(x=>x.type==='checkpoint');assert.deepEqual(b.map(x=>x.capture),['fields','photo','audio','photo','audio','photo','audio','fields']);assert.equal(d.topic,'Empowerment Series');for(const m of [d,elevatorPitchAnalysisData()])for(const c of m.criteria.create)assert.ok(JSON.parse(m.contentJson).some(b=>b.criterionLabel===c.label));const p=JSON.parse(elevatorPitchAnalysisData().contentJson).filter(x=>x.type==='checkpoint');assert.deepEqual(p.map(x=>x.capture),['video','fields']);});
test('rejects signed-out, cross-origin, non-rostered and unassigned uploads',async()=>{for(const key of ['session','roster','assigned','criterion']){const t=setup();t.state[key]=null;assert.ok((await t.start()).status>=400);assert.equal(t.state.calls.length,0);}const t=setup();assert.equal((await t.post({action:'start'},'https://other.test')).status,403);});
test('validates file size/type and cannot complete arbitrary or malformed tickets',async()=>{const t=setup();assert.equal((await t.post({action:'start',size:100,mime:'text/html'})).status,400);assert.equal((await t.post({action:'start',size:100*1024*1024,mime:'video/mp4'})).status,400);for(const ticket of [null,{},'forged'])assert.equal((await t.post({action:'finish',ticket})).status,403);assert.equal(t.state.writes,0);});
test('completes only a matching uploaded object and stores an authenticated playback URL',async()=>{const t=setup();const start=await(await t.start()).json();t.state.size=99;assert.equal((await t.post({action:'finish',ticket:start.ticket})).status,400);assert.equal(t.state.writes,0);t.state.size=100;const r=await t.post({action:'finish',ticket:start.ticket});assert.equal(r.status,200);const e=(await r.json()).evidence;assert.equal(e.type,'VIDEO');assert.match(e.url,/^\/api\/evidence\/video\//);assert.equal(e.learnerId,'student-a');const repeat=await(await t.post({action:'finish',ticket:start.ticket})).json();assert.equal(repeat.evidence.id,e.id);});
test('upload tickets cannot cross student or class and expire',async()=>{for(const mode of ['learner','class','expired']){const t=setup(),r=await(await t.start()).json();if(mode==='learner')t.state.session.learnerId='student-b';if(mode==='class')t.state.session.classId='class-b';if(mode==='expired')t.tokens.get(r.ticket).exp=0;assert.equal((await t.post({action:'finish',ticket:r.ticket})).status,403);assert.equal(t.state.writes,0);}});
test('playback permits owner and same-org teacher, denies other students and teachers',async()=>{const t=setup(),r=await(await t.start()).json();await t.post({action:'finish',ticket:r.ticket});assert.equal((await t.get()).status,307);t.state.session={learnerId:'student-b',classId:'class-a'};assert.equal((await t.get()).status,404);t.state.session=null;t.state.instructor={orgIds:['org-b']};assert.equal((await t.get()).status,404);t.state.instructor={orgIds:['org-a']};const read=await t.get();assert.equal(read.status,307);assert.equal(read.headers.get('Cache-Control'),'private, no-store');});
