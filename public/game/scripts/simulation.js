// Summit Leap v0.8.3 — extracted unchanged from v0.8.1.
function formatTime(t){return Math.floor(t/60) + ':' + String(Math.floor(t%60)).padStart(2,'0') + '.' + Math.floor(t*10)%10}

function caveRespawn(){
 const c = spires[4].cave; spawn(3, true); caveActivated = true; atStage = 4; lastSafeStage = 4;
 p.x = caveGeometry().fireX - 12; p.y = c.floor - 22; p.vx = 0; p.vy = 0; p.surface = 'rock';
 p.state = 'GROUNDED'; p.standingOn = 'cave4'; p.groundedFor = .6;
 camera.x = p.x - .35 * innerWidth / getZoom(); camera.y = p.y - .57 * innerHeight / getZoom();
 hint('CAMPFIRE CHECKPOINT — FOLLOW THE LADDER TO THE RIGHT', 3);
}

function featuredCheckpointRespawn(){
 const checkpoint=featuredCheckpointLanding(lastSafeStage);
 if(!checkpoint){spawn(0,true);return;}
 spawn(checkpoint.peak,true);
 const pl=platforms.find(q=>q.id===checkpoint.id);
 p.x=checkpoint.x;p.y=checkpoint.y;p.vx=0;p.vy=0;
 p.standingOn=checkpoint.id;p.surface=pl.surfaceType;
 p.state='GROUNDED';p.groundedFor=.5;
 atStage=checkpoint.peak;lastSafeStage=checkpoint.peak;
 hint('RETURNED TO CAMPSITE CHECKPOINT',2.5);
}
// Practice only: repeat the difficult jump from the mountain/shelf that
// actually launched it, without falsely promoting that peak to a checkpoint.
// After securing a later campsite, the campsite takes precedence.
function practiceRespawnFromTakeoff(){
 const launch=practiceTakeoff;
 if(!launch||!Number.isInteger(launch.spire)||
    lastSafeStage>launch.spire){
  featuredCheckpointRespawn();return;
 }
 const surface=platforms.find(pl=>pl.id===launch.platformId);
 if(!surface){featuredCheckpointRespawn();return;}
 const savedCheckpoint=lastSafeStage;
 spawn(launch.spire,true);
 lastSafeStage=savedCheckpoint;
 const pl=platforms.find(q=>q.id===launch.platformId);
 if(!pl){featuredCheckpointRespawn();return;}
 // Restart with an honest run-up. Do not grant velocity or carry the
 // failed jump's momentum over. Narrow launch shelves stay narrow.
 const room=pl.right-pl.left;
 const offset=pl.kind==='summit'?Math.min(150,room*.22):
  Math.max(14,Math.min(30,room-127));
 p.x=pl.left+offset;p.y=pl.top-22;p.vx=0;p.vy=0;
 p.facingDir=launch.facingDir;p.standingOn=pl.id;
 p.surface=pl.surfaceType;p.state='GROUNDED';p.groundedFor=.6;
 atStage=pl.spire;
 camera.x=p.x-.26*innerWidth/getZoom();
 camera.y=p.y-.60*innerHeight/getZoom();
 hint('PRACTICE — RETRY FROM SAME PEAK',2.5);
}
function fail(){
 if(mode === 'trial'){
  gameReset();hint('TIME TRIAL FAILED — RACE RESTARTED',2);return;
 }
 if(mode === 'hardcore'){ 
  hint('Hardcore: back to the beginning!', 3); gameReset();
 } else {
  if(typeof FEATURED_COURSE!=='undefined'){
   if(mode==='practice')practiceRespawnFromTakeoff();
   else featuredCheckpointRespawn();
   return;
  }
  if(caveActivated){ caveRespawn(); return; }
  const stage = Math.min(lastSafeStage, 3);
  landingHistory.length = stage;
  spawn(stage, true); hint('Missed the mountain — retry this leap!', 2);
 }
}

function activateCampsiteCheckpoint(stage){
 if(typeof FEATURED_COURSE!=='undefined'){
  const cp=featuredCheckpointAtPeak(stage);
  if(cp?.type!=='campsite'||p.standingOn!=='l'+stage+'-'+(cp.ledge??0)||
    lastSafeStage>=stage)return;
  lastSafeStage=stage;
  hint('CAMPSITE SECURED — CHECKPOINT SAVED',3.2);
  haptic([17,35,17]);return;
 }
 if(stage!==2||lastSafeStage>=2)return;
 lastSafeStage=2;hint('CAMPFIRE CHECKPOINT REACHED',3);
}
function getLanding(plat){
 p.standingOn = plat.id; p.surface = plat.surfaceType; p.groundedFor = 0;
 if(plat.kind==='ledge')activateCampsiteCheckpoint(plat.spire);
 if(plat.kind === 'cave'){
  atStage = 4; lastSafeStage = 4; caveActivated = true; landingHistory[3] = 'Cave checkpoint';
  if(typeof trialSplit==='function')trialSplit(4);
  hint('CHECKPOINT! FIRE AHEAD · LADDER ON RIGHT', 3); haptic([25,45,25]);
  // Keep the cave as the retry checkpoint; finish only after the ladder exit.
  return;
 }
 if(plat.spire > atStage){
  atStage = plat.spire;
  if(typeof trialSplit==='function')trialSplit(plat.spire);
  if(plat.kind === 'summit'){ 
   activateCampsiteCheckpoint(plat.spire);
   landingHistory[plat.spire - 1] = 'Direct summit';
   hint('PERFECT! DIRECT SUMMIT — CLIMB SKIPPED', 3); haptic([12,30,12]);
  } else {
   landingHistory[plat.spire - 1] = plat.tier;
   if(plat.tier==='High'||plat.tier==='Ridge'||plat.tier==='Checkpoint'){
    hint('HIGH ROUTE — PRECISION LANDING!',2.2);haptic([18,30,12]);
   }else hint(`${plat.tier.toUpperCase()} OUTCROP — BRAKE AND FIND THE ICE WALL`, 3);
  }
 } else if(plat.kind === 'ledge' && plat.spire === atStage){
  hint(`${plat.tier.toUpperCase()} OUTCROP — WALK TO THE ICE WALL`, 2);
 }
 if(typeof FEATURED_COURSE==='undefined'&&plat.kind === 'summit' && plat.spire === 2)activateCampsiteCheckpoint(2);
 if(plat.kind === 'summit' && plat.spire === 4) win();
}

function win(){
 completed = true; p.vx = 0; p.vy = 0; p.state = 'GROUNDED'; haptic([35,60,35]);
 const trialResult=typeof finishTimeTrial==='function'?finishTimeTrial():'';
 document.getElementById('victoryText').textContent = `The Five Peaks — one continuous four-crossing ascent completed in ${formatTime(elapsed)}. ${trialResult?trialResult+' · ':''}Your routes: ${landingHistory.join(' → ') || 'direct ascent'}.`;
 document.getElementById('victory').classList.add('open');
 hint('FIVE PEAKS — ASCENT COMPLETE!', 5);
}

function climbStart(plat){
 const goal = platforms.find(v => v.id === 's' + plat.spire);
 if(!goal) return;
 const rungX = climbEntryX(plat);
 if(Math.abs(p.x - rungX) > (plat.kind==='ledge'?39:28)) return;
 p.state = 'CLIMBING'; p.vx = 0; p.vy = 0; p.standingOn = null; p.x = rungX;
 const isIce=plat.kind==='ledge',tierIndex=isIce?Number(plat.id.split('-')[1]):null;
 const exit=isIce?iceClimbPoints(plat.spire,tierIndex).at(-1):null;
 const lipX=exit?.x ?? rungX;
 // Ice routes terminate at their physical summit vertex, with NO scripted
 // sideways step. The cave ladder still uses its own tunnel transition.
 const stepX=lipX; // A real exit must already lie inside its summit collider.
 p.climb={originX:rungX,originY:p.y,targetX:stepX,lipX,
  targetY:goal.top-22,spire:plat.spire,climbBeat:0,exitTime:0,
  isIce,tierIndex,pulse:0,lastAxe:0,lastAxeAt:-100,axeHits:0};
 hint(plat.kind === 'cave' ? 'HOLD W / ↑ — CLIMB THE CAVE LADDER' : 'HOLD W / ↑ — CLIMB THE ICE WITH YOUR PICKS', 2.5); haptic(7);
}

// Begin a reversible ice descent from the upper summit. Select the closest
// genuine ice exit, with no teleport into a different path.
// Down/S reverses an active climb. On a platform it enters the nearest
// physical ice route: summit -> highest connected shelf, then (where the
// real ice branches meet) shelf -> next lower shelf. No arbitrary teleport.
function climbStartDown(){
 const standing=currentPlatform(),index=standing?.spire;
 if(index<1||index>(typeof FEATURED_COURSE!=='undefined'?4:3)||!['summit','ledge'].includes(standing.kind))return false;
 const routes=iceRouteNetwork(index);
 let selected;
 if(standing.kind==='summit'){
  selected=routes.map(route=>({route,entry:route.points.at(-1)}))
   .filter(x=>x.entry&&Math.abs(p.x-x.entry.x)<=28)
   .sort((a,b)=>Math.abs(p.x-a.entry.x)-Math.abs(p.x-b.entry.x)||
     a.route.points[0].y-b.route.points[0].y)[0];
 }else{
  const tier=Number(standing.id.split('-')[1]),entryX=climbEntryX(standing);
  selected=routes.filter(route=>route.sharedWith===tier)
   .map(route=>({route,entry:{x:iceXOnPath(route.points,standing.top-22),
    y:standing.top-22}}))
   .filter(x=>Math.abs(p.x-entryX)<=28&&
    Math.abs(x.entry.x-entryX)<=28)
   .sort((a,b)=>a.route.points[0].y-b.route.points[0].y)[0];
 }
 if(!selected)return false;
 const {route,entry}=selected;
 const ledge=platforms.find(pl=>pl.id==='l'+index+'-'+route.tier);
 if(!ledge)return false;
 p.state='CLIMBING';p.vx=0;p.vy=0;p.standingOn=null;
 p.x=entry.x;p.y=entry.y;
 p.climb={originX:climbEntryX(ledge),originY:route.points[0].y,
  targetX:route.points.at(-1).x,lipX:route.points.at(-1).x,
  targetY:spires[index].summit[2]-22,
  spire:index,climbBeat:0,exitTime:0,isIce:true,tierIndex:route.tier};
 hint('HOLD ↓ / S TO DESCEND · ↑ / W TO REVERSE',2.3);
 return true;
}

// Contextual, non-blocking fire actions appear only beside the checkpoint.
// Practice players can replay the final leap; in timed/hardcore modes the
// checkpoint does not interrupt the run or bypass the mode's reset rules.
function updateCaveCampfire(){
 if(typeof FEATURED_COURSE!=='undefined')return;
 const actions=document.getElementById('campfireActions');
 if(!actions)return;
 const cg=caveGeometry(),atFire=caveActivated&&!completed&&
  mode==='practice'&&isGround()&&p.standingOn==='cave4'&&
  Math.abs(p.x-cg.fireX)<=46;
 if(Math.abs(p.x-cg.fireX)>72)caveFireDismissed=false;
 const show=atFire&&!(typeof caveFireDismissed==='boolean'&&caveFireDismissed);
 if(actions.hidden===show)actions.hidden=!show;
}
function continueCaveAscent(){
 if(!caveActivated||p.standingOn!=='cave4')return;
 caveFireDismissed=true;
 document.getElementById('campfireActions').hidden=true;
 hint('FOLLOW THE RIGHT-HAND LADDER · HOLD W / ↑',3);
}
function retryFinalLeap(){
 if(!caveActivated||mode!=='practice')return;
 caveActivated=false;
 landingHistory.length=3;
 spawn(3,true);
 hint('FINAL LEAP RETRY — THE CAVE IS AHEAD',3);
}

function tick(dt){
 if(completed) return;
 elapsed += dt;
 if(typeof trialTick==='function')trialTick();
 const k = input(), ground = isGround(), prevFeet = p.y + 22, prevX=p.x;
 
 if(p.state === 'CLIMBING'){
  const c = p.climb;
  const oldY=p.y;
  if(c.isIce){
   p.y=clamp(p.y+iceClimbDisplacement(c,k,dt),c.targetY,c.originY);
  }else if(k.up&&!k.down){
   p.y=Math.max(c.targetY,p.y-116*dt);
  }else if(k.down&&!k.up){
   p.y=Math.min(c.originY,p.y+116*dt);
  }
  c.climbBeat+=(oldY-p.y)/24;
  const point=c.isIce?icePositionAt(c.spire,p.y,c.tierIndex):null;
  if(c.isIce&&!point){fail();return;}
  p.x=c.isIce?point.x:c.originX;
  // An icefall or cave tunnel ends where the physical climb route actually
  // meets its summit. No STEP_OFF interpolation or invisible sideways slide.
  if(p.y<=c.targetY+.25 && (oldY>p.y||k.up)){
   p.y=c.targetY;
   const summit=platforms.find(pl=>pl.id==='s'+c.spire);
   if(!summit||p.x<summit.left+3||p.x>summit.right-3){
    fail();return;
   }
   p.state='GROUNDED';p.standingOn=summit.id;
   p.surface=summit.surfaceType;p.vx=0;p.vy=0;
   p.groundedFor=.4;p.climb=null;
   if(typeof FEATURED_COURSE==='undefined')activateCampsiteCheckpoint(c.spire);
   hint(c.isIce?'ICE EXIT — SUMMIT REACHED':'TUNNEL EXIT — SUMMIT REACHED',1.8);
   if(c.spire===4)win();
  }
  else if(p.y>=c.originY-.25 && k.down){
   const ledge=platforms.find(pl=>pl.spire===c.spire&&pl.kind===(c.isIce?'ledge':'cave')&&
    (!c.isIce||Number(pl.id.split('-')[1])===c.tierIndex));
   if(ledge){p.y=ledge.top-22;p.x=c.originX;p.state='GROUNDED';p.vx=0;p.vy=0;
    p.surface=ledge.surfaceType;p.standingOn=ledge.id;p.groundedFor=.4;p.climb=null;}
  }
  return;
 }
 

 
 if(ground && k.down && !k.up && climbStartDown())return;

 if(ground){
  const direction = k.right === k.left ? 0 : k.right ? 1 : -1;
  if(direction){
   p.facingDir = direction;
   const opposed = Math.sign(p.vx) === -direction;
   const settled=p.groundedFor>.16&&currentPlatform()?.kind==='ledge';
   if(opposed) p.vx += direction * (settled?3300:cfg.brakingDecel)*dt;
   else p.vx += direction * (settled?1450:cfg.runAcceleration)*dt;
   p.vx = clamp(p.vx, -cfg.maxRunSpeed, cfg.maxRunSpeed);
   p.state = opposed ? 'BRAKING' : 'RUNNING';
  } else {
   const onLedge=currentPlatform()?.kind==='ledge';
   const f = onLedge ? 1.12 : p.surface === 'ice' ? cfg.iceFriction : p.surface === 'snow' ? cfg.snowFriction : cfg.rockFriction;
   const drop = 2400 * f * dt;
   p.vx = Math.abs(p.vx) <= drop ? 0 : p.vx - Math.sign(p.vx) * drop;
   p.state = Math.abs(p.vx) < 2 ? 'GROUNDED' : 'SLIDING';
  }
  p.groundedFor += dt;
 }
 
 if(p.state === 'RIDING_VAULT' && p.vault){
  const result = PolePhysicsEngine.stepVault(p.vault, dt, cfg);
  p.vault = result.state; p.x = result.nextPx; p.y = result.nextPy; p.vx = result.nextVx; p.vy = result.nextVy; p.bend = result.state.bendOffset;
  if(!peakBuzz && result.state.strain >= .75){ peakBuzz = true; haptic(12); }
  if(result.shouldAutoRelease) release();
 } else if(p.state === 'AIRBORNE' || p.state === 'FALLING'){
  const fd = dt * cfg.arcadeFlightTempo;
  p.vy += cfg.gravity * fd;
  if(k.left) p.vx -= cfg.airborneSteerForce * fd;
  if(k.right) p.vx += cfg.airborneSteerForce * fd;
  p.vx = clamp(p.vx, -650, 650);
  p.x += p.vx * fd; p.y += p.vy * fd;
  if(trail.length === 0 || Math.hypot(p.x - trail.at(-1).x, p.y - trail.at(-1).y) > 8){
   trail.push({x:p.x, y:p.y}); if(trail.length > 52) trail.shift();
  }
 } else {
  if(ground && Math.abs(p.vx)>18) p.runDistance=(p.runDistance||0)+Math.abs(p.vx*dt);
  p.x += p.vx * dt;
  if(p.x < 12){ p.x = 12; p.vx = 0; }
 }
 
 // The visible back of the cave is solid stone. Stop runners and airborne
 // arrivals before they escape through its right wall. Do not 'teleport'
 // someone who fell down outside the cave back into the chamber.
 const cg=caveGeometry();
 if(cg){
 const insideCaveHeight=p.y+22>=cg.headroomY&&p.y-22<=cg.floor+8;
 if((p.standingOn==='cave4'||insideCaveHeight)&&
    prevX>=cg.openingLeft&&prevX<=cg.wallX+3&&p.x>cg.wallX){
  p.x=cg.wallX;p.vx=0;
 }
 }
 // Cave roof ceiling check
 if(spires[4].cave&&(p.state === 'AIRBORNE' || p.state === 'FALLING') && p.vx > 0){
  const c = spires[4].cave, bodyTop = p.y - 23;
  if(p.x >= c.left - 8 && p.x <= c.right + 6 && p.y + 22 > c.ceiling - 6 && bodyTop < c.ceiling + 4){
   p.y = Math.max(p.y, c.ceiling + 27); p.vx = -Math.abs(p.vx) * .20; p.vy = Math.max(120, p.vy * .28);
   if(messageTimeout < .5) hint('STRUCK THE CAVE ROOF!', 1.4);
  }
 }
 
 if(p.state !== 'RIDING_VAULT'){
  const wasGround = ground, feet = p.y + 22; let standing = null;
  if(wasGround){
   const pl = currentPlatform();
   if(pl && p.x >= pl.left + 2 && p.x <= pl.right - 2 && Math.abs(feet - pl.top) < 12){
    standing = pl; p.y = pl.top - 22;
   }
  }
  if(!standing && p.vy >= 0){
   // Swept first-contact collisions. A fall may catch ANY actual shelf it
   // crosses; no magnetic snap to a predetermined platform.
   const crossed=platforms.map(pl=>{
    if(prevFeet>pl.top+3||feet<pl.top-4)return null;
    const t=clamp((pl.top-prevFeet)/Math.max(.00001,feet-prevFeet),0,1);
    const contactX=prevX+(p.x-prevX)*t;
    if(contactX<pl.left+3||contactX>pl.right-3)return null;
    if(pl.kind==='cave'&&spires[4].cave&&p.y-23<spires[4].cave.ceiling+2)return null;
    return {pl,t,contactX};
   }).filter(Boolean).sort((a,b)=>a.t-b.t);
   if(crossed.length){
    const hit=crossed[0];standing=hit.pl;
    p.x=hit.contactX;p.y=standing.top-22;p.vy=0;
    if(!wasGround)getLanding(standing);
   }
  }
  if(standing){
   p.standingOn = standing.id; p.surface = standing.surfaceType;
   if(!isGround()) p.state = Math.abs(p.vx) > 20 ? 'RUNNING' : 'GROUNDED';
   const rungX = climbEntryX(standing);
   if(['ledge','cave'].includes(standing.kind) && p.groundedFor > .065 && Math.abs(p.vx) < 195 && k.up && Math.abs(p.x - rungX) < 39){
    climbStart(standing);
   }
  } else {
   if(wasGround){ p.state = 'FALLING'; p.standingOn = null; p.vy = Math.max(0, p.vy); p.groundedFor = 0; }
  }
 }
 
 const next=spires[Math.min(atStage+1,spires.length-1)];
 const fallbackFloor=next.ledges.length?
  Math.max(...next.ledges.map(l=>l[2])):next.cave?.floor??1450;
 if(p.y>Math.max(1650,fallbackFloor+500)||p.x>8100||p.x<-90)fail();
 updateCaveCampfire();
 if(messageTimeout > 0){ messageTimeout -= dt; if(messageTimeout <= 0) notice.textContent = ''; }
}

// Modest mobile supersampling restores crisp player and ice edges while
 // avoiding the 3x device DPR (9x pixel count) of modern Android phones.
 // Auto falls back to 1x after sustained heavy paint times; Low stays 1x.
let autoPortraitCap=1.2,slowAutoWindows=0,lastTerrainBuilds=-1;
function canvasRatioFor(quality,width,dpr,autoCap=1.2){
 const maxRatio=quality==='low'?1:quality==='high'?2:
  (width<950?autoCap:1.6);
 return Math.min(Math.max(1,dpr||1),maxRatio);
}
function resize(){
 const ratio=canvasRatioFor(graphicsQuality,innerWidth,devicePixelRatio,autoPortraitCap);
 canvas.width = Math.round(innerWidth * ratio); canvas.height = Math.round(innerHeight * ratio);
 ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
 if(typeof invalidateTerrainCache==='function')invalidateTerrainCache();
}

let perfStart=0,perfFrames=0,perfRendered=0,lastRenderedAt=0;
let perfDrawSamples=[];
function loop(now){
 // Background tabs/Android app suspension must not accumulate physics or
 // time-trial ticks or waste GPU paint while the game is not visible.
 if(document.hidden){prev=now;acc=0;requestAnimationFrame(loop);return;}
 let delta = Math.min(.05, (now - prev) / 1000); prev = now;
 acc += delta;
 for(let n = 0; acc >= DT && n < 7; n++, acc -= DT) tick(DT);
 // Physics still ticks at 120 Hz. When the player is stationary on a
 // mobile device, a 30 Hz snowy idle render saves battery and GPU fill
 // without affecting the first frame of an input/movement/vault.
 const stationary=innerWidth<950&&graphicsQuality!=='high'&&isGround()&&
  Math.abs(p.vx)<2&&!p.vault&&!fingers.left.size&&!fingers.right.size&&
  !keys.has('arrowleft')&&!keys.has('arrowright')&&!keys.has('a')&&!keys.has('d');
 const renderGap=graphicsQuality==='low'||stationary?31:0;
 if(!lastRenderedAt||now-lastRenderedAt>=renderGap){
  const before=performance.now();
  draw();lastRenderedAt=now;perfRendered++;
  // Samples are captured at presentation time; inexpensive stats are
  // only sorted and displayed once a second in the optional Tune panel.
  const cost=performance.now()-before;
  perfDrawSamples.push(cost);
  if(perfDrawSamples.length>120)perfDrawSamples.shift();
 }
 perfFrames++;
 if(now-perfStart>1200){
  const elapsedMs=Math.max(1,now-perfStart);
  const fps=Math.round(perfRendered*1000/elapsedMs);
  const samples=[...perfDrawSamples].sort((a,b)=>a-b);
  const avg=samples.reduce((sum,v)=>sum+v,0)/Math.max(1,samples.length);
  const p95=samples[Math.min(samples.length-1,Math.floor(samples.length*.95))]||0;
  const mem=((renderStats.terrainBytes+renderStats.backdropBytes)/1048576).toFixed(0);
  const indicator=document.getElementById('performanceLabel');
  if(indicator)indicator.textContent=
   'Render '+fps+' fps · draw '+avg.toFixed(1)+' / p95 '+p95.toFixed(1)+
   ' ms · scene '+mem+' MB · builds '+renderStats.terrainBuilds+
   ' (evict '+renderStats.terrainEvictions+') · DPR '+
   canvasRatioFor(graphicsQuality,innerWidth,devicePixelRatio,autoPortraitCap).toFixed(2);
  // Three consecutive slow, stable (no terrain rebuild) sample windows are
  // needed before lowering DPR. We never auto-promote repeatedly or oscillate.
  if(graphicsQuality==='auto'&&innerWidth<950&&autoPortraitCap>1){
   const stable=renderStats.terrainBuilds===lastTerrainBuilds;
   slowAutoWindows=stable&&p95>24?slowAutoWindows+1:0;
   if(slowAutoWindows>=3){
    autoPortraitCap=1;slowAutoWindows=0;perfDrawSamples.length=0;
    resize();
    const mode=document.getElementById('graphicsMode');
    if(mode)mode.textContent='Graphics: auto (smooth)';
   }
  }else slowAutoWindows=0;
  lastTerrainBuilds=renderStats.terrainBuilds;
  perfStart=now;perfFrames=0;perfRendered=0;
 }
 requestAnimationFrame(loop);
}

function retry(){
 if(mode==='trial'){gameReset();hint('TIME TRIAL RESTARTED',2);return;}
 if(mode==='hardcore'){gameReset();hint('HARDCORE RUN RESTARTED',2);return;}
 if(typeof FEATURED_COURSE!=='undefined')practiceRespawnFromTakeoff();
 else if(caveActivated)caveRespawn();
 else spawn(Math.min(lastSafeStage,3),true);
}

for(const b of document.querySelectorAll('[data-mode]')) b.addEventListener('click', () => {
 mode = b.dataset.mode;
 const retryButton=document.getElementById('retry');
 if(retryButton)retryButton.textContent=mode==='practice'?'Retry peak':'Retry run';
 document.querySelectorAll('[data-mode]').forEach(el => el.classList.toggle('sel', el === b));
 gameReset();
});


