/* Summitbound v11: ten edge-to-edge spire gap presets.
 * Course assembler uses only new vertical prefabs, original vault dynamics,
 * and actual projected landing-platform collision widths.
 * Flight samples are candidate trajectories, NOT full terrain/gameplay proof.
 */
(function(root){
'use strict';
const GAP_PRESETS=Object.freeze([90,150,210,270,330,390,450,510,570,630].map((gap,i)=>
 Object.freeze({id:i+1,gap,label:'Gap '+(i+1)})));
// Generate ONLY physically attainable sprint + plant setups. Simulates real
// 120 Hz running from rest on the existing orange deck; no scripted speed.
function landings(physics,cfg,source,rise){
 const dt=1/120,deck=source.departure,platform={x:(deck.left+deck.right)/2,
  y:deck.y+60,width:deck.width,height:120};
 const samples=[],phases=[.38,.44,.50,.56,.60,.64,.68,.72,.76,.80,.84];
 const startX=deck.left+12;
 for(const distanceFromRight of [128,139,152,166,184]){
  let px=startX,vx=0,runFrames=0;
  const targetPlantX=deck.right-distanceFromRight;
  while(px<targetPlantX&&runFrames<250){
   vx=Math.min(cfg.maxRunSpeed,vx+cfg.runAcceleration*dt);
   px+=vx*dt;runFrames++;
  }
  if(runFrames<2||px>deck.right-physics.PLANT_OFFSET-5)continue;
  const py=deck.y-22,plant=physics.validatePlantPoint(px,py,1,[platform],cfg);
  if(!plant.isValid)continue;
  for(const fraction of phases){
   let state=physics.initVault(px,py,vx,0,plant.anchorX,plant.anchorY,cfg),ride;
   const releaseFrames=Math.round(state.rideDuration*fraction*120);
   for(let step=0;step<releaseFrames;step++){
    ride=physics.stepVault(state,dt,cfg);state=ride.state;
   }
   if(!ride)continue;
   const kick=physics.calculateReleaseVelocity(ride.nextVx,ride.nextVy,state,cfg);
   let x=ride.nextPx,y=ride.nextPy,vy=kick.vy;
   const targetFeet=deck.y-rise;
   for(let step=0;step<820;step++){
    const oldFeet=y+22,fd=dt*cfg.arcadeFlightTempo;
    vy+=cfg.gravity*fd;x+=kick.vx*fd;y+=vy*fd;
    if(vy>=0&&oldFeet<=targetFeet&&y+22>=targetFeet){
     samples.push({launchX:px,landingX:x,speed:vx,runStartX:startX,
      runFrames,releaseFrames,releaseFraction:releaseFrames/(state.rideDuration*120),
      releaseX:ride.nextPx,releaseY:ride.nextPy,releaseVx:kick.vx,
      releaseVy:kick.vy,landingHeightRise:rise});
     break;
    }
   }
  }
 }
 // Prefer useful takeoff velocity, high release timing tolerance and a natural
 // long flight; the course builder scores actual collision contacts separately.
 return samples.sort((a,b)=>b.speed-a.speed||b.landingX-a.landingX);
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
 const dt=1/120,deck=source.departure,platform={x:(deck.left+deck.right)/2,
  y:deck.y+60,width:deck.width,height:120},wanted='target:'+landingId;
 // Reject layouts that fail a roughly ±42 ms planting window or ±67 ms
 // release window under the ORIGINAL physics (5 and 8 frames at 120 Hz).
 for(const plantShift of [-5,0,5]){
  for(const releaseShift of [-8,0,8]){
   let px=sample.runStartX,speed=0;
   const n=sample.runFrames+plantShift;
   if(n<1)return false;
   for(let i=0;i<n;i++){speed=Math.min(cfg.maxRunSpeed,speed+cfg.runAcceleration*dt);px+=speed*dt}
   const py=deck.y-22,plant=physics.validatePlantPoint(px,py,1,[platform],cfg);
   if(!plant.isValid)return false;
   let state=physics.initVault(px,py,speed,0,plant.anchorX,plant.anchorY,cfg),ride;
   const frames=sample.releaseFrames+releaseShift;
   if(frames<1)return false;
   for(let i=0;i<frames;i++){ride=physics.stepVault(state,dt,cfg);state=ride.state}
   const kick=physics.calculateReleaseVelocity(ride.nextVx,ride.nextVy,state,cfg);
   if(firstContact({releaseX:ride.nextPx,releaseY:ride.nextPy,
       releaseVx:kick.vx,releaseVy:kick.vy},source,target,dx,dy,cfg)!==wanted)return false;
  }
 }
 return true;
}
// A receiving scaffold genuinely extends the existing climbable platform
// toward the incoming chasm. Its *entire surface* is a real collider, and
// the old vertical climbing route stays attached to the same platform ID.
// Rock ledges are never stretched out of the mountain outline.
function incomingScaffold(target,index,protrusion){
 const original=target.platforms[index];
 const surface=target.platforms.map(q=>({...q}));
 const left=Math.min(original.left,target.bounds.left-protrusion);
 const right=original.right, y=original.y,width=right-left;
 const braces=[];
 for(let x=left+14;x<right-14;x+=46){
  braces.push([x,y+8,x+13,y+33],[x+13,y+33,Math.min(x+36,right-3),y+8]);
 }
 const attached={...original,kind:'scaffold',prefab:'scaffold-incoming-v14',
  material:'weathered-steel',left,right,x:(left+right)/2,width,
  vertices:[[left,y],[right,y],[right,y+8],[left,y+8]],braces,
  arrivalFacing:'left',textureSeed:(target.seed+index*79)>>>0};
 surface[index]=attached;
 return {...target,platforms:surface,colliders:target.colliders.map(q=>
  q.id===original.id?{...q,left,right,kind:'scaffold'}:{...q})};
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
  const gapId=settings.gapSequence?.[i-1]??(settings.varyGaps?Math.min(GAP_PRESETS.length,preset+((i-1)%3)):preset);
  const legOption=GAP_PRESETS.find(g=>g.id===gapId);
  if(!legOption)throw Error('Invalid gap at crossing '+i);
  const from=peaks[i-1],samples=landings(api.physics,api.config,from,rise);
  if(!samples.length)throw Error('No sampled takeoff trajectory on spire '+(i-1));
  let choice=null;
  for(let attempt=0;attempt<(settings.maxAttempts??120)&&!choice;attempt++){
   const target=api.assemble(seedAt(i,attempt));
   const worldX=from.worldX+from.bounds.right-target.bounds.left+legOption.gap;
   // Make the arrival unmistakable and physically large: a scaffold
   // projecting toward the incoming jump, not a hidden rock ledge.
   const options=target.platforms.map((_,j)=>j)
    .sort((a,b)=>target.platforms[b].width-target.platforms[a].width);
   for(const index of options){
    const candidate=incomingScaffold(target,index,72);
    const landing=candidate.platforms[index];
    const left=worldX+landing.left,right=worldX+landing.right;
    const worldY=from.worldY+from.departure.y-rise-landing.y;
    const offsetX=worldX-from.worldX,offsetY=worldY-from.worldY;
    const match=samples.find(q=>from.worldX+q.landingX>=left+20&&from.worldX+q.landingX<=right-20
      &&from.worldX+q.releaseX<left+1
      &&robustContact(q,api.physics,api.config,from,candidate,offsetX,offsetY,landing.id));
    if(match){
     choice={peak:{...candidate,worldX,worldY},
      crossing:{index:i-1,from:i-1,to:i,gapPreset:legOption.id,gap:legOption.gap,rise,
       targetPlatform:landing.id,flight:match,flightSampleVerified:true,
       fullyAcceleratedFromRest:true,landingType:'visible-scaffold',runStartX:match.runStartX}};
     break;
    }
   }
  }
  if(!choice)throw Error('No sampled reachable next spire for gap '+legOption.gap+' at crossing '+i);
  peaks.push(choice.peak);crossings.push(choice.crossing);
 }
 return {schema:'summitbound.course.v11',seed,source:'new-vertical-assets-only',
  gapPreset:option.id,gap:option.gap,gaps:crossings.map(c=>c.gap),rise,peaks,crossings,
  physicsSampled:true,standingStartCertified:true,fullGameplayCertified:false};
}
// Phase 6B structural audit. Uses genuine platform/route IDs, not rendered art.
function audit(course){
 const errors=[],p=course?.peaks||[],cs=course?.crossings||[];
 if(p.length<2||cs.length!==p.length-1)errors.push('incorrect peak/crossing count');
 for(let i=0;i<p.length;i++){
  const q=p[i];if(!q?.departure||!Number.isFinite(q.worldX)||!Number.isFinite(q.worldY)){
   errors.push('missing departure '+i);continue;
  }
  if(i<p.length-1&&q.departure.right-q.departure.left<300)errors.push('short takeoff '+i);
  for(const r of q.routes){
   const source=r.source==='departure'?q.departure:q.platforms.find(l=>l.id===r.source);
   const target=r.target==='departure'?q.departure:q.platforms.find(l=>l.id===r.target);
   if(!source||!target)errors.push('orphan climb '+i+':'+r.id);
   if(!Number.isFinite(r.x)||!Number.isFinite(r.fromY)||!Number.isFinite(r.toY)||r.fromY<=r.toY)
    errors.push('invalid climb geometry '+i+':'+r.id);
   if(source&&(r.x<source.left-1||r.x>source.right+1))errors.push('climb entry outside ledge '+i+':'+r.id);
  }
 }
 for(let i=0;i<cs.length;i++){
  const c=cs[i],from=p[i],to=p[i+1];if(!from||!to)continue;
  if(c.from!==i||c.to!==i+1||!c.flight||!c.flightSampleVerified||!c.fullyAcceleratedFromRest)
   errors.push('uncertified crossing '+i);
  const actual=(to.worldX+to.bounds.left)-(from.worldX+from.bounds.right);
  if(Math.abs(actual-c.gap)>1e-6||c.gap<=0)errors.push('incorrect rock gap '+i);
  const landing=to.platforms.find(q=>q.id===c.targetPlatform);
  if(!landing||landing.kind!=='scaffold'||landing.width<240)errors.push('missing landable scaffold '+i);
  const reachable=new Set([c.targetPlatform]);
  for(let pass=0;pass<to.routes.length+1;pass++)for(const r of to.routes)
   if(reachable.has(r.source))reachable.add(r.target);
  if(!reachable.has('departure'))errors.push('climb dead end after crossing '+i);
  const f=c.flight;if(f){
   if(f.speed<=0||f.runFrames<=0||f.runStartX<from.departure.left||f.launchX>=from.departure.right)
    errors.push('invalid running start '+i);
   if(landing&&(f.landingX+from.worldX<to.worldX+landing.left+3||
    f.landingX+from.worldX>to.worldX+landing.right-3))errors.push('landing outside scaffold '+i);
  }
 }
 return {valid:errors.length===0,errors,peaks:p.length,crossings:cs.length,gaps:cs.map(c=>c.gap)};
}
function build(seed,settings={},api){
 const attempts=settings.maxCourseAttempts??30;
 for(let attempt=0;attempt<attempts;attempt++){
  try{
   const course=buildOnce((seed+attempt*7919)>>>0,settings,api);
   const checked=audit(course);
   if(!checked.valid)throw Error('Generated course failed structural audit: '+checked.errors.join('; '));
   course.seed=seed;course.generationAttempts=attempt+1;course.audit=checked;
   return course;
  }catch(error){
   if(!/No sampled reachable next spire|No sampled takeoff trajectory|Generated course failed structural audit/.test(String(error))||attempt===attempts-1)throw error;
  }
 }
 throw Error('No sampled reachable full course');
}
const API=Object.freeze({GAP_PRESETS,landings,build,audit});
if(typeof module==='object'&&module.exports)module.exports=API;else root.SpireCourseV11=API;
})(typeof globalThis!=='undefined'?globalThis:this);
