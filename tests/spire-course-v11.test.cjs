const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const dir='public/game/scripts/';
function load(name,req=()=>{throw Error('Unexpected require')}){
 const ctx=vm.createContext({module:{exports:{}},require:req});
 vm.runInContext(fs.readFileSync(dir+name,'utf8'),ctx,{filename:name});
 return ctx.module.exports;
}
const K=load('spire-kit-v10.js'),A=load('spire-assembly-v10.js',()=>K),
 C=load('spire-course-v11.js'),P=load('spire-phase2-playtest.js');
const ctx=vm.createContext({});vm.runInContext(fs.readFileSync(dir+'physics.js','utf8'),ctx);
const physics=vm.runInContext('PolePhysicsEngine',ctx),api={assemble:A.assemble,physics,config:P.CONFIG};
const GAPS=[30,50,70,90,110,130,150,170,190,210];
test('exactly ten fixed, increasing, distinct world-space rock gaps',()=>{
 assert.deepEqual(Array.from(C.GAP_PRESETS,x=>x.gap),GAPS);
 assert.deepEqual(Array.from(C.GAP_PRESETS,x=>x.id),[1,2,3,4,5,6,7,8,9,10]);
});
test('all ten distances produce 5-spire courses across representative seeds with sampled existing-physics landings',()=>{
 const seeds=[1,7,13,42,101,257,499,1001];
 for(const option of C.GAP_PRESETS)for(const seed of seeds){
  const course=C.build(seed,{preset:option.id},api);
  assert.equal(course.peaks.length,5);
  assert.equal(course.crossings.length,4);
  assert.equal(course.gap,option.gap);
  assert.equal(course.fullGameplayCertified,false);
  for(let i=0;i<course.crossings.length;i++){
   const from=course.peaks[i],to=course.peaks[i+1],crossing=course.crossings[i];
   const gap=(to.worldX+to.bounds.left)-(from.worldX+from.bounds.right);
   assert.ok(Math.abs(gap-option.gap)<1e-8,'gap '+option.id+' seed '+seed);
   assert.ok(A.inspect(from).valid&&A.inspect(to).valid);
   assert.ok(crossing.flightSampleVerified);
   const target=to.platforms.find(p=>p.id===crossing.targetPlatform);
   assert.ok(target,'crossing destination not a genuine generated platform');
   assert.ok(Math.abs((to.worldY+target.y)-(from.worldY+from.departure.y-crossing.rise))<1e-8);
   const sample=crossing.flight;
   const worldLanding=from.worldX+sample.landingX;
   assert.ok(worldLanding>=to.worldX+target.left+4&&worldLanding<=to.worldX+target.right-4,
    'sample missed target collider');
   assert.ok(from.worldX+sample.releaseX<to.worldX+target.left+1,'pole released after destination');
   const runup=Math.max(0,sample.launchX-from.departure.left-5);
   assert.ok(sample.speed*sample.speed/(2*api.config.runAcceleration)<=runup+1e-5,
    'unearned takeoff speed');
   assert.equal(sample.landingHeightRise,40);
  }
 }
});
test('reproducible seeded course, invalid gap requests rejected, no alteration of physics source',()=>{
 const a=C.build(42,{preset:7},api),b=C.build(42,{preset:7},api);
 assert.equal(JSON.stringify(a),JSON.stringify(b));
 assert.throws(()=>C.build(42,{preset:0},api),/Unknown gap/);
 assert.throws(()=>C.build(42,{preset:11},api),/Unknown gap/);
 assert.throws(()=>C.build(42,{preset:2,rise:300},api),/Rise/);
 const source=fs.readFileSync(dir+'spire-course-v11.js','utf8');
 assert.ok(!source.includes('Five Peaks'));
 assert.ok(!source.includes('world-data.js'));
});
