const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');
const ctx=vm.createContext({Image:class Image{},document:{getElementById:()=>null},platforms:[]});
vm.runInContext(fs.readFileSync('public/game/scripts/physics.js','utf8'),ctx);
vm.runInContext(fs.readFileSync('public/game/scripts/world-data.js','utf8'),ctx);
for(let route=0;route<9;route++){
 test('continuous cliff safely backs landing surfaces on route '+(route+1),()=>{
  vm.runInContext('applyRoute('+route+')',ctx);
  for(let i=1;i<=3;i++){
   const mountain=vm.runInContext('spires['+i+']',ctx);
   const nodes=vm.runInContext('mountainContourNodes('+i+')',ctx);
   assert.equal(nodes.length,mountain.ledges.length+2,'summit, active ledges, base');
   for(let t=0;t<nodes.length-1;t++)assert.ok(nodes[t].y<nodes[t+1].y);
   for(const tier of mountain.ledges){
    const edge=vm.runInContext('mountainContourX('+i+','+(tier[2]+3)+')',ctx);
    assert.ok(Number.isFinite(edge));
    // The playable lip must project into open air but its inner part must
    // embed in the solid mountain body; no suspended ledges or giant fins.
    assert.ok(edge>=tier[0]+15,'shelf has no exposed lip outside the rock');
    assert.ok(edge<=tier[1]-15,'shelf no longer overlaps the mountain body');
    assert.ok(tier[0]+10<edge&&tier[1]-10>edge,
     'cliff must actually intersect the ledge span');
   }
   for(let y=mountain.summit[2]+4;y<2100;y+=11){
    assert.ok(Number.isFinite(vm.runInContext('mountainContourX('+i+','+y+')',ctx)));
   }
  }
 });
}
test('checkpoint cave and initial peak have continuous rock profiles',()=>{
 for(const i of [0,4]){
  assert.ok(vm.runInContext('mountainContourNodes('+i+').length',ctx)>=3);
  assert.ok(Number.isFinite(vm.runInContext('mountainContourX('+i+',1200)',ctx)));
 }
});
