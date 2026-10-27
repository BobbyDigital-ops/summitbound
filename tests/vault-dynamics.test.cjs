const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=n=>fs.readFileSync('public/game/scripts/'+n,'utf8');
function context(withGame=false) {
 const els=new Map(),document={getElementById(id) {
  if(!els.has(id))els.set(id,{hidden:false,style:{},
    textContent:'',classList:{add(){},remove(){}},
    addEventListener(){},getContext(){return {}}});
  return els.get(id);
 },querySelectorAll(){return []}};
 const c=vm.createContext({Image:class Image{},document,
  performance:{now:()=>1},navigator:{vibrate(){}},innerWidth:1200,
  innerHeight:780,localStorage:{getItem(){return null},setItem(){}}});
 const names=['physics.js','world-data.js','course-engine.js','pole-dynamics.js'];
 if(withGame)names.push('game-state.js','time-trial.js',
  'climb-mechanics.js','simulation.js');
 for(const n of names)vm.runInContext(source(n),c,{filename:n});
 if(!withGame)vm.runInContext('applyRoute(0)',c);
 return {run:s=>vm.runInContext(s,c),els};
}
function flight(run,speed,phase){
 const q=run(`(()=>{
  const x=spires[0].summit[1]-125,y=spires[0].summit[2]-22;
  const state=PolePhysicsEngine.initVault(x,y,${speed},0,x+120,y+22,cfg);
  const ride=PolePhysicsEngine.stepVault(state,state.rideDuration*${phase},cfg);
  const kick=PolePhysicsEngine.calculateReleaseVelocity(ride.nextVx,ride.nextVy,ride.state,cfg);
  let yy=ride.nextPy,xx=ride.nextPx,vy=kick.vy,apex=yy,landingX=null;
  const fd=(1/120)*cfg.arcadeFlightTempo;
  for(let i=0;i<540;i++){
   const old=yy;vy+=cfg.gravity*fd;xx+=kick.vx*fd;yy+=vy*fd;
   apex=Math.min(apex,yy);
   if(vy>=0&&old<=y&&yy>=y){landingX=xx;break;}
  }
  return {origin:x,y,releaseX:ride.nextPx,releaseY:ride.nextPy,
   apex,landingX,velocity:kick,radius:ride.state.radius};
 })()`);
 return {u:phase,speed,range:Math.round(q.landingX-q.origin),
  height:Math.round(q.y-q.apex),releaseX:q.releaseX,
  vx:q.velocity.vx,vy:q.velocity.vy,radius:q.radius};
}
test('Vault dynamics: early, mid, late and overheld releases differ in both range and height',()=>{
 const {run}=context();
 const high=flight(run,450,.25),middle=flight(run,450,.55);
 const late=flight(run,450,.85),over=flight(run,450,1.15);
 assert.ok(high.height>middle.height+130);
 assert.ok(middle.height>late.height+140);
 assert.ok(middle.range>high.range+200,'release duration has no range effect');
 assert.ok(middle.range>late.range+200,'holding pole does not trade distance');
 assert.ok(late.range>over.range*1.6,'holding too long is not costly');
 assert.ok(late.vx>high.vx*1.8,'pole swing has not changed launch direction');
 assert.ok(Math.abs(high.vy)>Math.abs(late.vy)*2,'vault height insensitive to release time');
});
test('Vault dynamics: real momentum increases the complete flight, not merely the HUD',()=>{
 const {run}=context();
 const slow=flight(run,320,.55),fast=flight(run,450,.55);
 assert.ok(fast.range>slow.range+350);
 assert.ok(fast.height>slow.height+100);
 assert.ok(fast.vx>slow.vx*1.45);
 assert.ok(run('cfg.maxAirborneSpeed')>=1000,'airborne clamp flattens new vaults');
});
test('Vault dynamics: shaft remains fixed-length and player hands move continuously',()=>{
 const {run}=context(),frames=run(`(()=>{
  let s=PolePhysicsEngine.initVault(700,1078,450,0,820,1100,cfg);
  const points=[];
  for(let i=0;i<245;i++){
   const step=PolePhysicsEngine.stepVault(s,1/120,cfg);
   s=step.state;
   points.push({x:step.nextPx,y:step.nextPy,
    radius:Math.hypot(step.nextPx+3-s.anchorX,step.nextPy-5-s.anchorY)});
  }
  return points;
 })()`);
 assert.ok(frames.every(p=>p.radius<=195.01),'rendered pole would have to stretch');
 for(let i=1;i<frames.length;i++)
  assert.ok(Math.hypot(frames[i].x-frames[i-1].x,
    frames[i].y-frames[i-1].y)<9,'pole ride teleports between physics steps');
 assert.ok(frames.at(-1).x>frames[0].x+240,'pole does not swing around its plant');
});
test('Vault dynamics: four crossings, both campsite ledges and all ice exits remain viable',()=>{
 const {run}=context();
 const audit=run('auditPlayableCourse()');
 const graph=run('compilePhysicalCourseGraph()');
 assert.equal(audit.valid,true,audit.failures.join('; '));
 assert.equal(graph.valid,true,graph.issues.join('; '));
 assert.ok(graph.reachable.includes('l2-0')&&graph.reachable.includes('l4-0'));
 assert.ok(graph.reachable.includes('s4'));
 assert.equal(run('spires.filter(s=>s.cave).length'),0);
});
test('Vault dynamics: actual gameplay release preserves the high-energy flight',()=>{
 const {run}=context(true);
 const measured=run(`(()=>{
  mode='practice';gameReset();const pl=platforms.find(p=>p.id==='s0');
  p.x=pl.right-125;p.y=pl.top-22;p.vx=450;p.vy=0;
  p.state='RUNNING';p.standingOn=pl.id;p.facingDir=1;
  plant();
  for(let i=0;i<112;i++)tick(1/120);
  const hold=p.vault?.elapsed;
  release();
  const before=p.vx;
  tick(1/120);
  return {hold,before,after:p.vx,state:p.state};
 })()`);
 assert.ok(measured.hold>.8);
 assert.ok(measured.before>350&&measured.before<625,'mid-swing release outside controlled flight envelope');
 assert.ok(measured.after>350&&Math.abs(measured.after-measured.before)<3,'post-release flight does not retain the intended momentum');
 assert.equal(measured.state,'AIRBORNE');
});
test('Vault dynamics: frozen legacy route sampler is unaffected by new playable physics',()=>{
 const {run}=context();
 const samples=run('candidateFlights()');
 assert.ok(samples.length>=150);
 assert.ok(samples.some(q=>q.approachSpeed===450));
 const sha=fs.readFileSync('public/game/scripts/pole-dynamics.js','utf8');
 assert.match(sha,/archivedArcadePhysics===true/);
});
