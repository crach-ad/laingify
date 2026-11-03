import test from 'node:test';
import assert from 'node:assert/strict';
import { fairBeavers, fairStilts, fairSlots, placeFair } from '../lib/bebras/fair.ts';
import { results, scoreAnswer } from '../lib/bebras/scoring.ts';
import { advance, newRun } from '../lib/bebras/state.ts';

test('moving a placed beaver clears its old position and returns an occupied target to the bank', () => {
  let value = placeFair([], fairBeavers[0].name, 0);
  value = placeFair(value, fairBeavers[1].name, 1);
  value = placeFair(value, fairBeavers[0].name, 1);
  assert.deepEqual(value, ['', fairBeavers[0].name, '', '', '', '']);
  assert.deepEqual(placeFair(value, fairBeavers[0].name, -1), ['', '', '', '', '', '']);
});
test('restored placements preserve valid slots and reject unknown or duplicate beavers', () => {
  assert.deepEqual(fairSlots([fairBeavers[0].name, fairBeavers[0].name, 'unknown']), [fairBeavers[0].name, '', '', '', '', '']);
  assert.deepEqual(placeFair([], 'unknown', 0), ['', '', '', '', '', '']);
  assert.deepEqual(placeFair([], fairBeavers[0].name, 6), ['', '', '', '', '', '']);
});
test('the scored arrangement aligns all five hat tops and survives save/navigation', () => {
  const expected = results({})[4].expected;
  const heights = expected.flatMap((name, i) => name ? [fairBeavers.find(b => b.name === name).height + fairStilts[i]] : []);
  assert.equal(heights.length, 5);
  assert.equal(new Set(heights).size, 1);
  let run = advance(newRun('class', 0), {current: 4, answer: expected, next: 5, active: true}, 1000);
  run = advance(run, {current: 5, next: 4, active: true}, 2000);
  assert.deepEqual(fairSlots(run.answers['05-fair']), expected);
  assert.equal(scoreAnswer(4, run.answers['05-fair']), true);
});
