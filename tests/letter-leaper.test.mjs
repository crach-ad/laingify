import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validClimb, rankClimbs, validUsername } from '../lib/letter-leaper-rules.ts';
import { createLetterLeaperModule } from '../prisma/letter-leaper-module.mjs';
const score = (extra = {}) => ({ id: crypto.randomUUID(), practice: 'all', pace: 'easy', leaps: 150, correct: 230, attempts: 230, streak: 150, elapsed: 65000, classId: 'windsor-a', learnerId: 'one', username: 'MoonKid', ...extra });
test('validates finished climbs and nicknames', () => {
  assert.ok(validClimb(score()));
  assert.ok(validClimb(score({correct:231,attempts:232})), 'a timed-out word may contribute extra correctly typed prefix letters');
  for (const patch of [{leaps:100},{correct:231},{attempts:229},{elapsed:0},{streak:151},{practice:'bad'},{pace:'fast'}]) assert.equal(validClimb(score(patch)), false);
  assert.ok(validUsername('Moon_Kid-2')); assert.equal(validUsername('<script>'), false);
});
test('leaderboard isolates classes and modes and keeps the best run per learner', () => {
  const rows = [score({attempts:240}),score(),score({learnerId:'two',username:'OtherKid',elapsed:60000}),score({classId:'other',learnerId:'outsider'}),score({pace:'hard',learnerId:'speed'}),score({practice:'home',learnerId:'home'})];
  const result=rankClimbs(rows,'windsor-a','all','easy');
  assert.deepEqual(result.map(r=>r.learnerId),['two','one']); assert.equal(result[1].attempts,230);
});
test('module checkpoints match criteria and the game opens on Laingify', async () => {
  const mod=await createLetterLeaperModule(x=>x);
  assert.equal(mod.topic,'Keyboard Skills');
  assert.equal(mod.blocks.find(b=>b.type==='link').url,'/play/letter-leaper');
  for(const b of mod.blocks.filter(b=>b.type==='checkpoint')) assert.ok(mod.criteria.some(c=>c.label===b.criterionLabel));
});

test('ranks actual keystroke accuracy after word timeouts', () => {
  const rows=[score({learnerId:'lower',correct:230,attempts:250}),score({learnerId:'higher',correct:300,attempts:310})];
  assert.equal(rankClimbs(rows,'windsor-a','all','easy')[0].learnerId,'higher');
});

test('legacy relaxed climbs remain grouped with easy; steady and speedy climbs are not ranked', () => {
  const rows=[score({learnerId:'old',pace:'relaxed'}),score({learnerId:'steady',pace:'steady'}),score({learnerId:'speedy',pace:'speedy'})];
  assert.deepEqual(rankClimbs(rows,'windsor-a','all','easy').map(r=>r.learnerId),['old']);
  assert.deepEqual(rankClimbs(rows,'windsor-a','all','medium'),[]);
  assert.deepEqual(rankClimbs(rows,'windsor-a','all','hard'),[]);
  assert.equal(validClimb(score({pace:'relaxed'})),false,'new climbs use the difficulty names');
});

test('public play never loads the class API client', async () => {
  const { readFile } = await import('node:fs/promises');
  const dir = new URL('../public/games/letter-leaper/', import.meta.url);
  const read = (f) => readFile(new URL(f, dir), 'utf8');
  const html = await read('index.html');
  const ui = await read('ui.js');
  assert.equal(/leaderboard\.js|tracker\.js/.test(html), false, 'the API clients are loaded by ui.js only outside public mode');
  // The API clients (leaderboard.js, tracker.js) are only appended in the non-public branch.
  const loader = ui.slice(ui.indexOf('if (publicPlay) {'));
  const [publicBranch, otherBranch] = loader.split('\n} else {');
  assert.equal(/leaderboard\.js|tracker\.js/.test(publicBranch), false);
  assert.match(otherBranch, /'leaderboard\.js'[\s\S]*'tracker\.js'/);
  // Neither the rules, the HTML layer, nor any renderer makes network calls.
  for (const f of ['core.js', 'ui.js', 'scene-classic.js', 'scene-phaser.js', 'milo.js', 'art.js'])
    assert.equal(/fetch\(|XMLHttpRequest|sendBeacon|\/api\//.test(await read(f)), false, f);
});

test('Expert saves 100-leap finishes and keeps older 150-leap results readable',()=>{assert(validClimb(score({pace:'expert',leaps:100})));assert(validClimb(score({pace:'expert',leaps:150})));assert.equal(validClimb(score({pace:'hard',leaps:100})),false);});


test('leaderboard keeps the strongest score per nickname across profiles and capitalization',()=>{
 const rows=[score({learnerId:'one',username:'MoonKid',attempts:250}),score({learnerId:'two',username:'moonkid',attempts:230}),score({learnerId:'three',username:'MOONKID',attempts:240}),score({learnerId:'four',username:'StarKid',attempts:235})];
 const result=rankClimbs(rows,'windsor-a','all','easy');
 assert.deepEqual(result.map(r=>r.learnerId),['two','four']);
 assert.equal(rankClimbs([...rows].reverse(),'windsor-a','all','easy')[0].learnerId,'two');
});
test('nickname grouping happens before the top-20 cutoff and preserves mode boundaries',()=>{
 const duplicates=Array.from({length:25},(_,i)=>score({learnerId:'same-'+i,username:'SharedName',elapsed:12000+i}));
 const others=Array.from({length:20},(_,i)=>score({learnerId:'other-'+i,username:'Player-'+i,elapsed:15000+i}));
 const result=rankClimbs([...duplicates,...others,score({learnerId:'hard',username:'SharedName',pace:'hard'})],'windsor-a','all','easy');
 assert.equal(result.length,20);assert.equal(result.filter(r=>r.username.toLowerCase()==='sharedname').length,1);
 assert.equal(new Set(result.map(r=>r.username.toLowerCase())).size,20);
});
