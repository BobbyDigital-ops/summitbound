const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {performance}=require('node:perf_hooks');
const dir='public/game/scripts/';
function load(name,req=()=>{throw Error('Unrecognised import '+name)}){
 const ctx=vm.createContext({module:{exports:{}},require:req});
 vm.runInContext(fs.readFileSync(dir+name,'utf8'),ctx,{filename:name});
 return ctx.module.exports;
}
const kit=load('spire-kit-v10.js');
const assembler=load('spire-assembly-v10.js',()=>kit);
const course=load('spire-course-v11.js');
const game=load('spire-phase2-playtest.js');
const physicsContext=vm.createContext({});
vm.runInContext(fs.readFileSync(dir+'physics.js','utf8'),physicsContext);
const physics=vm.runInContext('PolePhysicsEngine',physicsContext);
const api={assemble:assembler.assemble,physics,config:game.CONFIG};
const clone=o=>JSON.parse(JSON.stringify(o));

function certifyMountain(peak,seed){
 const inspected=assembler.inspect(peak);
 assert.equal(inspected.valid,true,'seed '+seed+': '+inspected.errors.join('; '));
 assert.ok(peak.departure.width>=300,'run-up too short '+seed);
 assert.ok(peak.platforms.length>=2,'not enough ledges '+seed);
 assert.equal(peak.platforms.length,peak.colliders.length);
 for(const p of peak.platforms){
  assert.ok(p.width>=240,'landing width '+seed+' '+p.id);
  const collision=peak.colliders.find(c=>c.id===p.id);
  assert.ok(collision,'missing collision '+seed+' '+p.id);
  assert.ok(Math.abs(collision.left-p.left)<1e-7&&Math.abs(collision.right-p.right)<1e-7);
  if(p.kind==='rock'){
   assert.ok(assembler.rockLedgeInsideOwner(peak,p),
    'rock ledge outside its OWN parent block '+seed+' '+p.id);
   assert.ok(peak.pieces.some(q=>q.id===p.owner),'invalid parent');
  }
  const visited=new Set();let current=p.id;
  while(current!=='departure'){
   assert.ok(!visited.has(current),'cyclic climbing chain '+seed);
   visited.add(current);
   const r=peak.routes.find(x=>x.source===current);
   assert.ok(r,'stranded ledge '+seed+' '+current);
   current=r.target;
  }
 }
 for(const route of peak.routes){
  const source=peak.platforms.find(p=>p.id===route.source);
  const target=route.target==='departure'?peak.departure:
   peak.platforms.find(p=>p.id===route.target);
  assert.ok(source&&target);
  const h=route.width/2;
  for(const [label,p] of [['source',source],['exit',target]]){
   assert.ok(route.x-h>=p.left+3-1e-7&&route.x+h<=p.right-3+1e-7,
    'climb rail overhang '+seed+' '+route.id+' '+label);
  }
  assert.equal(route.fromY,source.y);
  assert.equal(route.toY,target.y);
  assert.ok(!peak.platforms.some(p=>p.id!==source.id&&p.id!==route.target&&
   p.y>route.toY&&p.y<route.fromY&&route.x>=p.left-1&&route.x<=p.right+1),
   'climb passes through intermediate ledge '+seed+' '+route.id);
 }
}
test('7C rock shelf parent-boundary constraint is strict, including entire slab thickness',()=>{
 const q=assembler.assemble(42);
 const ledge=q.platforms.find(p=>p.kind==='rock');
 assert.ok(ledge,'requires a rock shelf');
 assert.equal(assembler.rockLedgeInsideOwner(q,ledge),true);
 const protruding=clone(q),mutant=protruding.platforms.find(p=>p.id===ledge.id);
 mutant.vertices[0][0]-=5000;
 assert.ok(!assembler.rockLedgeInsideOwner(protruding,mutant));
 assert.match(assembler.inspect(protruding).errors.join('; '),/rock ledge breaches parent mountain block/);
 const wrongOwner=clone(q),wrong=wrongOwner.platforms.find(p=>p.id===ledge.id);
 wrong.owner='piece-missing';
 assert.equal(assembler.rockLedgeInsideOwner(wrongOwner,wrong),false);
 assert.match(assembler.inspect(wrongOwner).errors.join('; '),/rock ledge breaches parent mountain block/);
});
test('7C scaffold protrusion is allowed, rock protrusion never is',()=>{
 const q=assembler.assemble(43);
 const p=q.platforms.find(p=>p.kind==='scaffold');
 assert.ok(p);
 const scaffold=clone(q),pl=scaffold.platforms.find(x=>x.id===p.id);
 pl.left-=800;pl.width=pl.right-pl.left;pl.vertices[0][0]=pl.left;pl.vertices[3][0]=pl.left;
 scaffold.colliders.find(c=>c.id===pl.id).left=pl.left;
 assert.ok(assembler.inspect(scaffold).valid,'scaffold may genuinely protrude');
 pl.kind='rock';scaffold.colliders.find(c=>c.id===pl.id).kind='rock';
 assert.ok(!assembler.inspect(scaffold).valid,'same slab must be rejected as rock');
});
test('7C rejects disconnected route rails, rogue platform colliders, and overshooting intermediate shelves',()=>{
 const q=assembler.assemble(44);
 const brokenRoute=clone(q);brokenRoute.routes[0].x=brokenRoute.platforms.find(p=>p.id===brokenRoute.routes[0].source).right-1;
 brokenRoute.routes[0].finishX=brokenRoute.routes[0].x;
 assert.match(assembler.inspect(brokenRoute).errors.join('; '),/climb width breaches landing/);
 const brokenCollider=clone(q);brokenCollider.colliders[0].left-=12;
 assert.match(assembler.inspect(brokenCollider).errors.join('; '),/platform art\/collider mismatch/);
 const brokenHeight=clone(q);brokenHeight.routes[0].toY+=19;
 assert.match(assembler.inspect(brokenHeight).errors.join('; '),/climb height disconnect/);
});
test('7D stress: 1,200 generated spires, every parent rock ledge and every climbing connection',()=>{
 const durations=[],start=performance.now();
 let regenerated=0,rock=0,scaffold=0,ice=0,ladders=0;
 for(let seed=0;seed<1200;seed++){
  const t=performance.now(),spire=assembler.assemble(seed);
  durations.push(performance.now()-t);
  regenerated+=spire.generationAttempts-1;
  certifyMountain(spire,seed);
  for(const p of spire.platforms){if(p.kind==='rock')rock++;else scaffold++;}
  for(const r of spire.routes){if(r.kind==='ice')ice++;else ladders++;}
 }
 durations.sort((a,b)=>a-b);
 console.log('PHASE7D_SPIRE_STRESS '+JSON.stringify({
  seeds:1200,rockLedges:rock,scaffolds:scaffold,iceRoutes:ice,ladders,
  rejectedAndRegenerated:regenerated,p95ms:Math.round(durations[Math.floor(durations.length*.95)]*100)/100,
  totalMs:Math.round(performance.now()-start),failures:0}));
});
test('7D stress: 100 distinct five-spire four-vault courses including different gap bands',()=>{
 const durations=[],start=performance.now();
 let regenerated=0,widePlatforms=0;
 for(let n=0;n<100;n++){
  const seed=200+n,preset=1+(n%5),t=performance.now();
  const q=course.build(seed,{count:5,preset,varyGaps:true,maxCourseAttempts:15},api);
  durations.push(performance.now()-t);
  regenerated+=q.generationAttempts-1;
  assert.equal(q.peaks.length,5);
  assert.equal(q.crossings.length,4);
  assert.equal(course.audit(q).valid,true,'course '+seed+' has broken graph');
  for(let i=0;i<5;i++){
   certifyMountain(q.peaks[i],seed+':'+i);
   widePlatforms+=q.peaks[i].platforms.length;
  }
  for(let i=0;i<4;i++){
   const from=q.peaks[i],to=q.peaks[i+1],c=q.crossings[i];
   assert.ok(c.flightSampleVerified&&c.fullyAcceleratedFromRest);
   assert.ok(Math.abs((to.worldX+to.bounds.left)-(from.worldX+from.bounds.right)-c.gap)<1e-6);
   const landing=to.platforms.find(p=>p.id===c.targetPlatform);
   assert.ok(landing&&landing.kind==='scaffold','wrong arrival '+seed);
  }
 }
 durations.sort((a,b)=>a-b);
 console.log('PHASE7D_COURSE_STRESS '+JSON.stringify({courses:100,spires:500,crossings:400,
  checkedLandings:widePlatforms,rejectedAndRegenerated:regenerated,
  p95ms:Math.round(durations[Math.floor(durations.length*.95)]),totalMs:Math.round(performance.now()-start),
  failures:0}));
});
test('7D deterministic course seed and art-collider single source',()=>{
 for(const seed of [42,77,112]){
  const a=course.build(seed,{count:5,preset:2,varyGaps:true,maxCourseAttempts:15},api);
  const b=course.build(seed,{count:5,preset:2,varyGaps:true,maxCourseAttempts:15},api);
  assert.equal(JSON.stringify(a),JSON.stringify(b));
 }
});
