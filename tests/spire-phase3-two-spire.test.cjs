const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const dir='public/game/scripts/';
function load(n,req=()=>{throw Error('Unexpected import')}){
 const ctx=vm.createContext({module:{exports:{}},require:req});
 vm.runInContext(fs.readFileSync(dir+n,'utf8'),ctx,{filename:n});
 return ctx.module.exports;
}
const K=load('spire-kit-v10.js'),A=load('spire-assembly-v10.js',()=>K),
 C=load('spire-course-v11.js'),P=load('spire-phase2-playtest.js'),
 M=load('spire-phase3-two-spire.js'),F=load('spire-foundations-v12.js');
const ctx=vm.createContext({});vm.runInContext(fs.readFileSync(dir+'physics.js','utf8'),ctx);
vm.runInContext(fs.readFileSync(dir+'climb-mechanics.js','utf8'),ctx);
const physics=vm.runInContext('PolePhysicsEngine',ctx),iceStep=vm.runInContext('iceClimbDisplacement',ctx);
const args={course:C,assemble:A.assemble,physics,iceStep,config:P.CONFIG};
function play(seed,preset){const m=new M.TwoSpirePlaytest(args);m.load(seed,preset);return m}
test('3A: 30 physically simulated, no-assist player crossings match genuine generated destination colliders',()=>{
 for(const preset of [1,3,5,7,10])for(const seed of [42,101,257,399,497,999]){
  const m=play(seed,preset),f=m.course.crossings[0].flight,from=m.course.peaks[0],
   destination=m.course.crossings[0].targetPlatform,deck=m.surface('0:departure'),
   launchX=from.worldX+f.launchX,dist=f.speed*f.speed/(2*m.cfg.runAcceleration);
  const startX=launchX-dist-2;
  assert.ok(startX>=deck.left+4,'not enough valid run-up space');
  m.player.x=startX;m.player.y=deck.top-22;
  m.action('right',true);
  let frame=0;
  while(m.player.x<launchX&&frame++<350&&m.player.state!=='AIRBORNE')m.tick(1/120);
  m.action('right',false);
  assert.ok(frame<350&&m.player.state!=='AIRBORNE','runoff before pole planted '+seed+'/'+preset);
  assert.ok(m.player.vx>180);
  assert.equal(m.action('vault',true),true,'pole did not plant '+seed+'/'+preset);
  const rideFrames=Math.floor(physics.DEFAULT_RIDE_SECONDS*f.releaseFraction*120);
  for(let i=0;i<rideFrames;i++)m.tick(1/120);
  assert.equal(m.action('vault',false),true);
  let landed=false;
  for(let i=0;i<760;i++){
   m.tick(1/120);
   if(m.lastLanding){landed=true;break}
  }
  assert.ok(landed,'player never landed '+seed+'/'+preset);
  assert.equal(m.lastLanding,'1:'+destination,
   'real-player landing missed the approved sampled collider '+seed+'/'+preset);
  assert.ok(m.player.y===m.surface(m.lastLanding).top-22,'landing snapped to wrong vertical height');
  assert.equal(m.vaults,1);
  assert.ok(Math.abs((m.course.peaks[1].worldX+m.course.peaks[1].bounds.left)-
   (m.course.peaks[0].worldX+m.course.peaks[0].bounds.right)-m.course.gap)<1e-7);
 }
});
test('3A: landing without a genuine top-surface intersection is forbidden (no magnetism)',()=>{
 const m=play(42,1),target=m.surface('1:'+m.course.crossings[0].targetPlatform);
 const feet=target.top-4;
 m.player={x:target.right+50,y:feet-22,vx:0,vy:90,
  state:'AIRBORNE',surface:null,face:1,climb:null,vault:null};
 m.tick(1/30);
 assert.equal(m.lastLanding,null);
 assert.equal(m.player.state,'AIRBORNE');
});
test('3A: from second spire a real ladder/ice route leads to its orange departure platform',()=>{
 const m=play(42,1),target='1:'+m.course.crossings[0].targetPlatform;
 const surface=m.surface(target),route=m.routes.find(r=>r.source===target);
 assert.ok(route,'landing has no generated route');
 m.player.x=route.x;m.player.y=surface.top-22;m.player.surface=target;
 m.action('up',true);m.tick(1/120);assert.equal(m.player.state,'CLIMBING');
 for(let i=0;i<5000&&m.player.state==='CLIMBING';i++)m.tick(1/120);
 assert.equal(m.player.state,'GROUNDED');
 assert.equal(m.player.surface,route.target);
});
test('3B: fresh modular foundation blocks join exactly, reach a shared ground datum and never widen active spire gaps',()=>{
 for(const preset of [1,5,10])for(const seed of [1,42,101,257,999]){
  const course=C.build(seed,{count:2,preset},{assemble:A.assemble,physics,config:P.CONFIG});
  const before=JSON.stringify(course.peaks.map(p=>({worldX:p.worldX,bounds:p.bounds,
   departure:p.departure,platforms:p.platforms,routes:p.routes})));
  const base=F.build(course),report=F.inspect(course,base);
  assert.equal(report.valid,true,'foundation invalid '+seed+'/'+preset+': '+report.errors.join('; '));
  assert.ok(report.count>=2);
  assert.equal(base.collision,'background-only');
  assert.ok(base.foundations.every(f=>f.floor===base.floor));
  const after=JSON.stringify(course.peaks.map(p=>({worldX:p.worldX,bounds:p.bounds,
   departure:p.departure,platforms:p.platforms,routes:p.routes})));
  assert.equal(before,after,'foundation changes active rock or collision geometry');
  assert.equal(JSON.stringify(F.build(course)),JSON.stringify(base),'foundation not deterministic');
 }
});
test('3B: original procedural texture renderer paints every new foundation segment without imported landscape assets',()=>{
 const R=load('spire-render-v10.js');
 const course=C.build(42,{count:2,preset:6},{assemble:A.assemble,physics,config:P.CONFIG}),base=F.build(course);
 const g={save(){},restore(){},translate(){},beginPath(){},moveTo(){},lineTo(){},
  closePath(){},clip(){},fillRect(){},fill(){},stroke(){},setLineDash(){},
  createLinearGradient(){return{addColorStop(){}}}};
 assert.doesNotThrow(()=>F.draw(g,base,R));
 const source=fs.readFileSync(dir+'spire-foundations-v12.js','utf8');
 for(const old of ['mountain-background.jpg','cliff-texture.png','rock-slate-seamless.png','world-data.js'])
  assert.ok(!source.includes(old));
});
