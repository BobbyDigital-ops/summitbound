const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const dir='public/game/scripts/';
function load(name,requireFn=()=>{throw Error('Unexpected external import')}){
 const ctx=vm.createContext({module:{exports:{}},require:requireFn});
 vm.runInContext(fs.readFileSync(dir+name,'utf8'),ctx,{filename:name});
 return ctx.module.exports;
}
const kit=load('spire-kit-v10.js'),assembler=load('spire-assembly-v10.js',()=>kit);
const courseApi=load('spire-course-v11.js'),game=load('spire-phase2-playtest.js');
const ctx=vm.createContext({});vm.runInContext(fs.readFileSync(dir+'physics.js','utf8'),ctx);
const physics=vm.runInContext('PolePhysicsEngine',ctx);
const api={assemble:assembler.assemble,physics,config:game.CONFIG};
const gaps=[90,150,210,270,330,390,450,510,570,630];
test('the full ten gap progression is exactly 3x 30–210, with no pole physics edits',()=>{
 assert.deepEqual(Array.from(courseApi.GAP_PRESETS,x=>x.gap),gaps);
 assert.deepEqual(Array.from(courseApi.GAP_PRESETS,x=>x.id),[1,2,3,4,5,6,7,8,9,10]);
 const src=fs.readFileSync(dir+'spire-course-v11.js','utf8');
 assert.ok(src.includes('incomingScaffold('));
 assert.ok(src.includes('runStartX'));
});
test('all ten generated two-spire gaps are certified from 0 speed, 3 seeds each',()=>{
 for(let id=1;id<=10;id++)for(const seed of [42,43,44]){
  const course=courseApi.build(seed,{count:2,preset:id},api);
  const from=course.peaks[0],to=course.peaks[1],cross=course.crossings[0],f=cross.flight;
  assert.equal(course.gap,gaps[id-1]);
  assert.ok(Math.abs((to.worldX+to.bounds.left)-(from.worldX+from.bounds.right)-course.gap)<1e-7);
  assert.ok(cross.fullyAcceleratedFromRest);
  assert.equal(cross.landingType,'visible-scaffold');
  assert.equal(f.runStartX,from.departure.left+12);
  let x=f.runStartX,v=0;
  for(let i=0;i<f.runFrames;i++){
   v=Math.min(api.config.maxRunSpeed,v+api.config.runAcceleration/120);
   x+=v/120;
  }
  assert.ok(Math.abs(x-f.launchX)<1e-8,'plant x not attainable from real input');
  assert.ok(Math.abs(v-f.speed)<1e-8,'launch requires an injected velocity');
  const deck={x:(from.departure.left+from.departure.right)/2,
   y:from.departure.y+60,width:from.departure.width,height:120};
  const plant=physics.validatePlantPoint(f.launchX,from.departure.y-22,1,[deck],api.config);
  assert.ok(plant.isValid,'cannot plant pole on generated orange deck');
  const landing=to.platforms.find(p=>p.id===cross.targetPlatform);
  assert.ok(landing&&landing.kind==='scaffold'&&landing.width>=150);
  assert.ok(landing.left<to.bounds.left,'incoming scaffold does not protrude beyond silhouette');
  assert.ok(landing.vertices.length>=4&&landing.braces.length>=2,'scaffold missing physical art');
  const route=to.routes.find(r=>r.source===landing.id);
  assert.ok(route,'receiving scaffold has no onward climb route');
  assert.ok(route.x>=landing.left&&route.x<=landing.right,'climb not on scaffold');
  assert.ok(course.physicsSampled&&course.standingStartCertified);
  assert.equal(course.fullGameplayCertified,false,'do not overclaim untested full game');
 }
});
test('landings remain deterministic across repeated runs and use only real platform collision',()=>{
 for(const id of [1,5,10]){
  const a=courseApi.build(44,{preset:id,count:2},api);
  const b=courseApi.build(44,{preset:id,count:2},api);
  assert.equal(JSON.stringify(a),JSON.stringify(b));
 }
});
