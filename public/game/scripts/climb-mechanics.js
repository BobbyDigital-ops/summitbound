// Phase 8 — edge-triggered alternating ice axe climbing.
// Ground A/D remains horizontal movement. Once attached, A/D or the mobile
// left/right controls become ice tools; held keys/repeated keydowns never
// generate additional strokes. W/Up remains a slower accessible steady climb.
const ICE_AXE_STEP=24;
const ICE_AXE_MAX_QUEUE=96;
const ICE_AXE_MAX_SPEED=245;
const ICE_AXE_STEADY_SPEED=78;
const ICE_AXE_DESCENT_SPEED=116;
function iceAxeStrike(side){
 if(p.state!=='CLIMBING'||!p.climb?.isIce||![-1,1].includes(side))
  return false;
 const c=p.climb;
 if(c.lastAxe===side)return false;
 const between=elapsed-(c.lastAxeAt??-100);
 const boost=between>=.10&&between<=.42?1.22:1;
 const amount=ICE_AXE_STEP*boost;
 c.pulse=Math.min(ICE_AXE_MAX_QUEUE,(c.pulse||0)+amount);
 c.lastAxe=side;c.lastAxeAt=elapsed;
 c.axeHits=(c.axeHits||0)+1;
 if(c.axeHits%4===0)haptic(6);
 return true;
}
function iceClimbDisplacement(c,k,dt){
 if(k.down&&!k.up){c.pulse=0;return ICE_AXE_DESCENT_SPEED*dt;}
 const strokes=Math.min(c.pulse||0,ICE_AXE_MAX_SPEED*dt);
 c.pulse=Math.max(0,(c.pulse||0)-strokes);
 return -(strokes+(k.up?ICE_AXE_STEADY_SPEED*dt:0));
}
