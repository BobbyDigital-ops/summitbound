const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('public/game/scripts/rendering.js','utf8');
const vmCtx=vm.createContext({Image:class Image{},document:{getElementById:()=>null},
 platforms:[],performance:{now:()=>1}});
vm.runInContext(fs.readFileSync('public/game/scripts/physics.js','utf8'),vmCtx);
vm.runInContext(fs.readFileSync('public/game/scripts/world-data.js','utf8'),vmCtx);
test('ice footing is anchored to each *actual* landing shelf',()=>{
 assert.match(src,/function drawIceShelfJoins\(i,paintCtx=ctx\)/);
 assert.match(src,/const x=route\.points\[0\]\.x,y=ledge\[2\]/);
 assert.match(src,/const maxLeft=Math\.min\(49,x-ledge\[0\]-5\)/);
 assert.match(src,/const maxRight=Math\.min\(50,ledge\[1\]-x-5\)/);
 assert.match(src,/drawIceClimb\(i,off\);drawIceShelfJoins\(i,off\);drawIceCrestSnow\(i,off\)/);
 assert.match(src,/drawIceClimb\(i\);drawIceShelfJoins\(i\);drawIceCrestSnow\(i\)/);
 for(const seed of [0,1,2,7,42,250,996]){
  vm.runInContext('applyRoute('+seed+')',vmCtx);
  const mountains=vm.runInContext('spires',vmCtx);
  for(let i=1;i<=3;i++){
   const routes=vm.runInContext('iceRouteNetwork('+i+')',vmCtx);
   for(const route of routes){
    const ledge=mountains[i].ledges[route.tier],entry=route.points[0];
    assert.equal(entry.y,ledge[2]-22);
    assert.ok(entry.x>ledge[0]+20&&entry.x<ledge[1]-5);
    assert.ok(ledge[1]-entry.x>=25);
   }
  }
 }
});
test('final cave peak has no long white needle waterfall graphics',()=>{
 const start=src.indexOf('if(i===4){'),end=src.indexOf('// Snow tongues descend',start);
 assert.ok(start>0&&end>start);
 const rock=src.slice(start,end);
 assert.doesNotMatch(rock,/\[L\+307,T-566,105\]/);
 assert.doesNotMatch(rock,/#[eE][cC][fF]7[fF]5[a-fA-F\d]{2}/);
 assert.match(rock,/Diffuse rock cracks instead of large/);
 assert.doesNotMatch(src,/if\(i===1\|\|i===3\)\{/);
 assert.match(src,/All ice-coloured features here are climbable routes/);
 assert.doesNotMatch(src,/x:L\+585,y:T-175,length:650/);
});
test('integrated outcrops use live mountain contours instead of detached triangular roots',()=>{
 assert.match(src,/function terraceButtressProfile\(/);
 assert.match(src,/const rootFace=mountainContourX\(i,y\+depth\+19\)/);
 assert.match(src,/terraceButtressProfile\(i,a,b,y\)/);
});
