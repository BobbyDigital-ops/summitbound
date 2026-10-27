const test=require('node:test'),assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');
const ctx=vm.createContext({Image:class Image{},document:{getElementById:()=>null},platforms:[]});
vm.runInContext(fs.readFileSync('public/game/scripts/physics.js','utf8'),ctx);
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
   const joins=routes.filter(r=>r.sharedWith!==null);
   for(const route of routes){
    if(route.sharedWith===null)continue;
    const parent=routes[route.sharedWith];
    assert.ok(parent,'shared climb has no valid higher route');
    const high=ledges[route.sharedWith],low=ledges[route.tier];
    assert.ok(low[2]-high[2]>=115,'ice shared with a lower rather than higher shelf');
    assert.ok(route.points.length>=4,'shared branch lacks an approach');
    assert.deepEqual(Array.from(route.points.slice(-parent.points.length)).map(p=>[p.x,p.y]),
     Array.from(parent.points).map(p=>[p.x,p.y]),
     'shared trunk does not exactly reuse the higher route');
   }
   // Sharing is permitted only for intersecting paths; each original
   // landing still retains its own selectable route and summit access.
   for(let k=0;k<ledges.length;k++){
    const points=vm.runInContext('iceClimbPoints('+i+','+k+')',ctx);
    assert.ok(points.length>=3,'missing climb path');
    assert.equal(points[0].x,ledges[k][1]-30);
    assert.equal(points[0].y,ledges[k][2]-22);
    for(let j=1;j<points.length;j++)assert.ok(points[j-1].y>points[j].y,
     'climb doubled back or teleported vertically');
    assert.ok(points.at(-1).x>=vm.runInContext('spires['+i+'].summit[0]',ctx)+40);
   }
  }
 });
}
test('ordinary routes favour three shelves; occasionally two or four',()=>{
 assert.deepEqual([...allCounts].sort((a,b)=>a-b),[2,3,4]);
 vm.runInContext('applyRoute(40)',ctx);
 assert.ok(vm.runInContext('spires[3].ledges.length',ctx)>=2);
 assert.equal(vm.runInContext('iceClimbPoints(4).length',ctx),0);
});