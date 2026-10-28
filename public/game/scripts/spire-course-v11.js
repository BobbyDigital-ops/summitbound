/* Summitbound v11: ten edge-to-edge spire gap presets.
 * Course assembler uses only new vertical prefabs, original vault dynamics,
 * and actual projected landing-platform collision widths.
 * Flight samples are candidate trajectories, NOT full terrain/gameplay proof.
 */
(function(root){
'use strict';
const GAP_PRESETS=Object.freeze([30,50,70,90,110,130,150,170,190,210].map((gap,i)=>
 Object.freeze({id:i+1,gap,label:'Gap '+(i+1)})));
function landings(physics,cfg,source,rise){
 const dt=1/120,deck=source.departure,platform={x:(deck.left+deck.right)/2,
  y:deck.y+60,width:deck.width,height:120};
 const samples=[],phases=[.35,.40,.45,.50,.55,.60,.65,.70,.75,.80,.85];
 const spots=[deck.left+7,deck.right-123].filter((v,i,a)=>v>=deck.left+5&&v<=deck.right-120&&a.indexOf(v)===i);
 for(const px of spots){
  const available=Math.max(0,px-deck.left-5);
  const vlimit=Math.sqrt(2*cfg.runAcceleration*available);
  for(const speed of [220,260,300,340,380,420,450]){
   if(speed>vlimit+1e-8)continue;
   const py=deck.y-22,plant=physics.validatePlantPoint(px,py,1,[platform],cfg);
   if(!plant.isValid)continue;
   for(const fraction of phases){
    let state=physics.initVault(px,py,speed,0,plant.anchorX,plant.anchorY,cfg),ride;
    const goal=state.rideDuration*fraction;
    while(state.elapsed+dt<=goal+1e-7){
     ride=physics.stepVault(state,dt,cfg);
     state=ride.state;
    }
    if(!ride)continue;
    const release=physics.calculateReleaseVelocity(ride.nextVx,ride.nextVy,state,cfg);
    let x=ride.nextPx,y=ride.nextPy,vy=release.vy,oldY=y;
    const targetFeet=deck.y-rise;
    // Exact game gravity/time scaling; straight flight without steering.
    for(let i=0;i<680;i++){
     const fd=dt*cfg.arcadeFlightTempo;
     vy+=cfg.gravity*fd;x+=release.vx*fd;oldY=y;y+=vy*fd;
     if(vy>=0&&oldY+22<=targetFeet&&y+22>=targetFeet){
      samples.push({launchX:px,landingX:x,speed,releaseFraction:fraction,
       releaseX:ride.nextPx,releaseY:ride.nextPy,releaseVx:release.vx,releaseVy:release.vy,landingHeightRise:rise});
      break;
     }
    }
   }
  }
 }
 return samples;
}
// Check the FIRST contact with *all* actual platform/deck colliders, not just
// whether a hypothetical trajectory passes across the intended ledge.
// This prevents passing the geometry sampler but landing on an earlier surface.
function firstContact(sample,source,target,worldX,worldY,cfg){
 const surfaces=[
  ...source.platforms.map(p=>({id:'source:'+p.id,left:p.left,right:p.right,top:p.y})),
  {id:'source:departure',left:source.departure.left,right:source.departure.right,top:source.departure.y},
  ...target.platforms.map(p=>({id:'target:'+p.id,left:worldX+p.left,right:worldX+p.right,top:worldY+p.y})),
  {id:'target:departure',left:worldX+target.departure.left,right:worldX+target.departure.right,
   top:worldY+target.departure.y}
 ];
 const fd=(1/120)*cfg.arcadeFlightTempo;
 let x=sample.releaseX,y=sample.releaseY,vy=sample.releaseVy;
 const vx=Math.min(cfg.maxAirborneSpeed,sample.releaseVx);
 for(let step=0;step<800;step++){
  const oldX=x,oldFeet=y+22;
  vy+=cfg.gravity*fd;x+=vx*fd;y+=vy*fd;
  const hits=surfaces.filter(p=>vy>=0&&oldFeet<=p.top&&y+22>=p.top&&
   (()=>{const t=(p.top-oldFeet)/Math.max(1e-9,y+22-oldFeet);
    const atX=oldX+(x-oldX)*t;
    return atX>=p.left+3&&atX<=p.right-3})())
   .sort((a,b)=>a.top-b.top);
  if(hits.length)return hits[0].id;
 }
 return null;
}
// A candidate must survive the speed overshoot caused by discrete keyboard
// acceleration and a one-frame variation in release timing. This is not
// assistance in flight: it rejects fragile level layouts at generation time.
function robustContact(sample,physics,cfg,source,target,dx,dy,landingId){
 const dt=1/120,platform={x:(source.departure.left+source.departure.right)/2,
  y:source.departure.y+60,width:source.departure.width,height:120};
 const wanted='target:'+landingId;
 for(const deltaSpeed of [0,13,-8]){
  for(const frameOffset of [0,-1,1]){
   const speed=sample.speed+deltaSpeed;
   const px=sample.launchX,py=source.departure.y-22;
   const plant=physics.validatePlantPoint(px,py,1,[platform],cfg);
   if(!plant.isValid)return false;
   let state=physics.initVault(px,py,speed,0,plant.anchorX,plant.anchorY,cfg),ride;
   const steps=Math.floor(state.rideDuration*sample.releaseFraction*120)+frameOffset;
   for(let frame=0;frame<steps;frame++){
    ride=physics.stepVault(state,dt,cfg);state=ride.state;
   }
   if(!ride)return false;
   const kick=physics.calculateReleaseVelocity(ride.nextVx,ride.nextVy,state,cfg);
   const trial={releaseX:ride.nextPx,releaseY:ride.nextPy,
    releaseVx:kick.vx,releaseVy:kick.vy};
   if(firstContact(trial,source,target,dx,dy,cfg)!==wanted)return false;
  }
 }
 return true;
}
function buildOnce(seed,settings,api){
 const n=settings.count??5,preset=settings.preset??1;
 if(!Number.isInteger(n)||n<2||n>8)throw Error('Course needs 2–8 spires');
 const option=GAP_PRESETS.find(v=>v.id===preset);
 if(!option)throw Error('Unknown gap preset');
 if(typeof api?.assemble!=='function'||!api.physics||!api.config)throw Error('Requires new spire kit and existing pole physics');
 const rise=settings.rise??40;
 if(rise<0||rise>110)throw Error('Rise must be between 0 and 110');
 const seedAt=(index,attempt)=>((seed+1)*127+(index+1)*10007+attempt*1777)>>>0;
 const first=api.assemble(seedAt(0,0));
 const peaks=[{...first,worldX:0,worldY:0}];
 const crossings=[];
 for(let i=1;i<n;i++){
  const from=peaks[i-1],samples=landings(api.physics,api.config,from,rise);
  if(!samples.length)throw Error('No sampled takeoff trajectory on spire '+(i-1));
  let choice=null;
  for(let attempt=0;attempt<(settings.maxAttempts??120)&&!choice;attempt++){
   const target=api.assemble(seedAt(i,attempt));
   const worldX=from.worldX+from.bounds.right-target.bounds.left+option.gap;
   const options=target.platforms.slice().sort((a,b)=>b.width-a.width);
   for(const landing of options){
    const left=worldX+landing.left,right=worldX+landing.right;
    const worldY=from.worldY+from.departure.y-rise-landing.y;
    // firstContact operates in the source spire's local world coordinates.
    const offsetX=worldX-from.worldX,offsetY=worldY-from.worldY;
    const match=samples.find(q=>from.worldX+q.landingX>=left+5&&from.worldX+q.landingX<=right-5
      &&from.worldX+q.releaseX<left+1
      &&robustContact(q,api.physics,api.config,from,target,offsetX,offsetY,landing.id));
    if(match){
     choice={peak:{...target,worldX,worldY},
      crossing:{index:i-1,from:i-1,to:i,gapPreset:option.id,gap:option.gap,rise,
       targetPlatform:landing.id,flight:match,flightSampleVerified:true}};
     break;
    }
   }
  }
  if(!choice)throw Error('No sampled reachable next spire for gap '+option.gap+' at crossing '+i);
  peaks.push(choice.peak);crossings.push(choice.crossing);
 }
 return {schema:'summitbound.course.v11',seed,source:'new-vertical-assets-only',
  gapPreset:option.id,gap:option.gap,rise,peaks,crossings,
  physicsSampled:true,fullGameplayCertified:false};
}
function build(seed,settings={},api){
 const attempts=settings.maxCourseAttempts??30;
 for(let attempt=0;attempt<attempts;attempt++){
  try{
   const course=buildOnce((seed+attempt*7919)>>>0,settings,api);
   course.seed=seed;course.generationAttempts=attempt+1;
   return course;
  }catch(error){
   if(!/No sampled reachable next spire|No sampled takeoff trajectory/.test(String(error))||attempt===attempts-1)throw error;
  }
 }
 throw Error('No sampled reachable full course');
}
const API=Object.freeze({GAP_PRESETS,landings,build});
if(typeof module==='object'&&module.exports)module.exports=API;else root.SpireCourseV11=API;
})(typeof globalThis!=='undefined'?globalThis:this);
