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
    assert.ok(edge<=tier[0]-8,'solid exterior face begins beyond the landing shelf');
    assert.ok(Number.isFinite(edge));
    for(let x=tier[0];x<=tier[1];x+=8){
     assert.ok(x>edge,'landing span must overlap the rock body');
    }
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
