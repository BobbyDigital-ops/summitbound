/* Summitbound Phase 2 isolated playtest adapter.
 * Original pole: PolePhysicsEngine. Original ice-step function: iceClimbDisplacement.
 * Not the main gameplay loop. No previous terrain assets or old map geometry.
 */
(function(root){
'use strict';
const CONFIG=Object.freeze({gravity:800,arcadeLift:1.18,arcadeRange:.84,arcadeFlightTempo:.88,
 runAcceleration:1050,maxRunSpeed:450,brakingDecel:2000,poleLength:195,
 poleStiffness:120,poleDamping:4.5,bendingStiffness:40,maxDeformation:.52,
 energyRetention:.96,playerMass:70,airborneSteerForce:90,maxAirborneSpeed:1050,
 rockFriction:.88,snowFriction:.48,iceFriction:.05,simSpeed:1});
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const isGround=s=>s==='GROUNDED'||s==='RUNNING'||s==='SLIDING';
class SpirePhase2Playtest{
 constructor({assemble,physics,iceStep}){
  if(typeof assemble!=='function'||!physics||typeof iceStep!=='function')
   throw Error('Original vault and ice-step physics are required');
  this.assemble=assemble;this.physics=physics;this.iceStep=iceStep;
  this.cfg={...CONFIG};this.message='';this.timer=0;this.seed=42;
  this.load(this.seed);
 }
 load(seed,options={}){
  this.seed=seed;this.spire=this.assemble(seed,options);
  // The lower platform is the starting surface. The departure is a real,
  // collision-enabled upper deck; this is a single-spire test, not a course.
  this.surfaces=[...this.spire.platforms.map(p=>({id:p.id,kind:p.kind,top:p.y,left:p.left,right:p.right})),
   {id:'departure',kind:'departure',top:this.spire.departure.y,left:this.spire.departure.left,right:this.spire.departure.right}];
  this.reset();return this.spire;
 }
 reset(){
  const bottom=this.surfaces.filter(p=>p.id!=='departure').sort((a,b)=>b.top-a.top)[0];
  if(!bottom)throw Error('No accessible lower landing');
  const route=this.spire.routes.find(r=>r.source===bottom.id);
  const x=route?clamp(route.x-16,bottom.left+8,bottom.right-8):(bottom.left+bottom.right)/2;
  this.player={x,y:bottom.top-22,vx:0,vy:0,state:'GROUNDED',
   standingOn:bottom.id,facingDir:1,climb:null,vault:null};
  this.keys={left:false,right:false,up:false,down:false};
  this.timer=0;this.message='Move to a ladder/icefall, then hold Up to climb';this.completed=false;
 }
 surface(id){return this.surfaces.find(p=>p.id===id)||null}
 action(key,down){
  const p=this.player,k=this.keys;
  if(['left','right','up','down'].includes(key)){k[key]=!!down;return}
  if(key==='axe-left'||key==='axe-right'){
   const sign=key==='axe-left'?-1:1,c=p.climb;
   if(!down||p.state!=='CLIMBING'||!c?.isIce||c.lastAxe===sign)return false;
   const interval=this.timer-(c.lastAxeAt??-100);
   c.pulse=Math.min(96,(c.pulse||0)+24*(interval>=.10&&interval<=.42?1.22:1));
   c.lastAxe=sign;c.lastAxeAt=this.timer;return true;
  }
  if(key==='vault'&&down)this.plant();
  if(key==='vault'&&!down)this.release();
  if(key==='retry'&&down)this.reset();
 }
 startClimb(){
  const p=this.player,route=this.spire.routes.find(r=>r.source===p.standingOn);
  if(!route||Math.abs(p.x-route.x)>30)return false;
  p.state='CLIMBING';p.vx=0;p.vy=0;p.x=route.x;p.standingOn=null;
  p.climb={route,originY:route.fromY-22,targetY:route.toY-22,
   isIce:route.kind==='ice',lastAxe:0,lastAxeAt:-100,pulse:0};
  p.y=p.climb.originY;this.message=route.kind==='ice'?'Ice: alternate left/right or hold Up':'Ladder: hold Up';
  return true;
 }
 plant(){
  const p=this.player,platform=this.surface(p.standingOn);
  if(!isGround(p.state)||!platform)return false;
  const originalPlatform={x:(platform.left+platform.right)/2,y:platform.top+60,
   width:platform.right-platform.left,height:120};
  const result=this.physics.validatePlantPoint(p.x,p.y,p.facingDir,[originalPlatform],this.cfg);
  if(!result.isValid){this.message=result.reason;return false}
  p.vault=this.physics.initVault(p.x,p.y,p.vx,p.vy,result.anchorX,result.anchorY,this.cfg);
  p.state='RIDING_VAULT';p.standingOn=null;this.message='Release the pole to launch';
  return true;
 }
 release(){
  const p=this.player;if(p.state!=='RIDING_VAULT'||!p.vault)return false;
  const out=this.physics.calculateReleaseVelocity(p.vx,p.vy,p.vault,this.cfg);
  p.vx=out.vx;p.vy=out.vy;p.vault=null;p.state='AIRBORNE';
  this.message='Actual existing vault release and gravity';return true;
 }
 tick(dt){
  if(!Number.isFinite(dt)||dt<=0)return;
  dt=Math.min(dt,1/30);this.timer+=dt;
  const p=this.player,k=this.keys;
  if(p.state==='CLIMBING'){
   const c=p.climb;let amount=0;
   if(c.isIce){amount=this.iceStep(c,k,dt);}
   else if(k.up&&!k.down)amount=-116*dt;
   else if(k.down&&!k.up)amount=116*dt;
   p.y=clamp(p.y+amount,c.targetY,c.originY);p.x=c.route.x;
   if(p.y<=c.targetY+.01){
    const arrival=this.surface(c.route.target);
    if(!arrival||p.x<arrival.left||p.x>arrival.right)throw Error('Climb exits outside a genuine landing');
    p.y=arrival.top-22;p.standingOn=arrival.id;p.state='GROUNDED';
    p.climb=null;this.message=arrival.id==='departure'?'Departure deck reached — test the vault':'Route connected to next landing';
    if(arrival.id==='departure')this.completed=true;
   }else if(p.y>=c.originY-.01&&k.down){
    const source=this.surface(c.route.source);
    p.y=source.top-22;p.standingOn=source.id;p.state='GROUNDED';p.climb=null;
   }
   return;
  }
  if(isGround(p.state)){
   if(k.up&&this.startClimb())return;
   const direction=(k.right?1:0)-(k.left?1:0);
   if(direction){
    p.facingDir=direction;
    p.vx=clamp(p.vx+direction*this.cfg.runAcceleration*dt,-this.cfg.maxRunSpeed,this.cfg.maxRunSpeed);
    p.state='RUNNING';
   }else{
    const drop=2400*.88*dt;
    p.vx=Math.abs(p.vx)<=drop?0:p.vx-Math.sign(p.vx)*drop;
    p.state=Math.abs(p.vx)<2?'GROUNDED':'SLIDING';
   }
   p.x+=p.vx*dt;
   const surface=this.surface(p.standingOn);
   if(!surface||p.x<surface.left-6||p.x>surface.right+6){
    p.state='AIRBORNE';p.standingOn=null;p.vy=0;
   }
   return;
  }
  if(p.state==='RIDING_VAULT'){
   const step=this.physics.stepVault(p.vault,dt,this.cfg);
   p.vault=step.state;p.x=step.nextPx;p.y=step.nextPy;
   p.vx=step.nextVx;p.vy=step.nextVy;
   if(step.shouldAutoRelease)this.release();
  }else{
   const fd=dt*this.cfg.arcadeFlightTempo,feet=p.y+22;
   p.vy+=this.cfg.gravity*fd;
   if(k.left)p.vx-=this.cfg.airborneSteerForce*fd;
   if(k.right)p.vx+=this.cfg.airborneSteerForce*fd;
   p.vx=clamp(p.vx,-this.cfg.maxAirborneSpeed,this.cfg.maxAirborneSpeed);
   p.x+=p.vx*fd;p.y+=p.vy*fd;
   const landed=this.surfaces.filter(s=>p.vy>=0&&feet<=s.top&&p.y+22>=s.top
    &&p.x>=s.left+3&&p.x<=s.right-3).sort((a,b)=>a.top-b.top)[0];
   if(landed){p.y=landed.top-22;p.vy=0;p.vx*=.5;p.state='GROUNDED';
    p.standingOn=landed.id;this.message='Landed on real generated '+landed.kind+' collider';}
  }
  if(p.y>this.spire.bounds.bottom+280)this.reset();
 }
 snapshot(){return {seed:this.seed,player:{...this.player,climb:this.player.climb?.route.id||null,
  vault:this.player.vault?.phase||null},completed:this.completed,message:this.message}}
}
const API=Object.freeze({SpirePhase2Playtest,CONFIG});
if(typeof module==='object'&&module.exports)module.exports=API;else root.SpirePhase2=API;
})(typeof globalThis!=='undefined'?globalThis:this);
