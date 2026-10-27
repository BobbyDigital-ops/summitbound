const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const ctx=vm.createContext({Image:class Image{},document:{getElementById:()=>null},platforms:[]});
for(const name of ['physics.js','world-data.js'])
 vm.runInContext(fs.readFileSync('public/game/scripts/'+name,'utf8'),ctx);
test('all 997 mountain seeds preserve each ice route with conditional real joins',()=>{
 let shared=0,independent=0;
 for(let seed=0;seed<997;seed++){
  vm.runInContext('applyRoute('+seed+')',ctx);
  const mountains=vm.runInContext('spires',ctx);
  for(let stage=1;stage<=3;stage++){
   const routes=vm.runInContext('iceRouteNetwork('+stage+')',ctx);
   assert.equal(routes.length,mountains[stage].ledges.length);
   for(const route of routes){
    const ledge=mountains[stage].ledges[route.tier],points=route.points;
    assert.equal(points[0].x,ledge[1]-30);
    assert.equal(points[0].y,ledge[2]-22);
    assert.ok(points.at(-1).x>=mountains[stage].summit[0]+40);
    assert.equal(points.at(-1).y,mountains[stage].summit[2]-22);
    for(let k=1;k<points.length;k++){
     assert.ok(points[k-1].y>points[k].y,'nonascending/duplicated ice segment');
     assert.ok(Number.isFinite(points[k].x),'invalid climb coordinate');
    }
    if(route.sharedWith===null){independent++;continue;}
    shared++;
    const parent=routes[route.sharedWith];
    assert.ok(parent&&mountains[stage].ledges[route.sharedWith][2]<ledge[2]);
    const base=vm.runInContext('independentIcePoints('+stage+','+route.tier+')',ctx);
    const at=vm.runInContext('iceXOnPath('+JSON.stringify(base)+','+
      (mountains[stage].ledges[route.sharedWith][2]-22)+')',ctx);
    assert.ok(Math.abs(at-(mountains[stage].ledges[route.sharedWith][1]-30))<=35,
     'share was forced across a gap in solid cliff');
    assert.deepEqual(Array.from(points.slice(-parent.points.length)).map(p=>[p.x,p.y]),
     Array.from(parent.points).map(p=>[p.x,p.y]),'shared upper climb differs');
   }
  }
 }
 assert.ok(shared>0,'no naturally intersecting ice branches were detected');
 assert.ok(independent>shared,'independent routes were all artificially merged');
 console.log('Ice network coverage:',{shared,independent});
});
