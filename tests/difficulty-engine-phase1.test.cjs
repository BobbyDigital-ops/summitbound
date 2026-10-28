const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function harness(){
 const document={getElementById(){return {hidden:false,style:{},classList:{add(){},remove(){}},textContent:'',getContext(){return {}},addEventListener(){}}},querySelectorAll(){return []}};
 const c=vm.createContext({Image:class Image{},document,innerWidth:1200,innerHeight:780,performance:{now:()=>1},navigator:{vibrate(){}},localStorage:{getItem(){return null},setItem(){}}});
 for(const p of ['physics.js','world-data.js','course-engine.js','pole-dynamics.js','level-engine-v1.js','showcase-validator-v1.js','difficulty-engine-v1.js'])
 vm.runInContext(fs.readFileSync('public/game/scripts/'+p,'utf8'),c,{filename:p});
 return code=>vm.runInContext(code,c);
}
test('starting lower rescue shelf is not falsely required to have a summit ice exit',()=>{
 const run=harness();const result=run("(()=>{applyRoute(0);return {graph:compilePhysicalCourseGraph(),audit:auditPlayableCourse()}})()");
 assert.ok(result.graph.valid,result.graph.issues.join('; '));
 assert.ok(result.audit.valid,result.audit.failures.join('; '));
});
test('difficulty engine scores all five real sections, including two ridge vaults',()=>{
 const run=harness();const report=run("(()=>{applyRoute(0);return SummitDifficulty.gradeCourse(spires,shelfTimingProfiles)})()");
 console.log('BASELINE_GRADES '+JSON.stringify(report));
 assert.ok(report.valid);
 assert.equal(report.sections.length,5);
 assert.ok(report.sections.every(s=>s.safe>=2&&s.score>=0&&s.score<=100));
 assert.equal(new Set(report.sections.map(s=>s.motif)).size,5);
});
test('survey physically reachable challenge variants without altering saved baseline',()=>{
 const run=harness();
 const results=run(`(()=>{applyRoute(0);const base=SummitDifficulty.gradeCourse(spires,shelfTimingProfiles);
  const changes=[
   {key:'black-notch',peak:1,ridge:true,part:'width',values:[-20,-40,-60,-80,-100,-120]},
   {key:'windward',peak:2,tier:0,part:'width',values:[-8,-16,-24,-32,-40,-48]},
   {key:'broken-crown',peak:3,ridge:true,part:'width',values:[-20,-40,-60,-80,-100,-120]},
   {key:'firespine',peak:4,tier:0,part:'width',values:[-8,-16,-24,-32,-40,-48]},
   {key:'opening',peak:1,tier:1,part:'position',values:[-30,-20,-10,10,20,30]}
  ];
  const out=[];for(const item of changes){
   const l=item.ridge?spires[item.peak].summit:spires[item.peak].ledges[item.tier],x=l[0],right=l[1];
   for(const amount of item.values){
    if(item.part==='position'){l[0]=x+amount;l[1]=right+amount}
    else l[1]=right+amount;
    const grade=SummitDifficulty.gradeCourse(spires,shelfTimingProfiles);
    const cert=auditPlayableCourse(),graph=compilePhysicalCourseGraph();
    out.push({key:item.key,amount,score:grade.sections.find(s=>s.id===item.key)?.score,
     safe:grade.sections.find(s=>s.id===item.key)?.safe,
     routeOK:cert.valid&&graph.valid,
     firstIssue:cert.failures[0]||graph.issues[0]||''});
    l[0]=x;l[1]=right;
   }
  }
  return {base:base.sections.map(x=>({id:x.id,score:x.score,safe:x.safe,width:x.width})),candidates:out};
 })()`);
 console.log('CHALLENGE_SURVEY '+JSON.stringify(results));
 assert.equal(results.base.length,5);
});
