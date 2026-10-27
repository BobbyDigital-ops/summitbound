const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const code=n=>fs.readFileSync('public/game/scripts/'+n,'utf8');
function setup(){
 const elements=new Map(),document={
  getElementById(id){if(!elements.has(id))elements.set(id,{
   textContent:'',hidden:false,style:{},classList:{add(){},remove(){}},
   addEventListener(){},getContext(){return {}}
  });return elements.get(id);},
  querySelectorAll(){return []}
 };
 const context=vm.createContext({Image:class Image{},document,
  innerWidth:1280,innerHeight:720,performance:{now:()=>1},
  navigator:{vibrate(){}},localStorage:{getItem(){return null},setItem(){}}});
 for(const n of ['physics.js','world-data.js','course-engine.js',
  'game-state.js','time-trial.js','climb-mechanics.js','simulation.js']){
  vm.runInContext(code(n),context,{filename:n});
 }
 return {context,run:s=>vm.runInContext(s,context)};
}
test('Peak retry: Practice returns to real launch summit without granting false checkpoint',()=>{
 const {run}=setup();
 const result=run(`(()=>{
  mode='practice';gameReset();lastSafeStage=0;atStage=1;
  const pl=platforms.find(q=>q.id==='s1');
  p={x:pl.left+200,y:pl.top-22,vx:425,vy:0,
   state:'RUNNING',surface:'snow',standingOn:pl.id,
   groundedFor:.5,facingDir:1};
  plant();
  const saved=practiceTakeoff?.platformId;
  fail();
  return {saved,stage:atStage,surface:p.standingOn,
   velocity:p.vx,safe:lastSafeStage,x:p.x,left:pl.left};
 })()`);
 assert.equal(result.saved,'s1');
 assert.equal(result.stage,1);
 assert.equal(result.surface,'s1');
 assert.equal(result.velocity,0);
 assert.equal(result.safe,0,'practice mode granted a fake checkpoint');
 assert.ok(result.x>result.left+80,'runner was spawned with no available runway');
});
test('Peak retry: narrow campsite launch returns to same real ledge',()=>{
 const {run}=setup();
 const result=run(`(()=>{
  mode='practice';gameReset();
  const pl=platforms.find(q=>q.id==='l2-0');
  p={x:pl.left+12,y:pl.top-22,vx:280,vy:0,
    state:'GROUNDED',surface:'snow',standingOn:pl.id,
    groundedFor:.4,facingDir:1};
  getLanding(pl);
  plant();
  const was=practiceTakeoff?.platformId;
  retry();
  return {was,stage:atStage,safe:lastSafeStage,
   surface:p.standingOn,x:p.x,left:pl.left,right:pl.right};
 })()`);
 assert.equal(result.was,'l2-0');
 assert.equal(result.stage,2);
 assert.equal(result.safe,2);
 assert.equal(result.surface,'l2-0');
 assert.ok(result.x>result.left&&result.x+120<=result.right,
   'shelf retry begins too close to the edge for a real pole plant');
});
test('Peak retry: a newly reached campsite takes precedence over previous takeoff',()=>{
 const {run}=setup();
 const result=run(`(()=>{
  mode='practice';gameReset();
  const src=platforms.find(q=>q.id==='s1');
  p={x:src.left+150,y:src.top-22,vx:400,vy:0,
   state:'RUNNING',surface:'snow',standingOn:'s1',facingDir:1};
  plant();
  const camp=platforms.find(q=>q.id==='l2-0');
  getLanding(camp);fail();
  return {stage:atStage,safe:lastSafeStage,surface:p.standingOn};
 })()`);
 assert.equal(result.stage,2);
 assert.equal(result.safe,2);
 assert.equal(result.surface,'l2-0');
});
test('Peak retry: Time Trial and Hardcore never retain a Practice retry anchor',()=>{
 const {run}=setup();
 const results=run(`(()=>{
  const result=[];
  for(const next of ['trial','hardcore']){
   mode=next;gameReset();
   const pl=platforms.find(q=>q.id==='s1');
   p={x:pl.left+150,y:pl.top-22,vx:400,vy:0,
    state:'RUNNING',standingOn:pl.id,surface:'snow',facingDir:1};
   plant();fail();
   result.push({mode:next,stage:atStage,surface:p.standingOn,
      remembered:practiceTakeoff});
  }
  return result;
 })()`);
 assert.ok(results.every(x=>x.stage===0&&x.surface==='s0'&&x.remembered===null));
});
test('Longer vault: actual run-up unlocks materially more range but slower run-ups remain weaker',()=>{
 const {run}=setup();
 const data=run(`(()=>{
  const calculate=speed=>{
   const p=PolePhysicsEngine.initVault(300,980,speed,0,420,1002,cfg);
   p.elapsed=p.rideDuration*.68;
   return PolePhysicsEngine.calculateReleaseVelocity(0,0,p,cfg);
  };
  return {max:cfg.maxRunSpeed,accel:cfg.runAcceleration,
   slow:calculate(300),medium:calculate(360),full:calculate(450)};
 })()`);
 assert.equal(data.max,450);
 assert.equal(data.accel,1050);
 assert.ok(data.full.vx>570,'full sprint no longer extends jump range');
 assert.ok(data.full.vx>data.medium.vx*1.3,'extra momentum has insufficient effect');
 assert.ok(data.full.vx>data.slow.vx*1.6);
 assert.ok(Math.abs(data.full.vy)>Math.abs(data.medium.vy)*1.2);
});
test('Five Peaks remains physics-reachable after sprint change; shortcut needs real launch runway',()=>{
 const {run}=setup();
 const audit=run('auditPlayableCourse()'),graph=run('compilePhysicalCourseGraph()');
 assert.equal(audit.valid,true,audit.failures.join('; '));
 assert.equal(graph.valid,true,graph.issues.join('; '));
 assert.equal(graph.shortcutCount,0,
  'short ledge falsely certified as full-speed, no-runway shortcut');
 assert.deepEqual(Array.from(run('candidateFlights().map(p=>p.approachSpeed).filter((x,i,a)=>a.indexOf(x)===i)')),
  [300,375,450]);
});

test('Manual Retry Peak uses the current summit before another vault',()=>{
 const {run}=setup();
 const r=run(`(()=>{
  mode='practice';gameReset();
  const old=platforms.find(x=>x.id==='s0');
  p={x:old.left+200,y:old.top-22,vx:420,vy:0,state:'RUNNING',
   surface:'snow',standingOn:'s0',groundedFor:.6,facingDir:1};
  plant();
  const current=platforms.find(x=>x.id==='s1');
  p={x:current.left+200,y:current.top-22,vx:0,vy:0,
   state:'GROUNDED',surface:'snow',standingOn:current.id,
   groundedFor:.6,facingDir:1};
  atStage=1;retry();
  return {stage:atStage,standing:p.standingOn,remembered:practiceTakeoff.platformId,
   safe:lastSafeStage};
 })()`);
 assert.equal(r.stage,1);
 assert.equal(r.standing,'s1');
 assert.equal(r.remembered,'s1');
 assert.equal(r.safe,0);
});
