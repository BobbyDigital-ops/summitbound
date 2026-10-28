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

test('Live course applies certified width changes without losing viable routes',()=>{
 const c=world();
 const value=vm.runInContext(`(()=>{const saved=SummitShowcase;
  SummitShowcase=undefined;applyRoute(0);
  const before=saved.report(spires,shelfTimingProfiles,compilePhysicalCourseGraph,auditPlayableCourse);
  SummitShowcase=saved;applyRoute(0);
  const after=saved.report(spires,shelfTimingProfiles,compilePhysicalCourseGraph,auditPlayableCourse);
  return {check:saved.noRegression(before,after),changes:
   spires.flatMap((s,i)=>s.ledges.filter(l=>l.showcaseReason).map(l=>({peak:i,width:l[1]-l[0],reason:l.showcaseReason}))),
   weak:after.unreachable,graph:after.graphValid};
 })()`,c);
 console.log('LIVE_CURATED_CHANGES '+JSON.stringify(value));
 assert.ok(value.check.valid,value.check.issues.join('; '));
 // Existing Peak 1 graph discrepancy is measured and preserved, not silently dismissed.
 assert.ok(value.changes.length>=3,'Showcase did not create sufficient actual playable surface variation');
});

test('diagnose first low shelf: swept position and width candidates',()=>{
 const c=world();
 const results=vm.runInContext(`(()=>{applyRoute(0);
  const l=spires[1].ledges[0],original=l.slice(),out=[];
  for(const dx of [-100,-70,-40,-20,0,20,40,70,100])
   for(const dw of [0,30,60,100,150])
    for(const dy of [-45,-20,0,20,45]){
     l[0]=original[0]+dx;l[1]=original[1]+dx+dw;l[2]=original[2]+dy;
     const p=shelfTimingProfiles(spires[1].ledges,spires[0].summit)[0];
     if(p.safe>=2)out.push({dx,dw,dy,...p});
    }
  l.splice(0,l.length,...original);
  return out.sort((a,b)=>a.dw-b.dw||Math.abs(a.dx)+Math.abs(a.dy)-Math.abs(b.dx)-Math.abs(b.dy)).slice(0,40);
 })()`,c);
 console.log('PEAK1_SAFE_CANDIDATES '+JSON.stringify(results));
 assert.ok(results.length>0,'no geometry proposals could fix the ledge');
});
