const test=require('node:test'),assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');
const root='public/game/scripts/';
function load(name,req=()=>{throw Error('unexpected import')}){
 const context=vm.createContext({module:{exports:{}},require:req});
 vm.runInContext(fs.readFileSync(root+name,'utf8'),context,{filename:name});
 return context.module.exports;
}
const kit=load('spire-kit-v10.js');
const ass=load('spire-assembly-v10.js',()=>kit);
const classic=load('spire-course-v11.js');
const long=load('spire-long-gap-v18.js');
const game=load('spire-phase2-playtest.js');
const phyCtx=vm.createContext({});
vm.runInContext(fs.readFileSync(root+'physics.js','utf8'),phyCtx);
const physics=vm.runInContext('PolePhysicsEngine',phyCtx);
const api={assemble:ass.assemble,physics,config:game.CONFIG};

test('exact 10x outer-rock gaps in true playable geometry, with unchanged spire polygons and routes',()=>{
 for(let preset=1;preset<=10;preset++){
  const base=classic.build(42,{count:5,preset,varyGaps:true,maxCourseAttempts:15},api);
  const result=long.transform(base,10);
  assert.equal(long.audit(result).valid,true);
  assert.equal(result.gapScale,10);
  assert.equal(result.crossings.length,4);
  for(let i=0;i<4;i++){
   const leg=result.crossings[i],source=result.peaks[i],to=result.peaks[i+1];
   assert.equal(leg.gap,base.crossings[i].gap*10);
   assert.equal((to.worldX+to.bounds.left)-(source.worldX+source.bounds.right),leg.gap);
   const f=leg.flight,baseF=base.crossings[i].flight;
   assert.ok(f.longTimeScale>1&&f.longTimeScale<8);
   assert.ok(Math.abs(f.landingX-(baseF.landingX+leg.baselineGap*9))<1e-6);
   assert.ok(Math.abs((f.longTimeScale**2)*
     (baseF.landingX-baseF.releaseX)-(f.landingX-f.releaseX))<1e-6);
   assert.equal(leg.flightSampleVerified,false,'long mode needs runtime proof');
   assert.equal(result.peaks[i].pieces,base.peaks[i].pieces);
   assert.equal(result.peaks[i].routes,base.peaks[i].routes);
  }
 }
});
test('invalid inputs and noncertified original flights are rejected',()=>{
 const base=classic.build(42,{count:5,preset:1,varyGaps:true,maxCourseAttempts:15},api);
 assert.throws(()=>long.transform(base,11),/Unsupported/);
 assert.throws(()=>long.transform({},10),/Certified/);
 const broken={...base,crossings:base.crossings.map(c=>({...c}))};
 broken.crossings[0].flightSampleVerified=false;
 assert.throws(()=>long.transform(broken,10),/uncertified/);
});
test('no original pole/terrain physics or baseline geometry changes',()=>{
 const base=classic.build(43,{count:5,preset:1,varyGaps:true,maxCourseAttempts:15},api);
 const snapshot=JSON.stringify(base);
 const v=long.transform(base);
 assert.equal(JSON.stringify(base),snapshot);
 assert.equal(base.crossings[0].gap,90);
 assert.equal(v.crossings[0].gap,900);
});
