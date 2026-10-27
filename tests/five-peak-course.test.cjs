const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const script=n=>fs.readFileSync('public/game/scripts/'+n,'utf8');
function world(){
 const context=vm.createContext({Image:class Image{},document:{getElementById:()=>null},platforms:[]});
 for(const f of ['physics.js','world-data.js','course-engine.js'])
  vm.runInContext(script(f),context,{filename:f});
 return {context,run:s=>vm.runInContext(s,context)};
}
function game(){
 const elements=new Map();
 const document={getElementById(id){if(!elements.has(id))
  elements.set(id,{hidden:false,textContent:'',style:{},
   classList:{add(){},remove(){}},getContext(){return {}},addEventListener(){}});
  return elements.get(id);
 },querySelectorAll(){return []}};
 const context=vm.createContext({Image:class Image{},document,
  performance:{now:()=>1},navigator:{vibrate(){}},innerWidth:1200,innerHeight:760,
  localStorage:{getItem(){return null},setItem(){}}});
 for(const f of ['physics.js','world-data.js','course-engine.js','game-state.js',
   'time-trial.js','climb-mechanics.js','simulation.js'])
  vm.runInContext(script(f),context,{filename:f});
 return {context,elements,run:s=>vm.runInContext(s,context)};
}
test('Five Peaks: exactly one course is playable, with five connected summits',()=>{
 const {run}=world();
 run('applyRoute(0)');
 const original=JSON.stringify(run('spires.map(s=>[s.summit,s.ledges,s.cave||null])'));
 for(const seed of [1,2,7,250,996]){
  run('applyRoute('+seed+')');
  assert.equal(run('routeSeed'),0);
  assert.equal(JSON.stringify(run('spires.map(s=>[s.summit,s.ledges,s.cave||null])')),original,
   'seed '+seed+' should not expose a different unfinished level');
 }
 assert.equal(run('FEATURED_COURSE.peakCount'),5);
 assert.equal(run('FEATURED_COURSE.campaignSize'),100);
 const diag=run('auditPlayableCourse()');
 assert.equal(diag.valid,true,diag.failures.join('\n'));
 const graph=run('compilePhysicalCourseGraph()');
 assert.equal(graph.valid,true,graph.issues.join('\n'));
 assert.ok(graph.reachable.includes('s4'));
 assert.ok(graph.reachable.includes('s2')&&graph.reachable.includes('cave4'));
 assert.ok(graph.edges.filter(e=>e.kind==='vault').length>=10);
});
test('Five Peaks: variable gap and high/low physically stoppable ledge choices',()=>{
 const {run}=world();run('applyRoute(0)');
 const geometry=run(`spires.slice(1).map((s,i)=>({
   gap:(s.cave?s.cave.left:Math.min(...s.ledges.map(t=>t[0])))-spires[i].summit[1],
   surfaces:s.ledges.map(p=>p[1]-p[0])
 }))`);
 assert.equal(geometry.length,4);
 const gaps=geometry.map(x=>x.gap);
 assert.ok(Math.min(...gaps)>=450,'gap is no longer a real chasm');
 assert.ok(Math.max(...gaps)-Math.min(...gaps)>=150,
  'gaps should not all be nearly identical');
 for(let peak=1;peak<=3;peak++){
  const profile=run('shelfTimingProfiles(spires['+peak+'].ledges,spires['+(peak-1)+'].summit)');
  assert.ok(profile.every(q=>q.hits>=2&&q.safe>=2),
   'a high/middle/low option is unreachable on peak '+peak);
 }
});
test('Five Peaks: every ice pixel route has real rock behind it, not floating in sky',()=>{
 const {run}=world();run('applyRoute(0)');
 for(let peak=1;peak<=3;peak++){
  const points=run('iceRouteNetwork('+peak+')');
  for(const route of points){
   for(let k=0;k<=30;k++){
    const y=route.points.at(-1).y+(route.points[0].y-route.points.at(-1).y)*k/30;
    const x=run('iceXOnPath('+JSON.stringify(route.points)+','+y+')');
    const boundary=run('mountainContourX('+peak+','+y+')');
    const outer=run('mountainFlankX('+peak+','+y+')');
    assert.ok(x-boundary>=26&&outer-x>=25,
     'ice face unsupported: peak '+peak+' route '+route.tier+' y '+y+
     ' rock left '+(x-boundary)+' right '+(outer-x));
   }
  }
 }
});
test('Five Peaks: only actual campsite and cave are checkpoints',()=>{
 const {run}=game();
 run('applyRoute(0)');
 for(let peak of [1,3]){
  run('lastSafeStage=0;atStage='+ (peak-1) + ';completed=false');
  run('getLanding(platforms.find(p=>p.id==="s'+peak+'"))');
  assert.equal(run('lastSafeStage'),0,'ordinary summit '+peak+' improperly grants checkpoint');
 }
 run('lastSafeStage=0;atStage=1;completed=false');
 run('getLanding(platforms.find(p=>p.id==="s2"))');
 assert.equal(run('lastSafeStage'),2);
 run('p.y=3000;tick(1/120)');
 assert.equal(run('p.standingOn'),'s2','fall did not return to camp');
 assert.equal(run('atStage'),2);
 run('getLanding(platforms.find(p=>p.id==="cave4"))');
 assert.equal(run('lastSafeStage'),4);
 assert.equal(run('caveActivated'),true);
});
test('Five Peaks: no scripted summit sliding, and ladder is an actual tunnel to peak five',()=>{
 const {run}=game();
 run('applyRoute(0)');
 for(let peak=1;peak<=3;peak++){
  const count=run('spires['+peak+'].ledges.length');
  for(let tier=0;tier<count;tier++){
   run(`{
    const platform=platforms.find(pl=>pl.id==='l'+${peak}+'-'+${tier});
    p={x:platform.right-30,y:platform.top-22,vx:0,vy:0,
     state:'GROUNDED',surface:platform.surfaceType,standingOn:platform.id,
     groundedFor:.4,climb:null,facingDir:1};keys.clear();
    climbStart(platform);
    p.y=p.climb.targetY+.3;keys.add('w');
   }`);
   run('tick(1/120)');
   assert.equal(run('p.state'),'GROUNDED');
   assert.equal(run('p.standingOn'),'s'+peak);
   const expected=run('iceClimbPoints('+peak+','+tier+').at(-1).x');
   assert.ok(Math.abs(run('p.x')-expected)<.001,'invisible sideways ice transfer');
  }
 }
 run(`{
  const pl=platforms.find(pl=>pl.id==='cave4'),x=caveGeometry().ladderX;
  p={x,y:pl.top-22,vx:0,vy:0,state:'GROUNDED',surface:pl.surfaceType,
   standingOn:pl.id,groundedFor:.5,climb:null,facingDir:1};
  completed=false;caveActivated=true;keys.clear();keys.add('w');
 }`);
 run('tick(1/120)');
 assert.equal(run('p.state'),'CLIMBING');
 const ladderX=run('caveGeometry().ladderX');
 run('for(let i=0;i<700&&!completed;i++)tick(1/120)');
 assert.equal(run('p.standingOn'),'s4');
 assert.equal(run('p.state'),'GROUNDED');
 assert.equal(run('p.x'),ladderX);
 assert.equal(run('completed'),true);
 const art=script('rendering.js');
 assert.match(art,/const startY=c\.floor-7, endY=spires\[4\]\.summit\[2\]\+10/);
 assert.match(art,/function drawFeaturedCampsite\(/);
 assert.doesNotMatch(script('simulation.js'),/p\.state === 'STEP_OFF'/);
});
test('Five Peaks: no unfinished route switch or stage skip controls in the UI',()=>{
 const html=fs.readFileSync('public/game/summit-leap-v081.html','utf8');
 assert.doesNotMatch(html,/id="shuffle"/);
 assert.doesNotMatch(html,/data-skip="/);
 assert.match(html,/game\/scripts\/course-engine\.js/);
 assert.match(html,/FIVE PEAKS/);
});
