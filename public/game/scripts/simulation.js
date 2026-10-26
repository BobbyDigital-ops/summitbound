// Summit Leap v0.8.3 — extracted unchanged from v0.8.1.
function formatTime(t){return Math.floor(t/60) + ':' + String(Math.floor(t%60)).padStart(2,'0') + '.' + Math.floor(t*10)%10}

function caveRespawn(){
 const c = spires[4].cave; spawn(3, true); caveActivated = true; atStage = 4; lastSafeStage = 4;
 p.x = c.right - 58; p.y = c.floor - 22; p.vx = 0; p.vy = 0; p.surface = 'rock';
 p.state = 'GROUNDED'; p.standingOn = 'cave4'; p.groundedFor = .6;
 camera.x = p.x - .35 * innerWidth / getZoom(); camera.y = p.y - .57 * innerHeight / getZoom();
 hint('CAMPFIRE CHECKPOINT — CLIMB WHEN READY', 3);
}

function fail(){
 if(mode === 'hardcore'){
  hint('Hardcore: back to the beginning!', 3); gameReset();
 } else {
  if(caveActivated){ caveRespawn(); return; }
  const stage = Math.min(lastSafeStage, 3);
  landingHistory.length = stage;
  spawn(stage, true); hint('Missed the mountain — retry this leap!', 2);
 }
}

function getLanding(plat){
 p.standingOn = plat.id; p.surface = plat.surfaceType; p.groundedFor = 0;
 if(plat.kind === 'cave'){
  atStage = 4; lastSafeStage = 4; caveActivated = true; landingHistory[3] = 'Cave checkpoint';
  hint('CHECKPOINT! WARM CAMPFIRE — CLIMB INSIDE THE CAVE', 4); haptic([25,45,25]);
  win(); return;
 }
 if(plat.spire > atStage){
  atStage = plat.spire;
  if(plat.kind === 'summit'){
   lastSafeStage = plat.spire; landingHistory[plat.spire - 1] = 'Direct summit';
   hint('PERFECT! DIRECT SUMMIT — CLIMB SKIPPED', 3); haptic([12,30,12]);
  } else {
   landingHistory[plat.spire - 1] = plat.tier;
   hint(`${plat.tier.toUpperCase()} OUTCROP — BRAKE AND FIND THE ICE WALL`, 3);
  }
 } else if(plat.kind === 'ledge' && plat.spire === atStage){
  hint(`${plat.tier.toUpperCase()} OUTCROP — WALK TO THE ICE WALL`, 2);
 }
 if(plat.kind === 'summit' && plat.spire === 4) win();
}

function win(){
 completed = true; p.vx = 0; p.vy = 0; p.state = 'GROUNDED'; haptic([35,60,35]);
 document.getElementById('victoryText').textContent = `Four canyon leaps completed in ${formatTime(elapsed)}. Your routes: ${landingHistory.join(' → ') || 'direct ascent'}. The cave is your checkpoint; the fastest path avoids long climbs.`;
 document.getElementById('victory').classList.add('open');
 hint('CAVE OF EMBERS — ASCENT COMPLETE!', 5);
}

function climbStart(plat){
 const goal = platforms.find(v => v.id === 's' + plat.spire);
 if(!goal) return;
 const rungX = climbEntryX(plat);
 if(Math.abs(p.x - rungX) > 28) return;
 p.state = 'CLIMBING'; p.vx = 0; p.vy = 0; p.standingOn = null; p.x = rungX;
 p.climb = {originX:rungX, originY:p.y, targetX:goal.left + 40, targetY:goal.top - 22, spire:plat.spire, climbBeat:0, exitTime:0, isIce:plat.kind !== 'cave',tierIndex:plat.kind==='ledge'?Number(plat.id.split('-')[1]):null};
 hint(plat.kind === 'cave' ? 'HOLD W / ↑ — CLIMB THE CAVE LADDER' : 'HOLD W / ↑ — CLIMB THE ICE WITH YOUR PICKS', 2.5); haptic(7);
}

function tick(dt){
 if(completed) return;
 elapsed += dt;
 const k = input(), ground = isGround(), prevFeet = p.y + 22;
 
 if(p.state === 'CLIMBING'){
  const c = p.climb;
  if(k.up){
   const oldY = p.y; p.y = Math.max(c.targetY, p.y - 62 * dt); c.climbBeat += (oldY - p.y) / 24;
  }
  p.x = c.isIce ? icePositionAt(c.spire,p.y,c.tierIndex).x : c.originX; // Follow one continuous ice line, or the cave ladder
  if(p.y <= c.targetY + .25){ p.y = c.targetY; p.state = 'STEP_OFF'; c.exitTime = 0; }
  return;
 }
 
 if(p.state === 'STEP_OFF'){
  const c = p.climb; c.exitTime += dt;
  const delta = c.targetX - p.x, advance = Math.sign(delta) * Math.min(Math.abs(delta), 175 * dt);
  p.x += advance;
  if(Math.abs(c.targetX - p.x) < .5){
   const stage = c.spire; p.x = c.targetX; p.state = 'GROUNDED'; p.vx = 0; p.vy = 0; p.surface = 'snow'; p.standingOn = 's' + stage; p.groundedFor = .4; lastSafeStage = stage;
   hint(stage === 4 ? 'FIRE ABOVE — SECTION COMPLETE!' : 'SUMMIT REACHED — READY FOR NEXT LEAP', 2);
   if(stage === 4) win();
  }
  return;
 }
 
 if(ground){
  const direction = k.right === k.left ? 0 : k.right ? 1 : -1;
  if(direction){
   p.facingDir = direction;
   const opposed = Math.sign(p.vx) === -direction;
   if(opposed) p.vx += direction * cfg.brakingDecel * dt;
   else p.vx += direction * cfg.runAcceleration * dt;
   p.vx = clamp(p.vx, -cfg.maxRunSpeed, cfg.maxRunSpeed);
   p.state = opposed ? 'BRAKING' : 'RUNNING';
  } else {
   const f = p.surface === 'ice' ? cfg.iceFriction : p.surface === 'snow' ? cfg.snowFriction : cfg.rockFriction;
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
 
 // Cave roof ceiling check
 if((p.state === 'AIRBORNE' || p.state === 'FALLING') && p.vx > 0){
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
   const possibles = platforms.filter(pl => p.x >= pl.left + 3 && p.x <= pl.right - 3 && prevFeet <= pl.top + 3 && feet >= pl.top - 4).sort((a,b) => a.top - b.top);
   if(possibles.length){
    standing = possibles.find(q => q.kind !== 'cave' || p.y - 23 >= spires[4].cave.ceiling + 2) || null;
    if(standing){ p.y = standing.top - 22; p.vy = 0; if(!wasGround) getLanding(standing); }
   }
  }
  if(standing){
   p.standingOn = standing.id; p.surface = standing.surfaceType;
   if(!isGround()) p.state = Math.abs(p.vx) > 20 ? 'RUNNING' : 'GROUNDED';
   const rungX = climbEntryX(standing);
   if(['ledge','cave'].includes(standing.kind) && p.groundedFor > .10 && Math.abs(p.vx) < 120 && k.up && Math.abs(p.x - rungX) < 28){
    climbStart(standing);
   }
  } else {
   if(wasGround){ p.state = 'FALLING'; p.standingOn = null; p.vy = Math.max(0, p.vy); p.groundedFor = 0; }
  }
 }
 
 if(p.y > Math.max(1520, (spires[Math.min(atStage + 1, 4)].ledges[2]?.[2] ?? spires[4].cave.floor) + 490) || p.x > 8100 || p.x < -90) fail();
 if(messageTimeout > 0){ messageTimeout -= dt; if(messageTimeout <= 0) notice.textContent = ''; }
}

function resize(){
 const maxRatio=graphicsQuality==='low'?1:graphicsQuality==='high'?2:(innerWidth<950?1.15:1.6);
 const ratio=Math.min(devicePixelRatio||1,maxRatio);
 canvas.width = Math.round(innerWidth * ratio); canvas.height = Math.round(innerHeight * ratio);
 ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
 if(typeof invalidateTerrainCache==='function')invalidateTerrainCache();
}

let perfStart=0,perfFrames=0,lastRenderedAt=0;
function loop(now){
 let delta = Math.min(.05, (now - prev) / 1000); prev = now;
 acc += delta;
 for(let n = 0; acc >= DT && n < 7; n++, acc -= DT) tick(DT);
 if(graphicsQuality!=='low'||now-lastRenderedAt>=31){
  draw();lastRenderedAt=now;
 }
 perfFrames++;
 if(now-perfStart>1200){
  const fps=perfFrames*1000/Math.max(1,now-perfStart);
  const indicator=document.getElementById('performanceLabel');
  if(indicator)indicator.textContent='Loop '+Math.round(fps)+' fps';
  perfStart=now;perfFrames=0;
 }
 requestAnimationFrame(loop);
}

function retry(){
 if(mode !== 'hardcore' && caveActivated) caveRespawn();
 else spawn(Math.min(lastSafeStage, 3), true);
}

for(const b of document.querySelectorAll('[data-mode]')) b.addEventListener('click', () => {
 mode = b.dataset.mode;
 document.querySelectorAll('[data-mode]').forEach(el => el.classList.toggle('sel', el === b));
 gameReset();
});


