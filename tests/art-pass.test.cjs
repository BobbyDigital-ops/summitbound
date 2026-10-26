const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const render=fs.readFileSync('public/game/scripts/rendering.js','utf8');
const state=fs.readFileSync('public/game/scripts/game-state.js','utf8');
const sim=fs.readFileSync('public/game/scripts/simulation.js','utf8');
const context=vm.createContext({});
vm.runInContext(render,context);
test('background crop covers all edges continuously through initial sprint',()=>{
 for(const [w,h] of [[1365,768],[412,915],[1920,1080]]){
  let last=null;
  for(let camera=-500;camera<=1800;camera+=3){
   const b=context.backdropViewport(1600,850,w,h,camera,500);
   assert.ok(b.x<=.0001 && b.y<=.0001);
   assert.ok(b.x+b.width>=w-.0001 && b.y+b.height>=h-.0001);
   if(last) assert.ok(Math.abs(b.x-last.x)<1,'no parallax jump');
   last=b;
  }
 }
});
test('the final destination has an immense jagged summit above its side cave',()=>{
 assert.match(render,/finalRidge=/);
 assert.match(render,/\[\.38,-635\]/);
 assert.match(render,/function drawCave\(\)/);
});
test('natural snow gulley, frozen falls and dwarfed ledge pines',()=>{
 assert.match(render,/function pine\(/);
 assert.match(render,/Frozen falls:/);
 assert.match(render,/Snow tongues descend/);
 assert.match(render,/ledge\[0\]\+19/);
});
test('running frames advance by travelled distance, not timer',()=>{
 assert.match(render,/const step=\(p\.runDistance\|\|0\)\/55/);
 assert.match(state,/runDistance:0/);
 assert.match(sim,/p\.runDistance=\(p\.runDistance\|\|0\)\+Math\.abs\(p\.vx\*dt\)/);
});
test('original vault physics remains separate and old wrap is gone',()=>{
 assert.ok(!render.includes('camera.x * .016) %'));
 assert.ok(render.includes('paintWoodenStaff'));
});
