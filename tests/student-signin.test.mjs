import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(path, deps) {
  const code = ts.transpileModule(readFileSync(new URL('../' + path, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => { assert(name in deps, name); return deps[name]; }, Date, console, URL });
  return exports;
}
const registration = load("lib/class-registration.ts", {});
const response = { NextResponse: { json: (body, options = {}) => ({ status: options.status ?? 200, body }) } };
function fixture(tier, member = true, classCode = 'CLASS') {
  const sessions = [];
  const created = [];
  const prisma = {
    learner: { create: async ({ data }) => { created.push(data); return { id: 'new-pupil', ...data }; } },
    class: { findUnique: async ({where}) => where.classCode === classCode ? { id: 'class', classCode, band: 'YOUTH', minAuthTier: tier } : null },
    rosterEntry: {
      create: async ({ data }) => data,
      findFirst: async ({where}) => member && where.classId === 'class' && where.learnerId === 'pupil' ? { learnerId: 'pupil' } : null,
      findMany: async () => [{ learnerId: 'pupil', learner: { displayName: 'Student' } }],
    },
  };
  const api = load('app/api/join/route.ts', { 'next/server': response, '@/lib/class-registration': registration, '@/lib/db': { prisma }, '@/lib/session': { setSession: async s => sessions.push(s) } });
  return { sessions, created, post: body => api.POST({ json: async () => body }) };
}
for (const tier of [0,1,2]) test(`tier ${tier}: roster selection signs in without a PIN`, async () => {
  const f=fixture(tier);const r=await f.post({classCode:' class ',learnerId:'pupil'});
  assert.equal(r.status,200);assert.equal(f.sessions.length,1);assert.equal(f.sessions[0].via,'roster');assert.equal(f.sessions[0].learnerId,'pupil');
});
test('unknown class and wrong-class learner never create a session',async()=>{
 const f=fixture(1);assert.equal((await f.post({classCode:'missing',learnerId:'pupil'})).status,404);
 assert.equal((await f.post({classCode:'CLASS',learnerId:'outsider'})).status,404);assert.equal(f.sessions.length,0);
});
test('legacy name sign-in still works in open classes',async()=>{
 const f=fixture(0);assert.equal((await f.post({classCode:'CLASS',name:'Student'})).status,200);assert.equal(f.sessions[0].via,'name');
});
test('rosters are available for selection in open and roster-only classes',async()=>{
 for(const tier of [0,1]){
 const api=load('app/api/class/route.ts',{'next/server':response,'@/lib/class-registration':registration,'@/lib/db':{prisma:{class:{findUnique:async()=>({id:'class',minAuthTier:tier,org:{name:'School'},roster:[{learner:{id:'pupil',displayName:'Student',pin:'not-public'}}]})}}}});
 const r=await api.GET({url:'https://example.test/api/class?code=CLASS'});assert.equal(r.body.roster.length,1);assert.equal(r.body.roster[0].learnerId,'pupil');assert(!JSON.stringify(r.body).includes('not-public'));
 }
});
test('PIN-free sessions can save progress; absent and unknown sessions cannot',()=>{
 const {verifiedSignIn}=load('lib/session.ts',{'next/headers':{},'@/lib/signed-token':{}});
 for(const via of ['roster','name','register','pin','nfc'])assert(verifiedSignIn({learnerId:'pupil',classId:'class',via}));
 assert.equal(verifiedSignIn(null),false);assert.equal(verifiedSignIn({via:'forged'}),false);assert.equal(verifiedSignIn({}),false);
});
test('teacher sign-in still requires the correct PIN', async () => {
 let signedIn=0;
 const api=load('app/api/instruct/login/route.ts',{'next/server':response,'@/lib/db':{prisma:{instructor:{findUnique:async()=>({id:'teacher',pin:'2468'})}}},'@/lib/session':{setInstructorSession:async()=>signedIn++}});
 for(const pin of [undefined,'wrong'])assert.equal((await api.POST({json:async()=>({email:'teacher@example.test',pin})})).status,401);
 assert.equal(signedIn,0);assert.equal((await api.POST({json:async()=>({email:'teacher@example.test',pin:'2468'})})).status,200);assert.equal(signedIn,1);
});

test('WSR-4E permits new students despite a legacy roster-only setting', async () => {
 const f = fixture(1, true, 'WSR-4E');
 const r = await f.post({classCode: ' wsr-4e ', name: '  New   Student ', create: true});
 assert.equal(r.status, 200);
 assert.equal(f.created[0].displayName, 'New Student');
 assert.equal(f.sessions[0].classId, 'class');
 assert.equal(f.sessions[0].via, 'register');
});
test('WSR-4E rejects duplicate names and still accepts roster sign-in', async () => {
 const f = fixture(1, true, 'WSR-4E');
 assert.equal((await f.post({classCode:'WSR-4E',name:'student',create:true})).status,409);
 assert.equal(f.created.length,0);
 assert.equal((await f.post({classCode:'WSR-4E',learnerId:'pupil'})).status,200);
});
test('other roster-only classes cannot create profiles', async () => {
 const f = fixture(1, true, 'WSR-4K');
 assert.equal((await f.post({classCode:'WSR-4K',name:'New Student',create:true})).status,404);
 assert.equal(f.created.length,0);
 assert.equal(f.sessions.length,0);
});
test('class lookup enables the add-name option for WSR-4E only among closed classes', async () => {
 for (const classCode of ['WSR-4E','WSR-4K']) {
 const api=load('app/api/class/route.ts',{'next/server':response,'@/lib/class-registration':registration,'@/lib/db':{prisma:{class:{findUnique:async()=>({id:'class',classCode,minAuthTier:1,org:{name:'School'},roster:[]})}}}});
 const r=await api.GET({url:'https://example.test/api/class?code='+classCode});
 assert.equal(r.body.class.selfRegister,classCode==='WSR-4E');
 }
});
