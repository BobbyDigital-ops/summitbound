const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'), vm=require('node:vm');
const render=fs.readFileSync('public/game/scripts/rendering.js','utf8');
const world=fs.readFileSync('public/game/scripts/world-data.js','utf8');
const ctx=vm.createContext({});
vm.runInContext(render,ctx);
for (const direction of [-1,1]){
 test('idle wooden staff retains pole material length facing '+direction,()=>{
  const f=ctx.restingStaffEnds;
  const g=f(400,120,direction,195);
  const materialLength=Math.hypot(g.end.x-g.start.x,g.end.y-g.start.y);
  assert.ok(Math.abs(materialLength-195)<1e-8);
  assert.ok(direction*(g.end.x-g.start.x)>180,'long staff must visibly extend forward');
 });
}
test('idle staff uses existing physics poleLength, with common painted shaft',()=>{
 assert.match(render,/restingStaffEnds\(p\.x,p\.y-13,p\.facingDir,cfg\.poleLength\)/);
 assert.equal((render.match(/paintWoodenStaff\(shaft,/g)||[]).length,2);
 assert.match(world,/poleLength:195/);
});
