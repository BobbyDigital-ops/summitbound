const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync('public/game/scripts/world-data.js','utf8');
const ctx = vm.createContext({
 Image: class Image {},
 document: {getElementById:()=>null},
 platforms: []
});
vm.runInContext(source,ctx);
for(let seed=0;seed<9;seed++){
 test('ice routes remain continuous on seeded route '+(seed+1),()=>{
  vm.runInContext('applyRoute('+seed+')',ctx);
  for(let sp=1;sp<=3;sp++){
   const points=vm.runInContext('iceClimbPoints('+sp+')',ctx);
   const ledges=vm.runInContext('spires['+sp+'].ledges',ctx);
   const summit=vm.runInContext('spires['+sp+'].summit',ctx);
   assert.equal(points.length,ledges.length+1);
   for(let i=0;i<points.length-1;i++){
    assert.ok(points[i].y>points[i+1].y,'climbing must always ascend');
   }
   for(const ledge of ledges){
    const entry=points.find(p=>p.y===ledge[2]-22);
    assert.ok(entry,'every landing ledge joins the shared ice route');
    assert.equal(entry.x,ledge[1]-30);
    assert.ok(entry.x>ledge[0]+20 && entry.x<ledge[1]-20,'accessible inboard from ledge edges');
    const at=vm.runInContext('icePositionAt('+sp+','+entry.y+')',ctx);
    assert.ok(Math.abs(at.x-entry.x)<.001);
   }
   const tip=points.at(-1);
   assert.equal(tip.x,summit[0]+40);
   assert.equal(tip.y,summit[2]-22);
   for(let y=points[0].y;y>=tip.y;y-=3){
    const sample=vm.runInContext('icePositionAt('+sp+','+y+')',ctx);
    assert.ok(Number.isFinite(sample.x),'ice position should be finite');
   }
  }
 });
}
test('the checkpoint cavern has a separate ladder rather than an outdoor ice route',()=>{
 assert.equal(vm.runInContext('iceClimbPoints(4).length',ctx),0);
 assert.equal(vm.runInContext("climbEntryX({kind:'cave'})",ctx),vm.runInContext('spires[4].cave.right-25',ctx));
});
