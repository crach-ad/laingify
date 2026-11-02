import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import * as globalRules from '../lib/leaper-global.ts';
import * as rules from '../lib/letter-leaper-rules.ts';
const row=(extra={})=>({id:'run1',learnerId:'one',leaps:40,startLeap:0,correct:40,attempts:42,streak:20,elapsed:60000,practice:'all',pace:'easy',scope:'full',...extra});
test('global board ranks partial stages within a difficulty and keeps one best run per learner',()=>{
 const result=globalRules.rankGlobalClimbs([row(),row({id:'better',leaps:65}),row({id:'other',learnerId:'two',pace:'hard',leaps:100,correct:120,attempts:130}),row({id:'third',learnerId:'three',leaps:65,correct:65,attempts:65})],'one');
 assert.deepEqual(result.entries.map(r=>r.leaps),[65,65]);assert.equal(result.personal.rank,2);assert.equal(result.total,2);
 assert.equal(result.entries[0].stage,'High atmosphere');assert.equal(result.entries[0].pace,'easy');
 assert.ok(result.entries.every(r=>!('learnerId' in r)&&!('id' in r)&&!('classId' in r)));
 assert.equal(result.personal.username,globalRules.explorerName('one'));
});
test('empty, invalid and unearned words-only starting positions do not rank',()=>{
 assert.equal(globalRules.rankGlobalClimbs([row({leaps:100,startLeap:100}),row({correct:0}),row({leaps:151}),row({elapsed:NaN}),row({attempts:2})],'one').total,0);
});
test('ties use accuracy, streak, time, and stable id; personal rank survives top 50 limit',()=>{
 const result=globalRules.rankGlobalClimbs(Array.from({length:55},(_,i)=>row({id:String(i),learnerId:String(i),elapsed:10000+i})),'54');
 assert.equal(result.entries.length,50);assert.equal(result.personal.rank,55);
 const tied=globalRules.rankGlobalClimbs([row({learnerId:'a',streak:5}),row({learnerId:'b',streak:10})],'b');assert.equal(tied.personal.rank,1);
});
const source=ts.transpileModule(readFileSync(new URL('../app/api/letter-leaper/[action]/route.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
function fixture(signedIn=true){
 let queried=0;
 const dependencies={
  'next/server':{NextResponse:{json:(v,o)=>Response.json(v,o)}},
  '@/lib/session':{getSession:async()=>signedIn?{learnerId:'one',classId:'class-a'}:null},
  '@/lib/letter-leaper-rules':rules,'@/lib/leaper-global':globalRules,
  '@/lib/db':{prisma:{rosterEntry:{findUnique:async()=>({class:{orgId:'org'}})},classModule:{findFirst:async()=>({moduleId:'mod'})},
   typingSession:{findMany:async()=>{queried++;return [row({classId:'class-b',class:{name:'Yr 4K'},furthestLeap:40,activeMs:60000,letterSet:'all',summaryJson:'{"bestStreak":20}'})];}},
   learnerEvent:{findMany:async()=>[]}}}
 };
 const exports={};new Function('require','exports',source)(name=>dependencies[name],exports);
 return {get:(pace='easy')=>exports.GET(new Request('https://laingify.test/api/letter-leaper/leaderboard?scope=global&pace='+pace),{params:Promise.resolve({action:'leaderboard'})}),queried:()=>queried};
}
test('global API permits enrolled players, reads cross-class progress and returns only display fields',async()=>{
 const f=fixture();const response=await f.get();assert.equal(response.status,200);const data=await response.json();assert.equal(data.entries[0].leaps,40);assert.equal(data.entries[0].you,true);assert.equal(data.entries[0].yearGroup,'Year 4');assert.equal(data.entries[0].username,globalRules.explorerName('one'));assert.equal(JSON.stringify(data).includes('class-b'),false);
});
test('global API denies guests before reading cross-class records',async()=>{const f=fixture(false);assert.equal((await f.get()).status,401);assert.equal(f.queried(),0);});

test('difficulty is filtered before choosing a player’s best climb',()=>{
 const rows=[row({leaps:100,pace:'hard'}),row({id:'easy',leaps:20,pace:'easy'}),row({id:'medium',leaps:60,pace:'medium'})];
 for(const [pace,leaps] of [['easy',20],['medium',60],['hard',100]]) assert.equal(globalRules.rankGlobalClimbs(rows,'one',pace).personal.leaps,leaps);
 assert.equal(globalRules.rankGlobalClimbs(rows,'one','any').total,0);
});
test('year labels omit class sections and handle combined and unclassified groups',()=>{
 for(const [input,expected] of [['Yr 4K','Year 4'],['Yr 1D/1K','Year 1'],['Yr 5&6 Elective','Years 5 & 6'],['Year 8','Year 8'],['Grade 3','Grade 3'],['Reception','Reception'],['Coding club',null]]) assert.equal(globalRules.yearGroupFromClass(input),expected);
});
test('global API rejects unsupported difficulty before querying scores',async()=>{const f=fixture();assert.equal((await f.get('any')).status,400);assert.equal(f.queried(),0);});
