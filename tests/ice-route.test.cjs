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
   assert.equal(routes.length,ledges.length,'each ledge gets its own wall');
   assert.equal(new Set(routes.map(r=>r.points.at(-1).x)).size,ledges.length,'summit exits never merge');
   for(let k=0;k<ledges.length;k++){
    const points=vm.runInContext('iceClimbPoints('+i+','+k+')',ctx);
    assert.equal(points.length,3);
    assert.equal(points[0].x,ledges[k][1]-30);
    assert.equal(points[0].y,ledges[k][2]-22);
    assert.ok(points[0].y>points[1].y&&points[1].y>points[2].y);
    assert.ok(Math.abs(points[1].x-points[0].x)<Math.abs(points[2].x-points[0].x)*.4+1);
    assert.ok(points[2].x>=vm.runInContext('spires['+i+'].summit[0]',ctx)+40);
   }
  }
 });
}
test('all counts 1–4 appear, cave remains a ladder',()=>{
 assert.deepEqual([...allCounts].sort((a,b)=>a-b),[1,2,3,4]);
 assert.equal(vm.runInContext('iceClimbPoints(4).length',ctx),0);
});