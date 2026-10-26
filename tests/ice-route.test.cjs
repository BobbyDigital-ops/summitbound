const test=require('node:test'),assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');
const ctx=vm.createContext({Image:class Image{},document:{getElementById:()=>null},platforms:[]});
vm.runInContext(fs.readFileSync('public/game/scripts/world-data.js','utf8'),ctx);
const allCounts=new Set();
for(let seed=0;seed<9;seed++){
 test('ledge counts and ice-accessible routes on seed '+seed,()=>{
  vm.runInContext('applyRoute('+seed+')',ctx);
  for(let i=1;i<=3;i++){
   const ledges=vm.runInContext('spires['+i+'].ledges',ctx);
   allCounts.add(ledges.length);
   assert.ok(ledges.length>=1&&ledges.length<=4);
   const routes=vm.runInContext('independentIceRoutes('+i+')',ctx);
   assert.ok(routes.length>=1&&routes.length<=ledges.length);
   for(let k=0;k<ledges.length;k++){
    const points=vm.runInContext('iceClimbPoints('+i+','+k+')',ctx);
    assert.equal(points.length,2);
    assert.equal(points[0].x,ledges[k][1]-30);
    assert.equal(points[0].y,ledges[k][2]-22);
    assert.ok(points[0].y>points[1].y);
   }
  }
 });
}
test('all counts 1–4 appear, cave remains a ladder',()=>{
 assert.deepEqual([...allCounts].sort((a,b)=>a-b),[1,2,3,4]);
 assert.equal(vm.runInContext('iceClimbPoints(4).length',ctx),0);
});