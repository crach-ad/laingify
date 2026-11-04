import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreAnswer,validAnswer,results} from '../lib/bebras/scoring.ts';
import {challenges} from '../lib/bebras/challenges.ts';
import {newRun,advance} from '../lib/bebras/state.ts';
test('all 15 captured challenges have an answer key and reject empty answers',()=>{const expected=results({});assert.equal(expected.length,15);for(const [i,r] of expected.entries()){assert.equal(scoreAnswer(i,r.expected),true,r.title);assert.equal(scoreAnswer(i,undefined),false);assert.equal(scoreAnswer(i,''),false);assert.equal(validAnswer(i,r.expected),true);}});
test('text answers ignore case and outer whitespace, but not incorrect content',()=>{assert.equal(scoreAnswer(2,' LIGHTHOUSE '),true);assert.equal(scoreAnswer(2,'house'),false);assert.equal(scoreAnswer(9,'3'),true);assert.equal(scoreAnswer(9,'4'),false)});
test('Fair follows the diagram and actual heights, including the source text correction',()=>{assert.equal(scoreAnswer(4,['D · blue hat','B · yellow hat','E · purple hat','C · green hat','','A · red hat']),true);assert.equal(scoreAnswer(4,['D · blue hat','B · yellow hat','E · purple hat','','C · green hat','A · red hat']),false)});
test('placement order matters, grid selection order does not',()=>{const k=results({});assert.equal(scoreAnswer(3,[...k[3].expected].reverse()),false);assert.equal(scoreAnswer(12,[...k[12].expected].reverse()),true);assert.equal(scoreAnswer(12,[...k[12].expected,'24']),false);assert.equal(scoreAnswer(13,[...k[13].expected].reverse()),false)});
test('invalid question, choice and grid values are rejected',()=>{assert.equal(validAnswer(-1,'A'),false);assert.equal(validAnswer(15,'A'),false);assert.equal(validAnswer(0,'not an option'),false);assert.equal(validAnswer(12,['25']),false);assert.equal(validAnswer(12,['1','1']),false);assert.equal(validAnswer(12,['23']),false);assert.equal(validAnswer(2,{}),false)});
test('server time accrues per previous question, and records revisions and visits',()=>{const r=newRun('class',1000);const a=advance(r,{current:0,answer:'Orange Star',next:1,active:true},16000);assert.equal(a.activeMs[challenges[0].id],15000);assert.equal(a.current,1);assert.equal(a.visits[challenges[1].id],1);assert.equal(r.answers[challenges[0].id],undefined);const b=advance(a,{current:1,next:0,active:true},31000);const c=advance(b,{current:0,answer:'Purple Diamond',active:true},46000);assert.equal(c.changes[challenges[0].id],2);assert.equal(c.visits[challenges[0].id],2)});
test('idle, hidden, and offline gaps do not accumulate active time',()=>{let r=newRun('class',0);r=advance(r,{current:0,active:false},15000);r=advance(r,{current:0,active:false},30000);r=advance(r,{current:0,active:true},3600000);assert.equal(r.activeMs[challenges[0].id],15000);r=advance(r,{current:0,active:true},3615000);assert.equal(r.activeMs[challenges[0].id],30000)});
test('finish locks answers, remains untimed and preserves previous attempts',()=>{const r=advance(newRun('class',0),{current:0,answer:'Purple Diamond',active:true,finish:true},7200000);assert.equal(r.finishedAt,7200000);assert.equal(r.answers[challenges[0].id],'Purple Diamond');assert.deepEqual(advance(r,{current:0,answer:'Red Ellipse',active:true},7205000),r)});

test('Castors uses its own 12 questions, answer keys, and session timing', async()=>{
 const {challengesFor}=await import('../lib/bebras/challenges.ts');
 const castors=challengesFor('castors');
 assert.equal(castors.length,12);
 assert.deepEqual(castors.map(c=>c.title),['Alex’s treasure','Beautiful drawings','Polite Beavers','Magic house','Cube','Chung cake','Robot rug','Planes','Rubber rings','Parking at the party','Avoiding the clouds','Painted trees']);
 const expected=['B',['Single bell','Branch','Double bell','Flower'],'A','C','Purple Diamond','DACB','A',['Green','Red','Orange','Purple stars'],'11','A','C','House D'];
 for(const [i,key] of expected.entries()){assert.equal(validAnswer(i,key,'castors'),true);assert.equal(scoreAnswer(i,key,'castors'),true);assert.equal(scoreAnswer(i,'','castors'),false);}
 assert.equal(validAnswer(12,'A','castors'),false);
 assert.equal(validAnswer(1,['Branch','Branch'],'castors'),false);
 assert.equal(scoreAnswer(1,['Branch','Single bell','Double bell','Flower'],'castors'),false);
 let run=newRun('castors-class',1000,'castors');
 run=advance(run,{current:0,answer:'B',next:11,active:true},11000);
 assert.equal(run.answers[castors[0].id],'B');assert.equal(run.activeMs[castors[0].id],10000);assert.equal(run.visits[castors[11].id],1);
 assert.equal(results(run.answers,'castors').length,12);
 const legacy=newRun('old-class',1000);delete legacy.setId;
 assert.equal(advance(legacy,{current:0,answer:'Purple Diamond',active:true},2000).answers['01-cube'],'Purple Diamond');
});

test('Juniors 2024 captures all 18 tasks with valid answer keys and private explanations',async()=>{
 const {challengesFor}=await import('../lib/bebras/challenges.ts');
 const {access}=await import('node:fs/promises');
 const all=challengesFor('juniors-2024');assert.equal(all.length,18);
 assert.equal(all.filter(c=>c.kind==='placement').length,9);
 for(const [i,r] of results({},'juniors-2024').entries()){
  assert.ok(validAnswer(i,r.expected,'juniors-2024'),r.title);
  assert.ok(scoreAnswer(i,r.expected,'juniors-2024'),r.title);
  assert.equal(scoreAnswer(i,undefined,'juniors-2024'),false);
  await access('public'+all[i].image);await access(`content/bebras/explanations/${r.id}-review.png`);
  for(const asset of [...(all[i].optionImages??[]),...(all[i].targetImages??[]),...(all[i].boardImage?[all[i].boardImage]:[])])await access('public'+asset);
 }
});
test('2024 accepts both valid sailboat starts and unordered selections, but preserves arrangements',()=>{
 const set='juniors-2024';assert.ok(scoreAnswer(2,'1',set));assert.ok(scoreAnswer(2,'6',set));assert.equal(scoreAnswer(2,'3',set),false);
 assert.ok(scoreAnswer(7,['Onions','Mushrooms','Cheese'],set));assert.ok(scoreAnswer(8,['7','5','2','1'],set));
 assert.equal(scoreAnswer(0,['Black','White','Black'],set),false);
 assert.equal(scoreAnswer(14,['Ana','Beti','Cene','Darja','Emil'],set),false);
});
test('2024 placement validation enforces finite piece supplies, valid targets and selection limits',()=>{
 const set='juniors-2024';assert.equal(validAnswer(6,['Up','Up'],set),false);assert.equal(validAnswer(6,['Right','Right','Right'],set),false);
 assert.ok(validAnswer(6,['','Right','Right','','Up','','','','',''],set));
 assert.equal(validAnswer(6,Array(11).fill(''),set),false);assert.equal(validAnswer(6,['Down'],set),false);
 assert.equal(validAnswer(4,['Ship','Ship'],set),false);assert.equal(validAnswer(11,['Emma','Emma'],set),false);
 assert.equal(validAnswer(7,['Mushrooms','Cheese','Onions','Pepper'],set),false);assert.equal(validAnswer(8,['1','1'],set),false);
 assert.ok(validAnswer(0,['White','White','White'],set));assert.ok(validAnswer(6,[],set));
});
test('2024 timing and answers stay in their own sequence and support the final question',()=>{
 const run=newRun('test',1000,'juniors-2024');const next=advance(run,{current:0,answer:['White','Black','Black'],next:17,active:true},11000);
 assert.equal(next.current,17);assert.equal(next.activeMs['2024-01-tube'],10000);assert.deepEqual(next.answers['2024-01-tube'],['White','Black','Black']);
 assert.equal(next.answers['01-cube'],undefined);assert.equal(results(next.answers,'juniors-2024').filter(r=>r.correct).length,1);
});
