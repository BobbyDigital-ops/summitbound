/* Summitbound v11: ten edge-to-edge spire gap presets.
 * Course assembler uses only new vertical prefabs, original vault dynamics,
 * and actual projected landing-platform collision widths.
 * Flight samples are candidate trajectories, NOT full terrain/gameplay proof.
 */
(function(root){
'use strict';
const GAP_PRESETS=Object.freeze([40,65,90,115,140,165,190,215,240,265].map((gap,i)=>
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
       releaseX:ride.nextPx,releaseY:ride.nextPy,landingHeightRise:rise});
      break;
     }
    }
   }
  }
 }
 return samples;
}
function build(seed,settings,api){
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
    const match=samples.find(q=>from.worldX+q.landingX>=left+4&&from.worldX+q.landingX<=right-4
      &&from.worldX+q.releaseX<left+1);
    if(match){
     choice={peak:{...target,worldX,worldY:from.worldY+from.departure.y-rise-landing.y},
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
const API=Object.freeze({GAP_PRESETS,landings,build});
if(typeof module==='object'&&module.exports)module.exports=API;else root.SpireCourseV11=API;
})(typeof globalThis!=='undefined'?globalThis:this);
