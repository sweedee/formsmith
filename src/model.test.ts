import { test } from 'node:test';
import assert from 'node:assert/strict';
import {evaluate,transform,compare,cost,type Template,type Item} from './model.ts';
const socket=(x:number,y=0,z=0,turn=0):Item=>({kind:'socket',position:[x,y,z],turn});
const line:Template={id:'line',name:'Line',items:[socket(0),socket(0,1),socket(0,2)]};
test('quarter turns preserve height and rotate around the origin',()=>assert.deepEqual(transform([2,3,0],[1,2,1],1),[1,5,3]));
test('shape sockets substitute nested inputs and deduplicate overlap',()=>{
 const l:Template={id:'l',name:'L',items:[socket(0),socket(1),socket(0,1)]};
 const output=evaluate([{kind:'instance',template:'line',input:'l',position:[0,0,0],turn:0}],[line,l]);
 assert.equal(output.length,7);assert(output.some(p=>p.join(',')==='0,3,0'));
});
test('fixed blocks do not substitute the input',()=>assert.equal(evaluate([{kind:'block',position:[0,0,0],turn:0},socket(2)],[],[[0,0,0],[0,1,0]]).length,3));
test('cycles are rejected',()=>assert.throws(()=>evaluate([{kind:'instance',template:'a',position:[0,0,0],turn:0}],[{id:'a',name:'A',items:[{kind:'instance',template:'a',position:[0,0,0],turn:0}]}]),/Circular/));
test('diff distinguishes missing, extra and correct voxels',()=>assert.deepEqual(compare([[0,0,0],[1,0,0]],[[0,0,0],[0,1,0]]),{missing:[[0,1,0]],extra:[[1,0,0]],correct:[[0,0,0]]}));
test('intentional overlapping stamps retain both recipe calls but occupy each voxel once',()=>{
 const stamp:Item={kind:'instance',template:'line',position:[0,0,0],turn:0};
 const recipe=[stamp,{...stamp,turn:1}];
 assert.equal(recipe.length,2);assert.equal(evaluate(recipe,[line]).length,3);
 assert.equal(cost(recipe,[line]).calls,4);assert.equal(cost(recipe,[line]).definitions,14);
});
test('local definitions are charged once and one socket is more expensive than one block',()=>{const i:Item={kind:'instance',template:'line',position:[0,0,0],turn:0};assert.equal(cost([i,i],[line]).total,18);assert.equal(cost([i],[line]).total,16);const single={...line,items:[socket(0)]};assert(cost([i],[single]).total>cost([{kind:'block',position:[0,0,0],turn:0}],[]).total);});

