const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const ctx=vm.createContext({Image:class Image{},document:{getElementById:()=>null},platforms:[]});
vm.runInContext(fs.readFileSync('public/game/scripts/world-data.js','utf8'),ctx);
vm.runInContext(fs.readFileSync('public/game/scripts/physics.js','utf8'),ctx);
const Engine=vm.runInContext('PolePhysicsEngine',ctx);
const cfg=vm.runInContext('cfg',ctx),spires=vm.runInContext('spires',ctx);
const dt=1/120,flight=dt*cfg.arcadeFlightTempo;
// First surface struck, not a hypothetical isolated target. Count only safe
// touchdowns with enough runway to brake at the current 2000-unit decel.
function simulate(launch,destinations,offset,speed,tick){
 const px=launch[1]-offset,py=launch[2]-22;
 const vault=Engine.initVault(px,py,speed,0,px+120,launch[2],cfg);
 const ride=Engine.stepVault(vault,tick*dt,cfg);
 const kick=Engine.calculateReleaseVelocity(ride.nextVx,ride.nextVy,ride.state,cfg);
 let x=ride.nextPx,y=ride.nextPy,vy=kick.vy;
 for(let step=0;step<325;step++){
  const prev=y+22;
  vy+=cfg.gravity*flight;x+=kick.vx*flight;y+=vy*flight;
  if(vy>=0){
   const hit=destinations
    .filter(t=>x>=t[0]+3&&x<=t[1]-3&&prev<=t[2]+3&&y+22>=t[2]-4)
    .sort((a,b)=>a[2]-b[2])[0];
   if(hit){
    const braking=kick.vx*kick.vx/(2*cfg.brakingDecel);
    return {tier:hit[4],safe:hit[1]-x>=braking+12,x,braking};
   }
  }
  if(y>launch[2]+800)break;
 }
 return null;
}
function routePaths(launch,targets){
 const hits=new Map(targets.map(t=>[t[4],{hits:0,safe:0}]));
 for(const offset of [120,140,170,200])
  for(const speed of [260,320,360])
   for(let tick=42;tick<=210;tick+=12){
    const hit=simulate(launch,targets,offset,speed,tick);
    if(hit){const count=hits.get(hit.tier);count.hits++;if(hit.safe)count.safe++;}
   }
 return hits;
}
for(const seed of [...Array.from({length:60},(_,i)=>i),97,99,250,512,996]){
 test('seed '+seed+' has demanding yet stoppable ledges and independent ice exits',()=>{
  vm.runInContext('applyRoute('+seed+')',ctx);
  for(let i=1;i<=3;i++){
   const prev=spires[i-1].summit,ledge=spires[i].ledges;
   const sorted=[...ledge].sort((a,b)=>a[2]-b[2]);
   const x=ledge.map(t=>t[0]);
   assert.ok(Math.min(...x)-prev[1]>=385,'easy first shelf at spire '+i);
   if(ledge.length>1)assert.ok(Math.max(...x)-Math.min(...x)>=160,
    'shelves clustered on a single left strip, spire '+i);
   for(let j=1;j<sorted.length;j++)
    assert.ok(sorted[j][2]-sorted[j-1][2]>=20,
     'elevation bands compressed at spire '+i);
   const results=routePaths(prev,ledge);
   for(const t of ledge){
    const result=results.get(t[4]);
    assert.ok(result.hits>=3,'no real landing window on '+t[4]+' at spire '+i+' seed '+seed);
    assert.ok(result.safe>=2,'cannot brake safely on '+t[4]+' at spire '+i+' seed '+seed);
    assert.ok(t[0]>=spires[i].summit[0]+25,
     'shelf detached to left of the mountain crest: '+t[4]+' spire '+i);
   }
   const ice=vm.runInContext('independentIceRoutes('+i+')',ctx);
   for(let j=1;j<ice.length;j++)
    assert.ok(Math.abs(ice[j].points.at(-1).x-ice[j-1].points.at(-1).x)>=35,
     'adjacent ice ascents visually merge at spire '+i);
  }
  const cave=spires[4].cave,previous=spires[3].summit;
  assert.ok(cave.left-previous[1]>=545,'final cave chasm not challenging');
  const path=routePaths(previous,[[cave.left,cave.right,cave.floor,'rock','Cave']]).get('Cave');
  assert.ok(path.hits>=12&&path.safe>=10,'cave entrance lacks usable landing/braking window');
 });
}
