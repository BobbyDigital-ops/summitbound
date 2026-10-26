const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('public/game/scripts/world-data.js','utf8');
const ctx=vm.createContext({Image:class Image{},document:{getElementById:()=>null},platforms:[]});
vm.runInContext(src,ctx);
for(let seed=0;seed<9;seed++){
 test('route '+seed+': ALL destinations above previous summit',()=>{
  vm.runInContext('applyRoute('+seed+')',ctx);
  const s=vm.runInContext('spires',ctx);
  for(let i=1;i<=3;i++){
   for(const ledge of s[i].ledges){
    assert.ok(ledge[2]<s[i-1].summit[2],
      'must climb in altitude at spire '+i+' '+ledge[4]);
    assert.ok(ledge[2]>s[i].summit[2]+35,
      'ledge remains below its own summit '+i+' '+ledge[4]);
   }
   const xs=s[i].ledges.map(a=>a[0]);
   assert.ok(Math.max(...xs)-Math.min(...xs)>100,
      'terraces need meaningful horizontal stagger');
  }
  assert.ok(s[4].cave.floor<s[3].summit[2],
    'final cave must be HIGHER than previous summit');
  assert.ok(s[4].summit[2]<s[4].cave.ceiling,
    'cave is set into the side far below final summit');
  assert.ok(s[4].cave.right-s[4].cave.left>=170);
  assert.ok(s[4].cave.left-s[3].summit[1]>500);
 });
}
test('wall terrain variation and slow paced ice tools retained',()=>{
 const r=fs.readFileSync('public/game/scripts/rendering.js','utf8');
 const sim=fs.readFileSync('public/game/scripts/simulation.js','utf8');
 assert.match(r,/function cliffMicroTerrain/);
 assert.match(r,/function drawIcePicks/);
 assert.match(r,/Math\.floor\(\(p\.climb\?\.climbBeat \|\| 0\) \/ 2\)/);
 assert.match(sim,/climbBeat \+= \(oldY - p\.y\) \/ 24/);
});
