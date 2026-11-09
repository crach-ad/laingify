import test from 'node:test';
import assert from 'node:assert/strict';
import {flightStep,beamCollision,FLOOR,CEILING} from '../lib/dragon-flight.ts';
test('holding lifts; release applies gravity; speed stays bounded',()=>{let s={y:4,velocity:0};for(let i=0;i<20;i++)s=flightStep(s.y,s.velocity,true,.02);assert.ok(s.y>4);assert.ok(s.velocity<=6.5);for(let i=0;i<100;i++)s=flightStep(s.y,s.velocity,false,.02);assert.ok(s.y<4);assert.ok(s.velocity>=-7);});
test('floor and ceiling clamp without accumulating velocity',()=>{assert.deepEqual(flightStep(FLOOR,-7,false,.05),{y:FLOOR,velocity:0});assert.deepEqual(flightStep(CEILING,6,true,.05),{y:CEILING,velocity:0});});
test('beam collision follows rotated segment and endcaps',()=>{assert.equal(beamCollision(1,0,0,0,0,4),true);assert.equal(beamCollision(0,1.9,0,0,Math.PI/2,4),true);assert.equal(beamCollision(1.5,0,0,0,Math.PI/2,4),false);assert.equal(beamCollision(2.5,0,0,0,0,4),true);assert.equal(beamCollision(3,0,0,0,0,4),false);});
