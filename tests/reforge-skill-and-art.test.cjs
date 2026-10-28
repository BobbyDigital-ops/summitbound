const test=require('node:test'),assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');
const source=n=>fs.readFileSync('public/game/scripts/'+n,'utf8');
function fixture(){
 const nodes=new Map();
 const document={getElementById(id){
  if(!nodes.has(id))nodes.set(id,{hidden:true,style:{},textContent:'',
   classList:{add(){},remove(){},toggle(){}},
   addEventListener(){},getContext(){return {}}});
  return nodes.get(id);
 },querySelectorAll(){return []}};
 const ctx=vm.createContext({document,Image:class Image{},
  navigator:{vibrate(){}},performance:{now:()=>1},
  localStorage:{getItem(){return null},setItem(){}},
  innerWidth:1280,innerHeight:720,devicePixelRatio:1});
 for(const file of ['physics.js','world-data.js','course-engine.js',
    'pole-dynamics.js','game-state.js','time-trial.js','climb-mechanics.js',
    'rescue-catch.js','simulation.js'])
  vm.runInContext(source(file),ctx,{filename:file});
 return {run:s=>vm.runInContext(s,ctx),nodes};
}
test('Reforge creates exactly two distinctive, physically separated summit cruxes',()=>{
 const {run}=fixture(),a=run('auditPlayableCourse()'),
  graph=run('compilePhysicalCourseGraph()');
 assert.equal(a.valid,true,a.failures.join('; '));
 assert.equal(graph.valid,true,graph.issues.join('; '));
 assert.equal(run('spires.length'),5);
 assert.equal(run('FEATURED_COURSE.campaignSize'),100);
 assert.equal(run('spires.filter(s=>!!s.cave).length'),0);
 const ridgeEdges=graph.edges.filter(e=>e.kind==='ridge-vault');
 assert.equal(ridgeEdges.length,2);
 assert.deepEqual(Array.from(ridgeEdges.map(e=>[e.from,e.to])),[['a1','s1'],['a3','s3']]);
 for(const stage of [1,3]){
  const arrival=run('spires['+stage+'].ridgeArrival'),
   ridge=run('spires['+stage+'].summit');
  const profile=run('shelfTimingProfiles([spires['+stage+'].summit],spires['+stage+'].ridgeArrival)[0]');
  assert.ok(ridge[0]-arrival[1]>=300,'ridge fracture lacks real gap');
  assert.ok(arrival[2]-ridge[2]>=100,'second vault does not climb');
  assert.ok(profile.safe>=8&&profile.safe<=24,
   'ridge timing should demand skill without being unreachable');
  assert.ok(graph.reachable.includes('a'+stage)&&graph.reachable.includes('s'+stage));
 }
});
test('Ice routes terminate at tangible arrival rock, never auto-slide to next summit',()=>{
 const {run}=fixture();
 for(const peak of [1,2,3,4]){
  const tierCount=run('spires['+peak+'].ledges.length');
  for(let tier=0;tier<tierCount;tier++){
   run(`{
    const pl=platforms.find(s=>s.id==='l'+${peak}+'-'+${tier});
    p={x:pl.right-30,y:pl.top-22,vx:0,vy:0,standingOn:pl.id,
     surface:pl.surfaceType,groundedFor:.5,state:'GROUNDED',
     facingDir:1,climb:null};
    completed=false;keys.clear();climbStart(pl);
    p.y=p.climb.targetY+.2;keys.add('w');
   }`);
   const expected=run('iceClimbPoints('+peak+','+tier+').at(-1)');
   run('tick(1/120)');
   const current=run('p.standingOn');
   assert.equal(current,[1,3].includes(peak)?'a'+peak:'s'+peak);
   assert.equal(run('p.state'),'GROUNDED');
   assert.ok(Math.abs(run('p.x')-expected.x)<.01);
   assert.ok(Math.abs(run('p.y')-expected.y)<.01);
  }
 }
});
test('Both ridge arrivals support an actual pole plant and skill-vault across',()=>{
 const {run}=fixture();
 for(const stage of [1,3]){
  const profile=run('shelfTimingProfiles([spires['+stage+'].summit],spires['+stage+'].ridgeArrival)[0]');
  assert.ok(profile.hits>profile.safe-1);
  const val=run(`(()=>{
   const pl=platforms.find(s=>s.id==='a${stage}');
   return PolePhysicsEngine.validatePlantPoint(pl.right-180,pl.top-22,1,[pl],cfg);
  })()`);
  assert.equal(val.isValid,true);
  const launched=run(`(()=>{
   const pl=platforms.find(s=>s.id==='a${stage}');
   p={x:pl.right-180,y:pl.top-22,vx:375,vy:0,state:'GROUNDED',
    standingOn:pl.id,facingDir:1,groundedFor:.6,surface:'snow'};
   plant();return [p.state,practiceTakeoff?.platformId];
  })()`);
  assert.deepEqual(Array.from(launched),['RIDING_VAULT','a'+stage]);
 }
});
test('Axe catch is a single edge-accurate attempt, never a magnetic recovery',()=>{
 const {run}=fixture();
 const missed=run(`(()=>{
  const pl=platforms.find(s=>s.id==='l2-0');
  p={x:pl.left-73,y:pl.top+18,vx:330,vy:90,state:'AIRBORNE',
   standingOn:null,facingDir:1};
  catchUsed=false;
  const missed=attemptAxeCatch();
  p.x=pl.left-30;const reused=attemptAxeCatch();
  return {missed,reused,used:catchUsed,state:p.state};
 })()`);
 assert.equal(missed.missed,false);
 assert.equal(missed.reused,false);
 assert.equal(missed.used,true);
 assert.equal(missed.state,'AIRBORNE');
});
test('Precisely timed axe bite demands four alternating strikes and saves a real campsite',()=>{
 const {run}=fixture();
 const out=run(`(()=>{
  mode='practice';lastSafeStage=0;atStage=1;
  const pl=platforms.find(s=>s.id==='l2-0');
  p={x:pl.left-30,y:pl.top+18,vx:310,vy:110,
   state:'AIRBORNE',standingOn:null,facingDir:1};
  catchUsed=false;
  const hit=attemptAxeCatch();
  const start={state:p.state,x:p.x,y:p.y};
  const strokes=[axeCatchStrike(-1),axeCatchStrike(-1),
   axeCatchStrike(1)]; // instantaneous alternating spam should NOT work
  elapsed+=.15;strokes.push(axeCatchStrike(1));
  elapsed+=.15;strokes.push(axeCatchStrike(-1));
  elapsed+=.15;strokes.push(axeCatchStrike(1));
  return {hit,start,strokes,state:p.state,standing:p.standingOn,
    checkpoint:lastSafeStage};
 })()`);
 assert.equal(out.hit,true);
 assert.equal(out.start.state,'HANGING');
 assert.deepEqual(Array.from(out.strokes),[true,false,false,true,true,true]);
 assert.equal(out.state,'GROUNDED');
 assert.equal(out.standing,'l2-0');
 assert.equal(out.checkpoint,2);
});
test('A player who hesitates while hanging drops; catch cannot repeat in same flight',()=>{
 const {run}=fixture();
 const result=run(`(()=>{
  const pl=platforms.find(s=>s.id==='l2-0');
  p={x:pl.left-30,y:pl.top+17,vx:310,vy:110,
    state:'FALLING',standingOn:null,facingDir:1};
  catchUsed=false;attemptAxeCatch();
  elapsed+=3.0;updateHanging(1/120);
  const again=attemptAxeCatch();
  return {state:p.state,again,used:catchUsed};
 })()`);
 assert.equal(result.state,'FALLING');
 assert.equal(result.again,false);
 assert.equal(result.used,true);
});
test('Dark art and renderer are one pipeline, not unrelated bright decoration',()=>{
 const html=fs.readFileSync('public/game/summit-leap-v081.html','utf8'),
  art=source('bleak-art.js'),render=source('rendering.js'),
  alpine=source('alpine-art-v030.js');
 assert.match(alpine,/drawSpire=function alpineSpire/);
 assert.match(alpine,/decorate=function alpineVegetation/);
 assert.match(html,/v0\.30\.0/);
 assert.match(html,/game\/scripts\/alpine-art-v030\.js/);
 assert.match(html,/game\/scripts\/bleak-art\.js/);
 assert.match(html,/game\/scripts\/rescue-catch\.js/);
 assert.match(art,/drawSpire=function bleakSpire/);
 assert.match(art,/drawIceClimb=function bleakIceRoutes/);
 assert.match(art,/const arrive=m\.ridgeArrival/);
 assert.match(render,/fillStyle='#091523c4'/);
 assert.match(art,/drawFeaturedCampsite=function bleakCamp/);
});

test('Actual fixed-step physics can clear both distinct uphill ridge challenges',()=>{
 const {run}=fixture();
 const trajectories=[[1,120,450,90],[3,120,375,114]];
 for(const [peak,offset,speed,frames] of trajectories){
  const outcome=run(`(()=>{
   mode='practice';completed=false;elapsed=0;keys.clear();
   const a=platforms.find(pl=>pl.id==='a${peak}');
   p={x:a.right-${offset},y:a.top-22,vx:${speed},vy:0,
    state:'GROUNDED',standingOn:a.id,surface:'snow',
    groundedFor:.5,climb:null,runDistance:0,facingDir:1};
   plant();
   const planted=p.state==='RIDING_VAULT';
   for(let i=0;i<${frames}&&p.state==='RIDING_VAULT';i++)tick(1/120);
   if(p.state==='RIDING_VAULT')release();
   for(let j=0;j<450;j++){
    if(p.state==='GROUNDED'||p.state==='CLIMBING')break;
    tick(1/120);
   }
   return {planted,state:p.state,standing:p.standingOn,x:p.x};
  })()`);
  assert.equal(outcome.planted,true);
  assert.equal(outcome.standing,'s'+peak);
  assert.equal(outcome.state,'GROUNDED');
 }
});
test('Under-shooting the upper granite ridge collides with the actual painted rock wall',()=>{
 const {run}=fixture();
 const outcome=run(`(()=>{
  mode='practice';completed=false;
  const top=spires[1].summit[2],y=top+105,x=ridgeUpperWallX(1,y)-30;
  p={x,y,vx:450,vy:80,state:'AIRBORNE',facingDir:1,
    standingOn:null,climb:null};
  keys.clear();tick(.1);
  return {vx:p.vx,x:p.x,wall:ridgeUpperWallX(1,p.y),
   state:p.state};
 })()`);
 assert.ok(outcome.vx<0,'wall collision did not repel an undershot vault');
 assert.ok(outcome.x<outcome.wall,'climber passed through solid granite');
 assert.ok(['AIRBORNE','FALLING'].includes(outcome.state));
});
