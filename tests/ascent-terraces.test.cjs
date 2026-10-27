const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('public/game/scripts/world-data.js','utf8');
const ctx=vm.createContext({Image:class Image{},document:{getElementById:()=>null},platforms:[]});
vm.runInContext(fs.readFileSync('public/game/scripts/physics.js','utf8'),ctx);
vm.runInContext(src,ctx);
for(let seed=0;seed<9;seed++){
 test('route '+seed+': alternatives span high and low shelves before the uphill summit',()=>{
  vm.runInContext('applyRoute('+seed+')',ctx);
  const s=vm.runInContext('spires',ctx);
  for(let i=1;i<=3;i++){
   for(const ledge of s[i].ledges){
    assert.ok(ledge[2]<s[i-1].summit[2]+375,
      'cannot descend beyond safe landing envelope at spire '+i+' '+ledge[4]);
    assert.ok(ledge[2]>s[i].summit[2]+35,
      'ledge remains below its own summit '+i+' '+ledge[4]);
   }
   const low=s[i].ledges[0],high=s[i].ledges.at(-1);
   assert.ok(low[2]>s[i-1].summit[2]+145,
    'lower shelf needs substantial descent and longer ice climb');
   assert.ok(high[2]<s[i-1].summit[2]-75,
    'upper shelf must materially save climbing');
   assert.ok(s[i].summit[2]<s[i-1].summit[2]-130,
    'the summit must still progress uphill');
   const xs=s[i].ledges.map(a=>a[0]);
   assert.ok(xs.length===1 || Math.max(...xs)-Math.min(...xs)>115,
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
 assert.match(r,/const beat=p\.climb\.climbBeat\*Math\.PI\*\.72/);
 assert.match(sim,/c\.climbBeat\+=\(oldY-p\.y\)\/24/);
 assert.match(sim,/c\.climbBeat\+=\(oldY-p\.y\)\/24/);
});
