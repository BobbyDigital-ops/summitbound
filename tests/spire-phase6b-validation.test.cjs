const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const dir='public/game/scripts/';
function load(n,req=()=>{throw Error('Unexpected import')}){
 const ctx=vm.createContext({module:{exports:{}},require:req});
 vm.runInContext(fs.readFileSync(dir+n,'utf8'),ctx,{filename:n});
 return ctx.module.exports;
}
const kit=load('spire-kit-v10.js');
const assembly=load('spire-assembly-v10.js',()=>kit);
const generator=load('spire-course-v11.js');
const game=load('spire-phase2-playtest.js');
const ctx=vm.createContext({});
vm.runInContext(fs.readFileSync(dir+'physics.js','utf8'),ctx);
const physics=vm.runInContext('PolePhysicsEngine',ctx);
const api={assemble:assembly.assemble,physics,config:game.CONFIG};
const baseSettings={count:5,preset:1,varyGaps:true,maxCourseAttempts:15};
function check(course){
 const audit=generator.audit(course);
 assert.equal(audit.valid,true,audit.errors.join('; '));
 assert.equal(course.peaks.length,5);
 assert.equal(course.crossings.length,4);
 assert.deepEqual(Array.from(course.gaps),[90,150,210,90]);
 for(let i=0;i<4;i++){
  const q=course.crossings[i],from=course.peaks[i],to=course.peaks[i+1];
  assert.equal(q.from,i);assert.equal(q.to,i+1);
  assert.equal((to.worldX+to.bounds.left)-(from.worldX+from.bounds.right),q.gap);
  assert.ok(q.flightSampleVerified&&q.fullyAcceleratedFromRest);
  assert.ok(to.platforms.some(p=>p.id===q.targetPlatform&&p.kind==='scaffold'));
 }
}
test('Phase 6A five-spire generator produces a certified four-leg varied course',()=>{
 const course=generator.build(42,baseSettings,api);
 check(course);
 assert.ok(course.generationAttempts>=1);
});
test('Phase 6B rejects damaged gaps, missing landing routes and invalid platforms',()=>{
 const good=generator.build(43,baseSettings,api);
 const shifted={...good,crossings:good.crossings.map(c=>({...c}))};
 shifted.crossings[0].gap+=17;
 assert.ok(generator.audit(shifted).errors.some(x=>x.includes('incorrect rock gap')));
 const stranded={...good,peaks:good.peaks.map(p=>({...p,routes:[...p.routes]}))};
 stranded.peaks[1].routes=[];
 assert.ok(generator.audit(stranded).errors.some(x=>x.includes('climb dead end')));
 const noLanding={...good,crossings:good.crossings.map(c=>({...c}))};
 noLanding.crossings[1].targetPlatform='missing';
 assert.ok(generator.audit(noLanding).errors.some(x=>x.includes('missing landable scaffold')));
});
test('Phase 6B seed sweep: varied five-spire routes have no structural dead ends',()=>{
 for(const seed of [42,43,44,45,46,47,48,49]){
  const course=generator.build(seed,baseSettings,api);
  check(course);
 }
});
test('Phase 6B generator is deterministic and handles unattainable requests by rejection',()=>{
 const a=generator.build(43,baseSettings,api),b=generator.build(43,baseSettings,api);
 assert.equal(JSON.stringify(a),JSON.stringify(b));
 assert.throws(()=>generator.build(42,{count:5,preset:11,maxCourseAttempts:1},api),/Unknown gap preset/);
 assert.throws(()=>generator.build(42,{count:9,preset:1,maxCourseAttempts:1},api),/Course needs 2/);
});
