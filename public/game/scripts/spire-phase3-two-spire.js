/* Phase 3A: genuine two-spire mechanics test using existing PolePhysicsEngine,
 * the unchanged iceClimbDisplacement, real v10 platform colliders and v11 course geometry.
 * NO scripted landing, X correction, automatic flight rescue or hidden vault boost.
 */
(function(root){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ground=s=>['GROUNDED','RUNNING','SLIDING'].includes(s);
class TwoSpirePlaytest{
 constructor({course,assemble,physics,iceStep,config}){
  if(!course||!assemble||!physics||!iceStep||!config)throw Error('Missing new assets or existing physics');
  this.courseBuilder=course;this.assemble=assemble;this.physics=physics;this.iceStep=iceStep;
  this.cfg={...config};this.load(42,1);
 }
 load(seed,preset=1){
  this.seed=seed;this.preset=preset;
  this.course=this.courseBuilder.build(seed,{count:2,preset},
   {assemble:this.assemble,physics:this.physics,config:this.cfg});
  this.terrain=this.course.peaks;
  this.surfaces=[];this.routes=[];
  this.terrain.forEach((s,i)=>{
   const dx=s.worldX,dy=s.worldY,key=id=>i+':'+id;
   for(const q of s.platforms)this.surfaces.push({id:key(q.id),spire:i,kind:q.kind,
    top:dy+q.y,left:dx+q.left,right:dx+q.right,original:q});
   this.surfaces.push({id:key('departure'),spire:i,kind:'departure',
    top:dy+s.departure.y,left:dx+s.departure.left,right:dx+s.departure.right});
   for(const r of s.routes)this.routes.push({...r,id:key(r.id),source:key(r.source),
    target:key(r.target),x:dx+r.x,fromY:dy+r.fromY,toY:dy+r.toY});
  });
  this.reset();
  return this.course;
 }
 surface(id){return this.surfaces.find(s=>s.id===id)||null}
 reset(start='departure'){
  const s=start==='first-landing'
   ?this.surfaces.filter(p=>p.spire===0&&p.kind!=='departure').sort((a,b)=>b.top-a.top)[0]
   :this.surface('0:departure');
  if(!s)throw Error('Missing starting platform');
  const x=start==='first-landing'
   ?(s.left+s.right)/2 :s.left+7;
  this.player={x,y:s.top-22,vx:0,vy:0,state:'GROUNDED',
   surface:s.id,face:1,climb:null,vault:null,runDistance:0};
  this.controls={left:false,right:false,up:false,down:false};
  this.time=0;this.won=false;this.touchdowns=0;this.vaults=0;this.lastLanding=null;
  this.message='Run right, hold Space to plant, release to vault across. Up climbs.';
 }
 action(key,on){
  const c=this.controls,p=this.player;
  if(Object.hasOwn(c,key)){c[key]=!!on;return}
  if(key==='vault')return on?this.plant():this.release();
  if(key==='retry'&&on){this.reset();return true}
  if((key==='axe-left'||key==='axe-right')&&on&&p.climb?.isIce){
   const dir=key==='axe-left'?-1:1,z=p.climb;
   if(dir===z.lastAxe)return false;
   const delta=this.time-(z.lastAxeAt??-100);
   z.pulse=Math.min(96,(z.pulse||0)+24*(delta>=.1&&delta<=.42?1.22:1));
   z.lastAxe=dir;z.lastAxeAt=this.time;return true;
  }
  return false;
 }
 plant(){
  const p=this.player;
  if(!ground(p.state))return false;
  const s=this.surface(p.surface);if(!s)return false;
  const check=this.physics.validatePlantPoint(p.x,p.y,p.face,
   [{x:(s.left+s.right)/2,y:s.top+60,width:s.right-s.left,height:120}],this.cfg);
  if(!check.isValid){this.message=check.reason;return false}
  p.vault=this.physics.initVault(p.x,p.y,p.vx,p.vy,check.anchorX,check.anchorY,this.cfg);
  p.state='RIDING_VAULT';p.surface=null;this.vaults++;this.message='Pole loaded — release at chosen angle';
  return true;
 }
 release(){
  const p=this.player;if(p.state!=='RIDING_VAULT'||!p.vault)return false;
  const kick=this.physics.calculateReleaseVelocity(p.vx,p.vy,p.vault,this.cfg);
  p.vx=kick.vx;p.vy=kick.vy;p.vault=null;p.state='AIRBORNE';
  this.message='Flight — land inside the actual receiving platform';return true;
 }
 climb(){
  const p=this.player,r=this.routes.find(q=>q.source===p.surface);
  if(!r||Math.abs(p.x-r.x)>29)return false;
  p.state='CLIMBING';p.x=r.x;p.vx=0;p.vy=0;p.surface=null;
  p.climb={route:r,originY:r.fromY-22,targetY:r.toY-22,isIce:r.kind==='ice',
   pulse:0,lastAxe:0,lastAxeAt:-100};
  this.message=r.kind==='ice'?'Ice: hold W or alternate A / D':'Ladder: hold W';
  return true;
 }
 tick(dt){
  if(!Number.isFinite(dt)||dt<=0)return;
  dt=Math.min(dt,1/30);this.time+=dt;
  const p=this.player,c=this.controls,cfg=this.cfg;
  if(p.state==='CLIMBING'){
   const z=p.climb;
   const dy=z.isIce?this.iceStep(z,c,dt):c.up&&!c.down?-116*dt:c.down&&!c.up?116*dt:0;
   p.y=clamp(p.y+dy,z.targetY,z.originY);p.x=z.route.x;
   if(p.y<=z.targetY+.01){
    const s=this.surface(z.route.target);
    if(!s||p.x<s.left||p.x>s.right)throw Error('Invalid generated climb exit');
    p.y=s.top-22;p.surface=s.id;p.state='GROUNDED';p.climb=null;this.message='Reached '+s.kind;
    if(s.id==='1:departure')this.won=true;
   }else if(p.y>=z.originY-.01&&c.down){
    const s=this.surface(z.route.source);p.y=s.top-22;p.surface=s.id;p.state='GROUNDED';p.climb=null;
   }
   return;
  }
  if(ground(p.state)){
   if(c.up&&this.climb())return;
   const dir=(c.right?1:0)-(c.left?1:0);
   if(dir){
    p.face=dir;p.vx=clamp(p.vx+dir*cfg.runAcceleration*dt,-cfg.maxRunSpeed,cfg.maxRunSpeed);
    p.state='RUNNING';
   }else{
    const braking=2400*cfg.rockFriction*dt;
    p.vx=Math.abs(p.vx)<=braking?0:p.vx-Math.sign(p.vx)*braking;
    p.state=Math.abs(p.vx)<2?'GROUNDED':'SLIDING';
   }
   p.x+=p.vx*dt;p.runDistance+=Math.abs(p.vx*dt);
   const s=this.surface(p.surface);
   if(!s||p.x<s.left-6||p.x>s.right+6){
    p.state='AIRBORNE';p.surface=null;p.vy=0;
   }
   return;
  }
  if(p.state==='RIDING_VAULT'){
   const step=this.physics.stepVault(p.vault,dt,cfg);
   p.vault=step.state;p.x=step.nextPx;p.y=step.nextPy;p.vx=step.nextVx;p.vy=step.nextVy;
   if(step.shouldAutoRelease)this.release();
   return;
  }
  const fd=dt*cfg.arcadeFlightTempo,prevFeet=p.y+22,prevX=p.x;
  p.vy+=cfg.gravity*fd;
  if(c.left)p.vx-=cfg.airborneSteerForce*fd;
  if(c.right)p.vx+=cfg.airborneSteerForce*fd;
  p.vx=clamp(p.vx,-cfg.maxAirborneSpeed,cfg.maxAirborneSpeed);
  p.x+=p.vx*fd;p.y+=p.vy*fd;
  // Swept one-way top-edge contact. No snap from outside footprint,
  // rescue radius, steering correction, or landing assistance.
  const hit=this.surfaces.filter(s=>p.vy>=0&&prevFeet<=s.top+1e-8&&p.y+22>=s.top&&
   (()=>{const t=clamp((s.top-prevFeet)/Math.max(1e-9,p.y+22-prevFeet),0,1);
    const contactX=prevX+(p.x-prevX)*t;return contactX>=s.left+3&&contactX<=s.right-3})())
   .sort((a,b)=>a.top-b.top)[0];
  if(hit){
   p.y=hit.top-22;p.vy=0;p.vx*=.5;p.state='GROUNDED';p.surface=hit.id;
   this.touchdowns++;this.lastLanding=hit.id;this.message='Physical landing on '+hit.id;
   if(hit.id==='1:departure')this.won=true;
  }
  const floor=Math.max(...this.terrain.map(z=>z.worldY+z.bounds.bottom));
  if(p.y>floor+300){
   this.message='Fell into the gap — retry from last departure';
   this.reset();
  }
 }
 inspect(){
  return {seed:this.seed,gap:this.course.gap,player:{...this.player,
   climb:this.player.climb?.route.id||null,vault:this.player.vault?.phase||null},
   touchdowns:this.touchdowns,vaults:this.vaults,lastLanding:this.lastLanding,won:this.won,message:this.message};
 }
}
const API=Object.freeze({TwoSpirePlaytest});
if(typeof module==='object'&&module.exports)module.exports=API;else root.SpirePhase3=API;
})(typeof globalThis!=='undefined'?globalThis:this);
