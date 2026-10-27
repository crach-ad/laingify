import test from 'node:test';
import assert from 'node:assert/strict';
import { summarize, validRecord, levelConfig, sessionScore, rankMeadowScores } from '../lib/mouse-skills.ts';
const sessionId = 'd302498b-84f3-4b84-92c4-29b5931aa48a';
const attempt = { skill: 'click', level: 0, success: true, ms: 750, input: 'mouse', reason: 'hit' };
test('validates bounded, typed records and consistent outcomes', () => {
  assert.ok(validRecord({ sessionId, kind: 'start', sequence: 0 }));
  assert.ok(validRecord({ sessionId, kind: 'attempt', sequence: 1, attempt }));
  assert.ok(validRecord({ sessionId, kind: 'end', sequence: 2 }));
  for (const change of [{ level: 15 }, { ms: -1 }, { ms: Infinity }, { success: false }, { skill: 'unknown' }, { input: 'keyboard' }]) {
    assert.equal(validRecord({ sessionId, kind: 'attempt', sequence: 1, attempt: { ...attempt, ...change } }), false);
  }
  assert.equal(validRecord({ sessionId: '../bad', kind: 'start', sequence: 0 }), false);
  assert.equal(validRecord({ sessionId, kind: 'start', sequence: 1 }), false);
});
test('requires sample size and accuracy per level, never speed', () => {
  assert.equal(summarize(Array(3).fill(attempt))[1].level, 0);
  assert.equal(summarize(Array(4).fill({ ...attempt, ms: 100000 }))[1].level, 1);
  const miss = { ...attempt, success: false, reason: 'miss' };
  assert.equal(summarize([...Array(4).fill(attempt), miss])[1].level, 1);
  assert.equal(summarize([...Array(4).fill(attempt), miss, miss])[1].level, 0);
  assert.equal(summarize([attempt, { ...attempt, level: 1 }, { ...attempt, level: 2 }])[1].level, 0);
});
test('distinguishes no evidence, practice and secure; averages successes only', () => {
  assert.equal(summarize([])[0].accuracy, null);
  const rows = summarize([{ ...attempt, level: 2 }, ...Array(3).fill({ ...attempt, level: 2 }), { ...attempt, level: 2, ms: 5000, success: false, reason: 'miss' }], 3);
  assert.equal(rows[1].proficiency, 'Secure in this session');
  assert.equal(rows[1].accuracy, 80);
  assert.equal(rows[1].meanMs, 750);
  assert.equal(rows[0].proficiency, 'Not observed');
});

test('all 15 levels have usable targets and progressively longer challenges', () => {
  for (let level = 0; level < 15; level++) {
    const c = levelConfig(level);
    assert.ok(c.size >= 46 && c.dropRadius >= 34 && c.goal >= 4 && c.goal <= 7);
    assert.ok(validRecord({ sessionId, kind: 'attempt', sequence: 1, attempt: { ...attempt, level } }));
  }
  assert.equal(summarize(Array(7).fill({ ...attempt, level: 14 }))[1].proficiency, 'Secure in this session');
});
test('score caps repeated hits and rewards accuracy without speed bonuses', () => {
  assert.deepEqual(sessionScore(Array(4).fill(attempt)), { score: 140, completed: 1 });
  assert.deepEqual(sessionScore(Array(100).fill(attempt)), { score: 140, completed: 1 });
  assert.equal(sessionScore([{ ...attempt, success: false, reason: 'miss' }, ...Array(4).fill(attempt)]).score, 120);
  assert.equal(sessionScore(Array(4).fill({ ...attempt, ms: 90000 })).score, 140);
});
test('leaderboard retains only each learner’s best session', () => {
  const rows = rankMeadowScores([
    { learnerId: 'a', sessionId: '1', score: 100, completed: 0 },
    { learnerId: 'a', sessionId: '2', score: 200, completed: 1 },
    { learnerId: 'b', sessionId: '3', score: 200, completed: 2 },
    { learnerId: 'c', sessionId: '4', score: -1, completed: 0 },
  ]);
  assert.deepEqual(rows.map(r => r.learnerId), ['b', 'a']);
});
