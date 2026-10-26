import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validClimb, rankClimbs, validUsername } from '../lib/letter-leaper-rules.ts';
import { createLetterLeaperModule } from '../prisma/letter-leaper-module.mjs';
const score = (extra = {}) => ({ id: crypto.randomUUID(), practice: 'all', pace: 'relaxed', leaps: 150, correct: 230, attempts: 230, streak: 150, elapsed: 65000, classId: 'windsor-a', learnerId: 'one', username: 'MoonKid', ...extra });
test('validates finished climbs and nicknames', () => {
  assert.ok(validClimb(score()));
  assert.ok(validClimb(score({correct:231,attempts:232})), 'a timed-out word may contribute extra correctly typed prefix letters');
  for (const patch of [{leaps:100},{correct:231},{attempts:229},{elapsed:0},{streak:151},{practice:'bad'},{pace:'fast'}]) assert.equal(validClimb(score(patch)), false);
  assert.ok(validUsername('Moon_Kid-2')); assert.equal(validUsername('<script>'), false);
});
test('leaderboard isolates classes and modes and keeps the best run per learner', () => {
  const rows = [score({attempts:240}),score(),score({learnerId:'two',elapsed:60000}),score({classId:'other',learnerId:'outsider'}),score({pace:'speedy',learnerId:'speed'}),score({practice:'home',learnerId:'home'})];
  const result=rankClimbs(rows,'windsor-a','all','relaxed');
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
  assert.equal(rankClimbs(rows,'windsor-a','all','relaxed')[0].learnerId,'higher');
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
