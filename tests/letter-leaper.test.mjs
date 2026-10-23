import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validClimb, rankClimbs, validUsername } from '../lib/letter-leaper-rules.ts';
import { createLetterLeaperModule } from '../prisma/letter-leaper-module.mjs';
const score = (extra = {}) => ({ id: crypto.randomUUID(), practice: 'all', pace: 'relaxed', leaps: 150, correct: 230, attempts: 230, streak: 150, elapsed: 65000, classId: 'windsor-a', learnerId: 'one', username: 'MoonKid', ...extra });
test('validates finished climbs and nicknames', () => {
  assert.ok(validClimb(score()));
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
