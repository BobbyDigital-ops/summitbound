const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');
const dir='public/game/scripts/';
function load(name,req=()=>{throw Error('Unrecognised import '+name)}){
 const m={module:{exports:{}},require:req};
 vm.runInNewContext(fs.readFileSync(dir+name,'utf8'),m,{filename:name});
 return m.module.exports;
}
const kit=load('spire-kit-v10.js');
const assembly=load('spire-assembly-v10.js',()=>kit);
const courseApi=load('spire-course-v11.js');
const spacing=load('spire-gap-scale-v17.js');
const game=load('spire-phase2-playtest.js');
const physicsCtx=vm.createContext({});
vm.runInContext(fs.readFileSync(dir+'physics.js','utf8'),physicsCtx);
const physics=vm.runInContext('PolePhysicsEngine',physicsCtx);
const source=courseApi.build(42,{count:5,preset:1,varyGaps:true,maxCourseAttempts:15},{
 assemble:assembly.assemble,physics,config:game.CONFIG
});
test('all ten standard gaps are increased by exactly 10×',()=>{
 assert.deepEqual([...spacing.BASE_GAPS],[90,150,210,270,330,390,450,510,570,630]);
 assert.deepEqual([...spacing.TENFOLD_GAPS],[900,1500,2100,2700,3300,3900,4500,5100,5700,6300]);
 const snapshot=JSON.stringify(source);
 for(let preset=1;preset<=10;preset++){
  const before=spacing.layout(source,preset,1),after=spacing.layout(source,preset,10);
  assert.equal(after.visualOnly,true);
  assert.equal(after.physicallyReachable,false);
  assert.equal(spacing.audit(after).valid,true);
  assert.equal(after.crossings.length,4);
  for(let i=0;i<4;i++){
   assert.equal(after.crossings[i].gap,before.crossings[i].gap*10);
   assert.equal(after.crossings[i].flightSampleVerified,false);
   const actual=(after.peaks[i+1].worldX+after.peaks[i+1].bounds.left)
    -(after.peaks[i].worldX+after.peaks[i].bounds.right);
   assert.ok(Math.abs(actual-spacing.TENFOLD_GAPS[preset-1])<1e-6);
   assert.strictEqual(after.peaks[i].pieces,source.peaks[i].pieces);
   assert.strictEqual(after.peaks[i].platforms,source.peaks[i].platforms);
  }
 }
 assert.equal(JSON.stringify(source),snapshot,'visual experiment must not mutate gameplay');
});
test('invalid gap preset or unphysical multiplier fails with a clear error',()=>{
 for(const preset of [-1,0,11,99])assert.throws(()=>spacing.layout(source,preset,10),/Invalid gap preset/);
 assert.throws(()=>spacing.layout(source,1,11),/Gap multiplier/);
 assert.throws(()=>spacing.layout({peaks:[source.peaks[0]]},1,10),/at least two/);
});
test('preview is isolated from original playable level physics and certification',()=>{
 assert.equal(source.audit.valid,true);
 assert.equal(source.standingStartCertified,true);
 assert.ok(source.crossings.every(c=>c.flightSampleVerified));
 const preview=spacing.layout(source,1,10);
 assert.ok(preview.crossings.every(c=>!c.flightSampleVerified));
 assert.ok(preview.peaks.every((p,i)=>p.departure===source.peaks[i].departure));
});
