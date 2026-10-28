import test from 'node:test';
import assert from 'node:assert/strict';
import { TARGET_SPOTS, nextTarget, decoyPositions, nextDragLayout, crossesRing, completedDrag } from '../lib/mouse-challenges.ts';

test('targets relocate and decoys never overlap the correct target', () => {
  for (const target of TARGET_SPOTS) {
    for (const random of [0, .3, .7, .999]) assert.notDeepEqual(nextTarget(target, () => random), target);
    const decoys = decoyPositions(target, 4);
    assert.equal(decoys.length, 4);
    for (const p of decoys) assert.ok(Math.hypot(p.x-target.x,p.y-target.y) >= 27);
  }
});
test('drag layouts progress from short horizontal moves to ordered routes', () => {
  let previous;
  for (let level = 0; level < 15; level++) {
    const layout = nextDragLayout(level, previous, () => .5);
    if (previous) assert.notEqual(layout.source.x < 50, previous.source.x < 50);
    for (const p of [layout.source, layout.destination, ...layout.waypoints]) {
      assert.ok(p.x >= 25 && p.x <= 75 && p.y >= 25 && p.y <= 75);
    }
    if (level < 3) assert.equal(layout.source.y, layout.destination.y);
    else assert.notEqual(layout.source.y, layout.destination.y);
    assert.equal(layout.waypoints.length, level < 6 ? 0 : level < 12 ? 1 : 2);
    previous = layout;
  }
});
test('gates detect fast crossings but ignore paths outside their radius', () => {
  assert.equal(crossesRing({x:0,y:0},{x:100,y:0},{x:50,y:0},10),true);
  assert.equal(crossesRing({x:0,y:0},{x:100,y:0},{x:50,y:30},10),false);
  assert.equal(crossesRing({x:0,y:0},{x:0,y:0},{x:0,y:0},10),true);
});
test('dropping at the destination without visiting all gates cannot succeed', () => {
  const p = {x:100,y:100};
  assert.equal(completedDrag(0,2,p,p,30),false);
  assert.equal(completedDrag(1,2,p,p,30),false);
  assert.equal(completedDrag(2,2,p,p,30),true);
  assert.equal(completedDrag(2,2,{x:150,y:100},p,30),false);
});
