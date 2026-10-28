const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('five peak reprofile retains certified reachability and varied widths',()=>{
 const document={getElementById(){return {hidden:false,style:{},classList:{add(){},remove(){}},textContent:'',getContext(){return {}},addEventListener(){}}},querySelectorAll(){return []}};
 const ctx=vm.createContext({Image:class Image{},document,innerWidth:1200,innerHeight:780,performance:{now:()=>1},navigator:{vibrate(){}},localStorage:{getItem(){return null},setItem(){}}});
 for(const f of ['physics.js','world-data.js','course-engine.js','pole-dynamics.js','level-engine-v1.js']){try{vm.runInContext(fs.readFileSync('public/game/scripts/'+f,'utf8'),ctx,{filename:f});}catch(error){throw Error('Script '+f+': '+error.stack)}}
 const result=vm.runInContext(`(()=>{applyRoute(0);return {
   audit:auditPlayableCourse(),graph:compilePhysicalCourseGraph(),
   ledges:spires.map(p=>p.ledges.map(l=>l[1]-l[0])),
   ridges:spires.filter(s=>s.ridgeCrux).map(s=>s.summit[1]-s.summit[0])
  }})()`,ctx);
 assert.ok(result.audit.valid,result.audit.failures.join('; '));
 assert.ok(result.graph.valid,result.graph.issues.join('; '));
 const widthSet=new Set(result.ledges.flat().concat(result.ridges));
 assert.ok(widthSet.size>=6,'platform widths lost variation');
 assert.ok(result.ledges[4][0]>result.ledges[2][0],'later campsite needs a broader rescue surface');
 console.log(JSON.stringify({ledges:result.ledges,ridges:result.ridges}));
});
