const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context=vm.createContext({Image:class Image{},document:{getElementById:()=>null},platforms:[]});
vm.runInContext(fs.readFileSync('public/game/scripts/physics.js','utf8'),context);
vm.runInContext(fs.readFileSync('public/game/scripts/world-data.js','utf8'),context);
for(let route=0;route<9;route++){
 test('route '+route+' provides spaced meaningful climb choices',()=>{
  vm.runInContext('applyRoute('+route+')',context);
  const s=vm.runInContext('spires',context);
  for(let i=1;i<=3;i++){
   const ledges=s[i].ledges.slice().sort((a,b)=>a[2]-b[2]);
   assert.ok(ledges.length>=1&&ledges.length<=4);
   const x=ledges.map(t=>t[0]);
   if(x.length>=2)assert.ok(Math.max(...x)-Math.min(...x)>=160,'shelves should be spread along face');
   for(let j=1;j<ledges.length;j++) assert.ok(ledges[j][2]-ledges[j-1][2]>=28,'no compressed shelf stack');
   for(const ledge of ledges){
    assert.ok(ledge[2]<s[i-1].summit[2],'every landing must gain altitude');
    assert.ok(ledge[2]>s[i].summit[2]+32,'ledge must be visibly beneath peak');
    assert.ok(ledge[1]-ledge[0]>=75,'enough landing runout');
   }
  }
  assert.ok(s[4].cave.floor<s[3].summit[2],'fire is UPHILL');
 });
}
