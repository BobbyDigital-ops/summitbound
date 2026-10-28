const test=require('node:test'),assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');
function make(){
 const document={getElementById(){return null}};
 const ctx=vm.createContext({Image:class Image{},document,performance:{now(){return 0}},navigator:{},innerWidth:1280,innerHeight:800});
 for(const file of ['physics.js','world-data.js','course-engine.js','pole-dynamics.js','modular-course-v040.js']){
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
 for(const seed of [11,12,13,14]){
  const result=vm.runInContext('(()=>{SummitModularEngine.nextSeed();applyRoute(0);return {report:SummitModularEngine.report(),geometry:JSON.stringify(spires.map(q=>q.ledges.map(l=>[l[0],l[1],l[2]])))}})()',c);
  a.push(result);
 }
 assert.ok(a.every(v=>v.report.certified),JSON.stringify(a.map(v=>v.report)));
 assert.ok(new Set(a.map(v=>v.geometry)).size>=3);
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
