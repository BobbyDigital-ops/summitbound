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
 assert.match(src,/const maxLeft=Math\.min\(34,x-ledge\[0\]-5\)/);
 assert.match(src,/const maxRight=Math\.min\(30,ledge\[1\]-x-5\)/);
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
test('featured bleak rock painter adds no decorative waterfall or unsupported icy needle',()=>{
 const bleak=fs.readFileSync('public/game/scripts/bleak-art.js','utf8');
 assert.match(bleak,/drawSpire=function bleakSpire/);
 assert.match(bleak,/bleakRockMass\(g,i,summit\[0\],summit\[1\]/);
 assert.match(bleak,/const routes=iceRouteNetwork\(i\)/);
 assert.match(bleak,/const ledge=m.ledges\[j\]/);
 assert.doesNotMatch(bleak,/waterfall|x:L\+585,y:T-175,length:650/i);
});
test('integrated outcrops use live mountain contours instead of detached triangular roots',()=>{
 assert.match(src,/function terraceButtressProfile\(/);
 assert.match(src,/const rootFace=mountainContourX\(i,y\+depth\+19\)/);
 assert.match(src,/terraceButtressProfile\(i,a,b,y\)/);
});
