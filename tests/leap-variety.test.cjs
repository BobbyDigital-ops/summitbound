const test=require('node:test'),assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');
const ctx=vm.createContext({Image:class Image{},document:{getElementById:()=>null},platforms:[]});
vm.runInContext(fs.readFileSync('public/game/scripts/world-data.js','utf8'),ctx);
for(let seed=0;seed<9;seed++){
 test('seed '+seed+' has distinct viable uphill ledge options',()=>{
  vm.runInContext('applyRoute('+seed+')',ctx);
  const s=vm.runInContext('spires',ctx);
  for(let i=1;i<=3;i++){
   const ledges=s[i].ledges.slice().sort((a,b)=>a[2]-b[2]);
   assert.ok(ledges.length>=1&&ledges.length<=4);
   for(const t of ledges){
    assert.ok(t[2]>s[i].summit[2]+35,'ledge below own summit');
    assert.ok(t[2]<s[i-1].summit[2],'ledge ABOVE previous summit');
    assert.ok(t[1]-t[0]>=70,'usable runout');
   }
   for(let j=1;j<ledges.length;j++)assert.ok(ledges[j-1][2]<ledges[j][2]);
  }
  assert.ok(s[4].cave.floor<s[3].summit[2]);
  assert.ok(s[4].cave.right-s[4].cave.left>=170);
 });
}
test('cave contains a genuine recessed rock mouth',()=>{
 const s=fs.readFileSync('public/game/scripts/rendering.js','utf8');
 const cave=s.slice(s.indexOf('function drawCave(){'),s.indexOf('// 4. One frozen ice ascent'));
 assert.match(cave,/const traceMouth=/);
 assert.match(cave,/ctx.clip\(\)/);
 assert.match(cave,/Concentric rock layers/);
});