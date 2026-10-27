const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const read=name=>fs.readFileSync('public/game/scripts/'+name,'utf8');

function setup(seed=0){
 const elements=new Map();
 const document={getElementById(id){
  if(!elements.has(id))elements.set(id,{
   hidden:true,textContent:'',style:{},classList:{add(){},remove(){},toggle(){}},
   getContext(){return {}},addEventListener(){}});
  return elements.get(id);
 },querySelectorAll(){return []}};
 const ctx=vm.createContext({document,Image:class Image{},
  performance:{now:()=>1},innerWidth:1280,innerHeight:720,
  navigator:{vibrate(){}},localStorage:{getItem(){return null},setItem(){}}});
 for(const file of ['physics.js','world-data.js','game-state.js','time-trial.js','climb-mechanics.js','simulation.js'])
  vm.runInContext(read(file),ctx,{filename:file});
 vm.runInContext('applyRoute('+seed+');gameReset();mode="practice"',ctx);
 return {ctx,elements,run:expression=>vm.runInContext(expression,ctx)};
}
function position(run,x,y,vx,state='GROUNDED',standing='cave4'){
 run(`p={x:${x},y:${y},vx:${vx},vy:0,state:'${state}',
 surface:'rock',standingOn:${standing===null?'null':JSON.stringify(standing)},
 groundedFor:.5,runDistance:0,climb:null,facingDir:1};
 caveActivated=true;atStage=4;lastSafeStage=4;completed=false;keys.clear();`);
}

for(const seed of [0,1,7,42,250,996]){
 test('Phase 5 route '+seed+': cave mouth, ladder and solid right wall match geometry',()=>{
  const {run}=setup(seed),c=run('caveGeometry()');
  assert.ok(c.wallX>c.fireX+60,'no walking separation from fire to right wall');
  assert.ok(c.ladderX>c.fireX+65,'ladder must be to the right of the fire');
  assert.ok(c.ladderX<c.wallX,'ladder must be inside the right wall');
  assert.equal(run('climbEntryX(platforms.find(p=>p.id==="cave4"))'),c.ladderX);
  const floor=run('spires[4].cave.floor');
  position(run,c.wallX-10,floor-22,360,'RUNNING');
  run('for(let i=0;i<100;i++)tick(1/120)');
  assert.ok(run('p.x')<=c.wallX+.01,'ran through the right wall');
  assert.equal(run('p.standingOn'),'cave4','wall collision dumped climber out of cave');
  position(run,c.wallX-10,floor-84,520,'AIRBORNE',null);
  run('p.vy=20;for(let i=0;i<30;i++)tick(1/120)');
  assert.ok(run('p.x')<=c.wallX+.01,'airborne climber escaped through wall');
  position(run,c.left+20,floor-22,80,'RUNNING');
  run('tick(1/120)');
  assert.ok(run('p.x')>c.left+20,'cave entrance prevents walking inward');
  position(run,c.ladderX,floor-22,0,'GROUNDED');
  run('keys.add("w");tick(1/120)');
  assert.equal(run('p.state'),'CLIMBING','ladder inaccessible inside the cave');
 });
}

test('Phase 5: fire menu is contextual and never interrupts a time trial',()=>{
 const {run,elements}=setup(),c=run('caveGeometry()'),y=run('spires[4].cave.floor-22');
 position(run,c.fireX,y,0);
 run('updateCaveCampfire()');
 assert.equal(elements.get('campfireActions').hidden,false);
 run('continueCaveAscent();updateCaveCampfire()');
 assert.equal(elements.get('campfireActions').hidden,true);
 position(run,c.fireX+90,y,0);run('updateCaveCampfire()');
 position(run,c.fireX,y,0);run('updateCaveCampfire()');
 assert.equal(elements.get('campfireActions').hidden,false,'action should reactivate after returning');
 run('mode="trial";updateCaveCampfire()');
 assert.equal(elements.get('campfireActions').hidden,true);
});

test('Phase 5: Retry leap starts from prior summit, not cave; checkpoint respawns correctly',()=>{
 const {run}=setup(),c=run('caveGeometry()'),y=run('spires[4].cave.floor-22');
 position(run,c.fireX,y,0);
 run('retryFinalLeap()');
 assert.equal(run('caveActivated'),false);
 assert.equal(run('atStage'),3);
 assert.equal(run('p.standingOn'),'s3');
 run('getLanding(platforms.find(p=>p.id==="cave4"))');
 assert.equal(run('caveActivated'),true);
 run('caveRespawn()');
 assert.equal(run('p.standingOn'),'cave4');
 assert.equal(run('p.x'),c.fireX-12);
 assert.equal(run('lastSafeStage'),4);
});
test('Phase 5: rendered ladder and fire use the collision geometry, not arbitrary positions',()=>{
 const source=read('rendering.js');
 assert.match(source,/const geom=caveGeometry\(\)/);
 assert.match(source,/const fx=geom\.fireX/);
 assert.match(source,/const c=spires\[4\]\.cave, x=caveGeometry\(\)\.ladderX/);
 assert.match(source,/ctx\.moveTo\(geom\.wallX\+3,t\+13\)/);
});
