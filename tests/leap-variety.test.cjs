const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');
const src=fs.readFileSync('public/game/scripts/world-data.js','utf8');
const ctx=vm.createContext({Image:class Image{},document:{getElementById:()=>null},platforms:[]});
vm.runInContext(src,ctx);
vm.runInContext('applyRoute(0)',ctx);
test('four leaps have recognisably varied horizontal and vertical challenges',()=>{
 const s=vm.runInContext('spires',ctx);
 const left=i=>i===4?s[4].cave.left:s[i].ledges[2][0];
 const gap=[1,2,3,4].map(i=>left(i)-s[i-1].summit[1]);
 const dest=[1,2,3,4].map(i=>i===4?s[4].cave.floor:s[i].ledges[1][2]);
 assert.ok(gap[1]>gap[0]+50,'second jump must be substantially wider than first');
 assert.ok(gap[2]<gap[1]-25,'third jump must be shorter');
 assert.ok(gap[3]>gap[2]+45,'final cave should demand another long crossing');
 assert.ok(s[2].ledges[1][2]<s[1].summit[2],'second jump is uphill, not descending');
 assert.ok(s[3].summit[2]<s[2].summit[2]-100,'third mountain must be higher');
 assert.equal(new Set(dest).size,4,'all four target heights must differ');
});
for(let route=0;route<9;route++){
 test('seed '+(route+1)+' has ascending ledges and a usable cave',()=>{
  vm.runInContext('applyRoute('+route+')',ctx);
  const s=vm.runInContext('spires',ctx);
  for(let i=1;i<=3;i++){
   const ledges=s[i].ledges.slice().sort((a,b)=>a[2]-b[2]);
   assert.equal(ledges.length,3);
   for(let j=0;j<3;j++){
    assert.ok(ledges[j][2]>s[i].summit[2]+35,'ledge under summit');
    assert.ok(ledges[j][1]-ledges[j][0]>=70,'landing is wide enough');
   }
   assert.ok(ledges[0][2]<ledges[1][2]&&ledges[1][2]<ledges[2][2],'order matters');
  }
  const c=s[4].cave;
  assert.ok(c.floor-c.ceiling>=110,'cave vertical opening');
  assert.ok(c.right-c.left>=175,'cave runout');
  assert.ok(c.left>s[3].summit[1]+500&&c.left<s[3].summit[1]+750,'uphill cave gap');
 });
}
test('cave mouth now uses a clipped organic arch with multiple depth layers',()=>{
 const s=fs.readFileSync('public/game/scripts/rendering.js','utf8');
 const f=s.slice(s.indexOf('function drawCave(){'),s.indexOf('// 4. One frozen ice ascent'));
 assert.match(f,/const traceMouth=/);assert.match(f,/ctx\.clip\(\)/);
 assert.match(f,/Concentric rock layers/);assert.match(f,/fire at the end of the cave/i);
});