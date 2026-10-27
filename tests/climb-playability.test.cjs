const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function gameContext() {
 const elements = new Map();
 const document = {
  getElementById(id) {
   if (!elements.has(id)) elements.set(id, {
    textContent: '', classList: {add(){}, remove(){}}, style: {}
   });
   return elements.get(id);
  },
  querySelectorAll() {return [];}
 };
 const context=vm.createContext({Image:class Image {},document,platforms:[]});
 for(const file of ['world-data.js','physics.js'])
  vm.runInContext(fs.readFileSync('public/game/scripts/'+file,'utf8'),context);
 vm.runInContext([
  "var p={}, elapsed=0, completed=false, caveActivated=false, atStage=0,",
  "lastSafeStage=0, landingHistory=[], trail=[], messageTimeout=0,",
  "mode='practice', peakBuzz=false, camera={x:0,y:0}, notice={textContent:''};",
  "function platform(id,l,r,t,s='snow',extra={}){",
  "return {id,x:(l+r)/2,y:t+60,width:r-l,height:120,",
  "surfaceType:s,top:t,left:l,right:r,...extra};}",
  "function input(){return {left:false,right:false,up:true};}",
  "function isGround(){return ['GROUNDED','RUNNING','BRAKING','SLIDING'].includes(p.state);}",
  "function currentPlatform(){return platforms.find(pl=>pl.id===p.standingOn);}",
  "function hint(){} function haptic(){}",
  "for(let i=0;i<spires.length;i++){",
  "const s=spires[i];",
  "platforms.push(platform('s'+i,...s.summit,{kind:'summit',spire:i}));",
  "if(s.cave)platforms.push(platform('cave4',s.cave.left,s.cave.right,",
  "s.cave.floor,'rock',{kind:'cave',spire:i,tier:'Checkpoint'}));",
  "} applyRoute(0);"
 ].join('\n'),context);
 vm.runInContext(fs.readFileSync('public/game/scripts/simulation.js','utf8'),context);
 return context;
}

for(let seed=0;seed<9;seed++){
 test('route '+(seed+1)+': all shelf climbs use their own actual summit exits',()=>{
  const ctx=gameContext();
  vm.runInContext('applyRoute('+seed+')',ctx);
  for(let spire=1;spire<=3;spire++){
   const ledges=vm.runInContext('spires['+spire+'].ledges',ctx);
   for(let tier=0;tier<ledges.length;tier++){
    const id='l'+spire+'-'+tier, plat=ctx.platforms.find(v=>v.id===id);
    assert.ok(plat,id+' collision platform missing');
    ctx.p={x:plat.right-30,y:plat.top-22,vx:0,vy:0,
     surface:plat.surfaceType,standingOn:id,groundedFor:.5,
     state:'GROUNDED',climb:null};
    ctx.completed=false;ctx.atStage=spire-1;ctx.lastSafeStage=spire-1;
    vm.runInContext('tick(1/120)',ctx);
    const exit=vm.runInContext('iceClimbPoints('+spire+','+tier+').at(-1)',ctx);
    assert.equal(ctx.p.state,'CLIMBING',id+' cannot start by holding Up');
    assert.equal(ctx.p.climb.tierIndex,tier,id+' started another route');
    assert.equal(ctx.p.climb.lipX,exit.x,id+' ice lip changed');
    assert.ok(ctx.p.climb.targetX>=exit.x+17&&ctx.p.climb.targetX<=exit.x+21,
     id+' does not step onto the snow beyond the ice lip');
    const frames=vm.runInContext('(()=>{let n=0;while(p.state!=="GROUNDED" && n<1800){tick(1/120);n++;}return n;})()',ctx);
    assert.ok(frames<1800,id+' never finishes ascent');
    assert.equal(ctx.p.standingOn,'s'+spire,id+' dismount misses summit');
    assert.equal(ctx.lastSafeStage,spire,id+' failed to activate safe summit');
    assert.ok(Math.abs(ctx.p.x-ctx.p.climb.targetX)<.5,
     id+' did not complete the step onto the snowy ridge');
    const summit=vm.runInContext('spires['+spire+'].summit',ctx);
    assert.ok(ctx.p.x>=summit[0]+3&&ctx.p.x<=summit[1]-3,
     id+' exit not on physical summit');
    assert.ok(Math.abs(ctx.p.y-(summit[2]-22))<.5,
     id+' exit height not on summit surface');
   }
  }
 });
}

test('cave arrival saves a checkpoint; ladder leads to final summit and victory',()=>{
 const ctx=gameContext(), cave=ctx.platforms.find(v=>v.id==='cave4');
 ctx.p={x:cave.right-58,y:cave.top-22,vx:0,vy:0,state:'AIRBORNE',
  groundedFor:0,standingOn:null,climb:null};
 ctx.atStage=3;ctx.lastSafeStage=3;ctx.completed=false;ctx.caveActivated=false;
 vm.runInContext('getLanding(platforms.find(v=>v.id==="cave4"))',ctx);
 assert.equal(ctx.caveActivated,true,'cave must save checkpoint');
 assert.equal(ctx.lastSafeStage,4,'checkpoint must save stage four');
 assert.equal(ctx.completed,false,'landing must not disable the actual cave ladder');
 ctx.p.x=cave.right-25;ctx.p.state='GROUNDED';ctx.p.vx=0;ctx.p.vy=0;ctx.p.groundedFor=.5;
 vm.runInContext('tick(1/120)',ctx);
 assert.equal(ctx.p.state,'CLIMBING','cave ladder cannot be entered');
 assert.equal(ctx.p.climb.isIce,false,'cave should use ladder instead of ice');
 const frames=vm.runInContext('(()=>{let n=0;while(!completed&&n<1800){tick(1/120);n++;}return n;})()',ctx);
 assert.ok(frames<1800,'cave ladder cannot be completed');
 assert.equal(ctx.completed,true,'final summit should trigger victory');
 assert.equal(ctx.p.standingOn,'s4','cave exit must land on final summit');
 assert.equal(ctx.lastSafeStage,4,'cave checkpoint must survive final climb');
});
