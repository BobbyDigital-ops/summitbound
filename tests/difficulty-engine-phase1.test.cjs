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

test('alternate course is tougher but all five physical stages remain certified',()=>{
 const run=harness();
 const report=run(`(()=>{applyRoute(0);
  const original=SummitDifficulty.gradeCourse(spires,shelfTimingProfiles);
  const originalGeometry=JSON.stringify(spires.map(p=>({summit:p.summit,ledges:p.ledges,ridgeArrival:p.ridgeArrival})));
  activeSummitCourse='challenge';applyRoute(0);
  const challenge=SummitDifficulty.gradeCourse(spires,shelfTimingProfiles);
  const audit=auditPlayableCourse(),graph=compilePhysicalCourseGraph();
  const check=SummitDifficulty.compare(original,challenge);
  const changedGeometry=JSON.stringify(spires.map(p=>({summit:p.summit,ledges:p.ledges,ridgeArrival:p.ridgeArrival})));
  activeSummitCourse='original';applyRoute(0);
  const restored=JSON.stringify(spires.map(p=>({summit:p.summit,ledges:p.ledges,ridgeArrival:p.ridgeArrival})));
  return {original,challenge,audit,graph,check,changed:changedGeometry!==originalGeometry,restored:restored===originalGeometry};
 })()`);
 const iceDetail=run(`(()=>{activeSummitCourse='challenge';applyRoute(0);
 const path=iceRouteNetwork(4)[0].points,sp=spires[4],out=[];
 for(let t=14;t<=16;t++){const y=path.at(-1).y+(path[0].y-path.at(-1).y)*t/16;
 const xx=iceXOnPath(path,y),rock=mountainContourX(4,y),flank=mountainFlankX(4,y);
 out.push({t,y,xx,rock,flank,clearLeft:xx-rock,clearRight:flank-xx});}
 return {summit:sp.summit,ledge:sp.ledges[0],path,detail:out};
})()`);
 console.log('FINAL_ICE_DIAGNOSTIC '+JSON.stringify(iceDetail));
 console.log('CHALLENGE_GRADES '+JSON.stringify({original:report.original.sections,challenge:report.challenge.sections,
  compare:report.check,failures:report.audit.failures,graphIssues:report.graph.issues,restored:report.restored}));
 assert.equal(report.changed,true,'challenge did not alter collision terrain');
 assert.equal(report.restored,true,'original five peaks not restored exactly');
 assert.ok(report.audit.valid,report.audit.failures.join('; '));
 assert.ok(report.graph.valid,report.graph.issues.join('; '));
 assert.ok(report.challenge.valid);
 assert.ok(report.check.harder>=3,'not enough sections grew harder');
 assert.ok(report.challenge.sections.at(-1).score>report.challenge.sections[0].score+20,
  'final crossing not materially tougher than opening');
});

test('survey reachable ridge gaps, rises, widths and final chasm geometry',()=>{
 const run=harness();
 const q=run(`(()=>{activeSummitCourse='original';applyRoute(0);const output={};
  for(const peak of [1,3]){
   const sp=spires[peak],arrival=sp.ridgeArrival,orig=sp.summit.slice(),opts=[];
   for(const gap of (peak===1?[320,340,360,380,400,420]:[380,400,420,440,460]))
    for(const rise of [120,130,140,150,160,170])
     for(const width of [150,170,190,210,230,250]){
      sp.summit=[arrival[1]+gap,arrival[1]+gap+width,arrival[2]-rise,orig[3]];
      const p=shelfTimingProfiles([sp.summit],arrival)[0];
      if(p.safe>=5){const x=SummitDifficulty.describe(spires,SummitDifficulty.SECTIONS.find(q=>q.to===peak&&q.ridge),shelfTimingProfiles);
       opts.push({gap,rise,width,safe:p.safe,score:x.score,windows:p.releaseWindows});
      }
     }
   sp.summit=orig;
   output[peak]=opts.sort((a,b)=>b.score-a.score||b.safe-a.safe).slice(0,22);
  }
  const previous=spires[3].summit,camp=spires[4].ledges[0],orig=camp.slice(),final=[];
  for(const dx of [0,20,40,60,80,100,120,140])
   for(const dy of [-40,-20,0,20,40])
    for(const width of [125,145,165,185,205]){
     camp[0]=orig[0]+dx;camp[1]=camp[0]+width;camp[2]=orig[2]+dy;
     const profile=shelfTimingProfiles(spires[4].ledges,previous)[0];
     if(profile.safe>=2){const x=SummitDifficulty.describe(spires,SummitDifficulty.SECTIONS.at(-1),shelfTimingProfiles);
      final.push({dx,dy,width,safe:profile.safe,score:x.score,windows:x.releaseWindows});
     }
    }
  camp.splice(0,camp.length,...orig);
  output.final=final.sort((a,b)=>b.score-a.score||b.safe-a.safe).slice(0,22);
  return output;
 })()`);
 console.log('PHASE1_CANDIDATES '+JSON.stringify(q));
 assert.ok(q[1].length&&q[3].length&&q.final.length);
});
