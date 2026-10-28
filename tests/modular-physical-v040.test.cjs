const test=require('node:test'),assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');
function make(){
 const document={getElementById(){return null}};
 const ctx=vm.createContext({Image:class Image{},document,performance:{now(){return 0}},navigator:{},innerWidth:1280,innerHeight:800});
 for(const file of ['physics.js','world-data.js','course-engine.js','pole-dynamics.js','true-peak-mesh-v041.js','modular-course-v040.js']){
  vm.runInContext(fs.readFileSync('public/game/scripts/'+file,'utf8'),ctx,{filename:file});
 }
 return ctx;
}
test('modular templates use finite S/M/L connectors and 50 interchangeable platform assets',()=>{
 const c=make(),result=vm.runInContext('({connector:Object.keys(SummitModularEngine.CONNECTOR),platforms:SummitModularEngine.PLATFORM_LIBRARY,bases:SummitModularEngine.BASES.length})',c);
 assert.deepEqual(Array.from(result.connector),['S','M','L']);
 assert.equal(result.platforms.length,50);assert.ok(result.bases>=10);
 for(let size=1;size<=5;size++)assert.equal(result.platforms.filter(p=>p.size===size).length,10);
});
test('real candidate course is physically certified and returns all required ice endpoints',()=>{
 const c=make(),data=vm.runInContext('(()=>{applyRoute(0);return {report:SummitModularEngine.report(),audit:auditPlayableCourse(),graph:compilePhysicalCourseGraph(),modules:spires.map(s=>s.moduleAssembly)}})()',c);
 assert.equal(data.report.certified,true,JSON.stringify(data.report));
 assert.equal(data.audit.valid,true,JSON.stringify(data.audit.failures));
 assert.equal(data.graph.valid,true,JSON.stringify(data.graph.issues));
 assert.ok(data.report.changes.changed>=2);
 assert.equal(data.modules.length,5);
 for(const m of data.modules){
  assert.ok(m.pieces.length>=3&&m.pieces.length<=7);
  for(const piece of m.pieces)assert.ok(piece.connector==='ROOT'||['S','M','L'].includes(piece.connector));
 }
});
test('different modular seeds generate distinct, certified physical platform geometry',()=>{
 const c=make(),a=[];
 for(let seed=11;seed<31;seed++){
  const result=vm.runInContext('(()=>{SummitModularEngine.nextSeed();applyRoute(0);return {report:SummitModularEngine.report(),geometry:JSON.stringify(spires.map(q=>q.ledges.map(l=>[l[0],l[1],l[2]])))}})()',c);
  a.push(result);
 }
 assert.ok(a.every(v=>v.report.certified),JSON.stringify(a.map(v=>v.report)));
 assert.ok(new Set(a.map(v=>v.geometry)).size>=12,'too many visually identical physical layouts');
});
test('Original restores after modular construction without residual modules',()=>{
 const c=make(),a=vm.runInContext("(()=>{activeSummitCourse='original';applyRoute(0);const original=JSON.stringify(spires.map(s=>({summit:s.summit,ledges:s.ledges})));activeSummitCourse='modular';applyRoute(0);activeSummitCourse='original';applyRoute(0);return {same:original===JSON.stringify(spires.map(s=>({summit:s.summit,ledges:s.ledges}))),remnants:spires.filter(s=>s.moduleAssembly).length};})()",c);
 assert.equal(a.same,true);assert.equal(a.remnants,0);
});

test('in-game platform objects agree exactly with modular slots and icefall endpoints',()=>{
 const c=make();
 const r=vm.runInContext("var platforms=spires.map((m,i)=>platform('s'+i,...m.summit,{kind:'summit',spire:i}));function platform(id,l,r,t,s='snow',extra={}){return {id,left:l,right:r,top:t,...extra}}applyRoute(0);SummitModularEngine.auditInstalled()",c);
 assert.equal(r.valid,true,JSON.stringify(r.issues));
});

test('TRUE mesh pieces are polygon solids with exact matching jigsaw seams',()=>{
 const c=make();
 const result=vm.runInContext("(()=>{applyRoute(0);return spires.map((p,i)=>({mesh:p.moduleAssembly.mesh,qa:SummitPeakMesh.audit(p.moduleAssembly.mesh,i,p),physics:auditPlayableCourse().valid}))})()",c);
 assert.equal(result.length,5);
 for(const {mesh,qa,physics} of result){
  assert.equal(mesh.geometrySource,'assembled-polygons');
  assert.equal(qa.valid,true,qa.errors.join(', '));
  assert.equal(physics,true);
  assert.ok(mesh.parts.length>=3&&mesh.parts.length<=7);
  assert.ok(mesh.parts.filter(p=>p.meshRoot).length<=2);
  assert.equal(mesh.seams.length,mesh.parts.length-mesh.roots.length);
  const byId=new Map(mesh.parts.map(p=>[p.id,p]));
  for(const seam of mesh.seams){
   const child=byId.get(seam.child),parent=byId.get(seam.parent);
   assert.ok(child&&parent,'every extension needs a real base');
   assert.equal(JSON.stringify(child.seam),JSON.stringify(seam.vertices),'socket surfaces must be identical');
   for(const vertex of seam.vertices)
    assert.ok(parent.polygon.some(point=>Math.abs(point[0]-vertex[0])<.01&&Math.abs(point[1]-vertex[1])<.01),
      'seam profile must be engraved in parent boundary');
  }
 }
});
test('twenty seeds change mountain polygons, not merely platform labels',()=>{
 const c=make();
 const out=vm.runInContext("var platforms=spires.map((m,i)=>platform('s'+i,...m.summit,{kind:'summit',spire:i}));function platform(id,l,r,t,s='snow',extra={}){return {id,left:l,right:r,top:t,...extra}};(()=>{const all=[];for(let i=0;i<20;i++){applyRoute(0);const report=SummitModularEngine.report();all.push({report,valid:SummitModularEngine.auditInstalled().valid,physics:auditPlayableCourse().valid,graph:compilePhysicalCourseGraph().valid,fingerprints:spires.map(p=>p.moduleAssembly.mesh.fingerprint),roots:spires.map(p=>p.moduleAssembly.mesh.roots.length)});SummitModularEngine.nextSeed();}return all})()",c);
 assert.ok(out.every(q=>q.report.certified&&q.valid&&q.physics&&q.graph),JSON.stringify(out.filter(q=>!q.report.certified||!q.valid||!q.physics||!q.graph).map(q=>q.report)));
 for(let peak=0;peak<5;peak++)
  assert.ok(new Set(out.map(q=>q.fingerprints[peak])).size>=15,
   'each of five peaks must have genuinely different mesh geometry across seeds');
 assert.ok(out.some(q=>q.roots.some(n=>n===2)),'some peaks need 2 foundation pieces');
});
