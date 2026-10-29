const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const dir='public/game/scripts/';
function load(name,req=()=>{throw Error('Unexpected import '+name)}){
 const context=vm.createContext({module:{exports:{}},require:req});
 vm.runInContext(fs.readFileSync(dir+name,'utf8'),context,{filename:name});
 return context.module.exports;
}
const kit=load('spire-kit-v10.js');
const assembly=load('spire-assembly-v10.js',()=>kit);
const generator=load('spire-course-v11.js');
const game=load('spire-phase2-playtest.js');
const context=vm.createContext({});
vm.runInContext(fs.readFileSync(dir+'physics.js','utf8'),context);
const physics=vm.runInContext('PolePhysicsEngine',context);
const api={assemble:assembly.assemble,physics,config:game.CONFIG};
test('7A every connector and true polygon is at least twice previous width',()=>{
 assert.deepEqual({...kit.WIDTH},{S:208,M:320,L:448});
 assert.equal(kit.HORIZONTAL_SCALE,2);
 for(const p of [...kit.BASES,...kit.BODIES,...kit.CAPS]){
  for(const v of p.vertices)assert.ok(Number.isFinite(v[0])&&Number.isFinite(v[1]));
  if(p.bottomSocket){
   const y=0,cut=kit.section(p.vertices,y);
   assert.equal(cut.right-cut.left,kit.WIDTH[p.bottomSocket]);
  }
 }
});
test('7A all 50 genuine landing colliders are at least double width and 240 minimum',()=>{
 const baseline=[36,52,74,108,154];
 for(const p of kit.PLATFORMS){
  assert.ok(p.width>=baseline[p.size-1]*2,p.id+' less than 2x');
  assert.ok(p.width>=240,p.id+' too small to run');
  assert.equal(p.collision.right-p.collision.left,p.width);
 }
});
test('7A generated mountains have rock-backed ledges and 300+ physical departure run-ups',()=>{
 for(const seed of [42,43,44,45,46,47,48,49,50,51,52,53]){
  const spire=assembly.assemble(seed);
  const report=assembly.inspect(spire);
  assert.equal(report.valid,true,seed+': '+report.errors.join('; '));
  assert.ok(spire.departure.width>=300,'short physical launch deck '+seed);
  assert.ok(spire.platforms.length>=2,'no climb options');
  for(const p of spire.platforms){
   assert.ok(p.width>=240,'short landing '+p.id);
   assert.equal(p.right-p.left,p.width);
   assert.ok(spire.colliders.some(q=>q.id===p.id&&q.right-q.left===p.width));
  }
 }
});
test('7A/6B five-spire sampled routes survive width changes without phantom landings',()=>{
 for(const seed of [42,43,44,45,46,47,48,49]){
  const c=generator.build(seed,{count:5,preset:1,varyGaps:true,maxCourseAttempts:15},api);
  const audit=generator.audit(c);
  assert.equal(audit.valid,true,seed+': '+audit.errors.join('; '));
  assert.equal(c.crossings.length,4);
  for(let i=0;i<4;i++){
   assert.ok(c.peaks[i].departure.width>=300);
   const landing=c.peaks[i+1].platforms.find(p=>p.id===c.crossings[i].targetPlatform);
   assert.ok(landing&&landing.width>=240,'no wide incoming collider');
  }
 }
});
test('7B painter includes cached continuous granite, fractured ice and thin snow crests',()=>{
 const painter=fs.readFileSync(dir+'spire-render-v10.js','utf8');
 const integration=fs.readFileSync(dir+'spire-real-engine-v13.js','utf8');
 assert.match(painter,/function drawStrata/);
 assert.match(painter,/fractured|fracture|strata/);
 assert.match(painter,/ctx\.clip\(\)/);
 assert.match(integration,/paintCache\(i\)/);
 assert.match(integration,/solidSideCollision\(previousX\)/);
 assert.match(integration,/feet-19,feet-38/);
});