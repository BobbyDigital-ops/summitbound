const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');

const context=vm.createContext({
 Image:class Image{},
 document:{getElementById:()=>null},
 platforms:[]
});
vm.runInContext(fs.readFileSync('public/game/scripts/world-data.js','utf8'),context);
vm.runInContext(fs.readFileSync('public/game/scripts/physics.js','utf8'),context);
const Engine=vm.runInContext('PolePhysicsEngine',context);
const cfg=vm.runInContext('cfg',context),spires=vm.runInContext('spires',context);
const dt=1/120, flightStep=dt*cfg.arcadeFlightTempo;

function possibleLanding(launch,target){
 const startX=launch[1],surfaceY=launch[2];
 const [left,right,landingY]=target;
 // Plant near the true takeoff edge with viable runup speeds, then sample
 // real vault ride and timed release and integrate the real airborne values.
 for(const offset of [120,140,170,200]){
  for(const speed of [260,320,360]){
   for(let tick=42;tick<=210;tick+=12){
    const start=startX-offset, py=surfaceY-22;
    const anchorX=start+120;
    const initial=Engine.initVault(start,py,speed,0,anchorX,surfaceY,cfg);
    const result=Engine.stepVault(initial,tick*dt,cfg);
    const kick=Engine.calculateReleaseVelocity(result.nextVx,result.nextVy,result.state,cfg);
    let x=result.nextPx,y=result.nextPy,vy=kick.vy;
    if(y+22>landingY)continue;
    for(let t=0;t<325;t++){
     const prev=y+22;
     vy+=cfg.gravity*flightStep;
     x+=kick.vx*flightStep; y+=vy*flightStep;
     const feet=y+22;
     if(vy>=0 && prev<=landingY+3 && feet>=landingY-4){
      if(x>=left+3 && x<=right-3)return {x,speed,release:tick*dt};
      break;
     }
     if(x>right+60||y>landingY+400)break;
    }
   }
  }
 }
 return null;
}
for(let seed=0;seed<9;seed++){
 test('real arcade vault can land uphill in EVERY stage, seed '+(seed+1),()=>{
  vm.runInContext('applyRoute('+seed+')',context);
  for(let stage=1;stage<=4;stage++){
   const prev=spires[stage-1].summit;
   const landings=stage===4
     ? [[spires[4].cave.left,spires[4].cave.right,spires[4].cave.floor]]
     : spires[stage].ledges;
   const possible=landings.map(t=>possibleLanding(prev,t));
   const count=possible.filter(Boolean).length;
   assert.ok(count>=1,'no viable airborne ascent at stage '+stage+' seed '+seed);
   if(stage<4 && landings.length>1) assert.ok(count>=Math.min(2,landings.length),
     'at least two real risk/reward landing choices should remain at stage '+stage+' seed '+seed);
  }
 });
}
