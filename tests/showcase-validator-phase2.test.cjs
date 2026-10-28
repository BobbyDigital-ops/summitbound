const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function world(){
 const document={getElementById(){return {hidden:false,style:{},classList:{add(){},remove(){}},textContent:'',getContext(){return {}},addEventListener(){}}},querySelectorAll(){return []}};
 const c=vm.createContext({Image:class Image{},document,innerWidth:1200,innerHeight:780,performance:{now:()=>1},navigator:{vibrate(){}},localStorage:{getItem(){return null},setItem(){}}});
 for(const p of ['physics.js','world-data.js','course-engine.js','pole-dynamics.js','level-engine-v1.js','showcase-validator-v1.js'])
  vm.runInContext(fs.readFileSync('public/game/scripts/'+p,'utf8'),c,{filename:p});
 return c;
}
test('Five showcase challenges audited against actual flight windows',()=>{
 const c=world();
 const v=vm.runInContext(`(()=>{applyRoute(0);
  return SummitShowcase.report(spires,shelfTimingProfiles,compilePhysicalCourseGraph,auditPlayableCourse);
 })()`,c);
 assert.equal(v.motifs.length,5);
 assert.equal(new Set(v.motifs.map(m=>m.kind)).size,5);
 assert.ok(v.links.length>=6);
 console.log('BASELINE_REPORT '+JSON.stringify({unreachable:v.unreachable,auditFailures:v.auditFailures,links:v.links}));
});
test('Reject shrink that destroys an existing first-contact landing',()=>{
 const c=world();
 const v=vm.runInContext(`(()=>{applyRoute(0);
  const f=()=>SummitShowcase.report(spires,shelfTimingProfiles,compilePhysicalCourseGraph,auditPlayableCourse);
  const before=f(),pl=spires[2].ledges[0],original=pl[1];
  pl[1]=pl[0]+34;const after=f();pl[1]=original;
  return SummitShowcase.noRegression(before,after);
 })()`,c);
 assert.equal(v.valid,false);
 console.log('EXPECTED_REJECTION '+JSON.stringify(v.issues));
});
test('Measure candidate width adjustments without changing approved map',()=>{
 const c=world();
 const v=vm.runInContext(`(()=>{applyRoute(0);
  const f=()=>SummitShowcase.report(spires,shelfTimingProfiles,compilePhysicalCourseGraph,auditPlayableCourse);
  const before=f(),candidates=[];
  for(let peak=1;peak<=4;peak++)for(let i=0;i<spires[peak].ledges.length;i++){
   const ledge=spires[peak].ledges[i],old=ledge[1];
   for(const delta of [-24,-12,12,24]){
    ledge[1]=old+delta;
    const result=SummitShowcase.noRegression(before,f());
    candidates.push({peak,tier:i,delta,valid:result.valid,issues:result.issues.slice(0,3)});
   }
   ledge[1]=old;
  }
  return candidates;
 })()`,c);
 console.log('CANDIDATE_WIDTHS '+JSON.stringify(v));
 assert.ok(v.some(x=>x.valid),'No safe width alterations found');
});
