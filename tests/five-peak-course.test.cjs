const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const script=n=>fs.readFileSync('public/game/scripts/'+n,'utf8');
function harness(includeGame=false){
 const elements=new Map();
 const document={getElementById(id){
  if(!elements.has(id))elements.set(id,{hidden:true,style:{},
   textContent:'',classList:{add(){},remove(){}},
   getContext(){return {}},addEventListener(){}});
  return elements.get(id);
 },querySelectorAll(){return []}};
 const context=vm.createContext({Image:class Image{},document,
  innerWidth:1200,innerHeight:760,performance:{now:()=>1},
  navigator:{vibrate(){}},
  localStorage:{getItem(){return null},setItem(){}}});
 const sources=['physics.js','world-data.js','course-engine.js','pole-dynamics.js'];
 if(includeGame)sources.push('game-state.js','time-trial.js','climb-mechanics.js','simulation.js');
 for(const file of sources)vm.runInContext(script(file),context,{filename:file});
 if(!includeGame)vm.runInContext('applyRoute(0)',context);
 return {run:s=>vm.runInContext(s,context),elements};
}
test('Only one five-peak course is playable; two checkpoint mountains each have one real ledge',()=>{
 const {run}=harness();
 const before=JSON.stringify(run('spires.map(s=>[s.summit,s.ledges,s.cave])'));
 for(const seed of [1,2,7,250,996]){
  run('applyRoute('+seed+')');
  assert.equal(run('routeSeed'),0);
  assert.equal(JSON.stringify(run('spires.map(s=>[s.summit,s.ledges,s.cave])')),before);
 }
 assert.equal(run('spires.length'),5);
 assert.equal(run('FEATURED_COURSE.campaignSize'),100);
 assert.equal(run('spires[2].ledges.length'),1);
 assert.equal(run('spires[4].ledges.length'),1);
 assert.equal(run('spires.filter(s=>s.cave).length'),0);
 const audit=run('auditPlayableCourse()');
 assert.equal(audit.valid,true,audit.failures.join('; '));
 const graph=run('compilePhysicalCourseGraph()');
 assert.equal(graph.valid,true,graph.issues.join('; '));
 for(const id of ['l2-0','l4-0','s4'])
  assert.ok(graph.reachable.includes(id),'unreachable campsite or final summit: '+id);
 assert.ok(graph.edges.filter(e=>e.kind==='ice').length===8);
});
test('Mountain bedrock widens around EVERY actual ledge while playable chasms remain large',()=>{
 const {run}=harness();
 const gaps=run('spires.slice(1).map((m,i)=>Math.min(...m.ledges.map(l=>l[0]))-spires[i].summit[1])');
 assert.ok(Math.min(...gaps)>=450);
 assert.ok(Math.max(...gaps)-Math.min(...gaps)>=150);
 for(let peak=1;peak<=4;peak++){
  const s=run('spires['+peak+']');
  assert.ok(s.rockShoulderLeft<=Math.min(...s.ledges.map(l=>l[0]))-65,
   'bedrock shoulder does not support exposed ledges '+peak);
  for(const ledge of s.ledges){
   const rock=run('mountainContourX('+peak+','+(ledge[2]+3)+')');
   assert.ok(rock>=ledge[0]+12&&rock<=ledge[1]-12,
    'ledge has no real rock supporting its landing lip '+peak);
  }
  const p=run('shelfTimingProfiles(spires['+peak+'].ledges,spires['+(peak-1)+'].summit)');
  assert.ok(p.every(q=>q.hits>=2&&q.safe>=2),'inaccessible landing '+peak);
 }
});
test('Every ice climb on all four receiving mountains is physically rock-backed',()=>{
 const {run}=harness();
 for(let peak=1;peak<=4;peak++){
  const routes=run('iceRouteNetwork('+peak+')');
  for(const route of routes){
   for(let k=0;k<=40;k++){
    const y=route.points.at(-1).y+(route.points[0].y-route.points.at(-1).y)*k/40;
    const x=run('iceXOnPath('+JSON.stringify(route.points)+','+y+')');
    const left=run('mountainContourX('+peak+','+y+')');
    const right=run('mountainFlankX('+peak+','+y+')');
    assert.ok(x-left>=26&&right-x>=25,
     'ice floating outside rock peak '+peak+' tier '+route.tier+' at '+y);
   }
  }
 }
});
test('Campsite landings activate checkpoint immediately, other summits do not',()=>{
 const {run}=harness(true);
 run('lastSafeStage=0;atStage=0;completed=false');
 run('getLanding(platforms.find(pl=>pl.id==="s1"))');
 assert.equal(run('lastSafeStage'),0);
 run('getLanding(platforms.find(pl=>pl.id==="l2-0"))');
 assert.equal(run('lastSafeStage'),2);
 run('p.y=4000;tick(1/120)');
 assert.equal(run('p.standingOn'),'l2-0');
 assert.equal(run('lastSafeStage'),2);
 run('getLanding(platforms.find(pl=>pl.id==="l4-0"))');
 assert.equal(run('lastSafeStage'),4);
 run('p.y=4500;tick(1/120)');
 assert.equal(run('p.standingOn'),'l4-0');
 assert.equal(run('lastSafeStage'),4);
});
test('Ice exits land on real upper or lower summit terrain without sideways sliding',()=>{
 const {run}=harness(true);
 for(let peak=1;peak<=4;peak++){
  const count=run('spires['+peak+'].ledges.length');
  for(let tier=0;tier<count;tier++){
   run(`{
    const pl=platforms.find(pl=>pl.id==='l'+${peak}+'-'+${tier});
    p={x:pl.right-30,y:pl.top-22,vx:0,vy:0,state:'GROUNDED',
     surface:pl.surfaceType,standingOn:pl.id,groundedFor:.5,
     climb:null,facingDir:1};
    completed=false;keys.clear();climbStart(pl);
    p.y=p.climb.targetY+.2;keys.add('w');
   }`);
   const expected=run('iceClimbPoints('+peak+','+tier+').at(-1).x');
   const summitY=run('iceClimbPoints('+peak+','+tier+').at(-1).y');
   const nearTop=run('icePositionAt('+peak+','+(summitY+20)+','+tier+').x');
   assert.ok(Math.abs(expected-nearTop)<.01,
    'remaining sideways motion in last 20 units of ascent '+peak+'/'+tier);
   run('tick(1/120)');
   assert.equal(run('p.state'),'GROUNDED');
   assert.equal(run('p.standingOn'),run('spires['+peak+'].ridgeArrival')?'a'+peak:'s'+peak);
   assert.ok(Math.abs(run('p.x')-expected)<.01,'automatic sideways summit shift');
   assert.equal(run('p.climb'),null);
  }
 }
 assert.equal(run('completed'),true);
 assert.doesNotMatch(script('simulation.js'),/p\.state === 'STEP_OFF'/);
});
test('Ledge movement is grippy and ice-entry is deliberately controllable',()=>{
 const {run}=harness(true);
 const point=run('platforms.find(pl=>pl.id==="l1-1")');
 run(`{
  const pl=platforms.find(pl=>pl.id==='l1-1');
  p={x:pl.left+50,y:pl.top-22,vx:190,vy:0,state:'RUNNING',
   surface:'snow',standingOn:pl.id,groundedFor:.6,climb:null,facingDir:1};
  keys.clear();
  for(let i=0;i<32;i++)tick(1/120);
 }`);
 assert.ok(run('p.x')<point.left+68,'uncontrolled drift on stationary ledge');
 run(`{
  const pl=platforms.find(pl=>pl.id==='l1-1'),rungX=climbEntryX(pl);
  p={x:rungX-30,y:pl.top-22,vx:145,vy:0,state:'RUNNING',
   surface:'snow',standingOn:pl.id,groundedFor:.6,climb:null,facingDir:1};
  completed=false;keys.clear();keys.add('w');tick(1/120);
 }`);
 assert.equal(run('p.state'),'CLIMBING','held climb input does not engage nearby ice');
});
test('All five peaks share the same rock material and both checkpoints display campsites',()=>{
 const art=script('rendering.js');
 assert.match(art,/Every peak, including the starting Wolvesgate cliff/);
 assert.match(art,/for\(let band=0;band<29;band\+\+\)/);
 assert.match(art,/for\(const peak of \[2,4\]\)/);
 assert.match(art,/drawIceClimb\(i,off\);drawIceShelfJoins\(i,off\);drawIceCrestSnow\(i,off\)/);
 const html=fs.readFileSync('public/game/summit-leap-v081.html','utf8');
 assert.doesNotMatch(html,/id="shuffle"|data-skip=|id="campfireActions"/);
 assert.match(html,/v0\.20\.0/);
 const bleak=script('bleak-art.js');
 assert.match(bleak,/drawSpire=function bleakSpire/);
 assert.match(bleak,/Black void between the broken crowns/);
});
