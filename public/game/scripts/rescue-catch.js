// SUMMITBOUND v0.30 — TRUE EDGE CATCH
// A deliberate throw at an exposed collision rim, without auto aim, a
// platform magnet, unlimited retries or scripted shortcut teleports.
// The short input buffer accommodates human perception + mobile touch latency
// but still requires physical contact with the actual ledge edge.
let catchUsed=false;
let catchQueuedUntil=-1;
const AXE_WINDOW=Object.freeze({behind:13,ahead:43,above:3,below:47,
 warningAhead:110,warningAbove:35,warningBelow:69,bufferSeconds:.22});
function axeCatchApproach(ignoreUsed=false){
 if((p.state!=='AIRBORNE'&&p.state!=='FALLING')||
   p.vy<8||(!ignoreUsed&&catchUsed))return null;
 const forward=p.facingDir>=0?1:-1;
 const tipX=p.x+forward*21;
 const near=[];
 for(const pl of platforms){
  if(!['summit','ledge','arrival'].includes(pl.kind))continue;
  const edge=forward>0?pl.left:pl.right;
  const dx=forward*(edge-tipX),dy=p.y-pl.top;
  if(dx < -AXE_WINDOW.behind-12||dx>AXE_WINDOW.warningAhead||
     dy < -AXE_WINDOW.warningAbove||dy>AXE_WINDOW.warningBelow)continue;
  // A cue only comes from a reachable real rim. Decorative rock never
  // creates a false target or changes contact geometry.
  const ready=dx>=-AXE_WINDOW.behind&&dx<=AXE_WINDOW.ahead&&
    dy>=AXE_WINDOW.above&&dy<=AXE_WINDOW.below;
  const distance=Math.abs(dx-8)+Math.abs(dy-22);
  near.push({pl,edge,dx,dy,ready,score:distance,forward});
 }
 near.sort((a,b)=>a.score-b.score);
 return near[0]||null;
}
function axeCatchOpportunity(ignoreUsed=false){
 const near=axeCatchApproach(ignoreUsed);
 return near&&near.ready?near:null;
}
function axeLatch(found){
 const pl=found.pl,face=found.forward;
 catchQueuedUntil=-1;
 p.state='HANGING';p.vx=0;p.vy=0;
 p.x=face>0?pl.left-20:pl.right+20;
 p.y=pl.top+18;p.standingOn=null;
 p.catchLedge={id:pl.id,side:face,strokes:0,lastSide:0,
  caughtAt:elapsed,lastStrikeAt:-100,edge:found.edge};
 hint('AXE SET! ALTERNATE A / D FOUR TIMES',2.4);
 haptic([22,28,18]);
 return true;
}
function attemptAxeCatch(){
 if(p.state!=='AIRBORNE'&&p.state!=='FALLING')return false;
 if(catchUsed)return false;
 const hit=axeCatchOpportunity();
 const near=hit||axeCatchApproach();
 catchUsed=true;
 if(hit)return axeLatch(hit);
 if(near&&near.dx>AXE_WINDOW.ahead&&
    near.dx<=AXE_WINDOW.warningAhead&&
    near.dy>=-AXE_WINDOW.warningAbove&&
    near.dy<=AXE_WINDOW.warningBelow){
  catchQueuedUntil=elapsed+AXE_WINDOW.bufferSeconds;
  hint('AXE THROWN — REACH FOR THE ROCK',.8);
  haptic(9);
  return false;
 }
 // As before, a completely wild swing burns the one airborne attempt.
 catchQueuedUntil=-1;
 hint(near?'AXE MISSED — WATCH THE LIP':'NO ROCK IN REACH',.85);
 haptic(7);
 return false;
}
function updatePendingAxeCatch(){
 if(catchQueuedUntil<0)return false;
 if(p.state!=='AIRBORNE'&&p.state!=='FALLING'){
  catchQueuedUntil=-1;return false;
 }
 if(elapsed>catchQueuedUntil){
  catchQueuedUntil=-1;
  hint('AXE MISSED THE RIM',.85);
  return false;
 }
 const hit=axeCatchOpportunity(true);
 if(hit)return axeLatch(hit);
 return false;
}
function axeCatchStrike(side){
 if(p.state!=='HANGING'||!p.catchLedge||![-1,1].includes(side))return false;
 const c=p.catchLedge;
 if(c.lastSide===side)return false;
 const gap=elapsed-c.lastStrikeAt;
 // Four genuine alternating key edges, not sub-frame macro spam.
 if(gap<.085)return false;
 if(gap>.85&&c.strokes>0)c.strokes=0;
 c.lastSide=side;c.strokes++;c.lastStrikeAt=elapsed;
 haptic(5);
 if(c.strokes>=4){
  const surface=platforms.find(pl=>pl.id===c.id);
  if(!surface){p.state='FALLING';p.catchLedge=null;return false;}
  p.x=c.side>0?surface.left+12:surface.right-12;
  p.y=surface.top-22;p.vx=0;p.vy=0;
  p.standingOn=surface.id;p.state='GROUNDED';p.groundedFor=.35;
  p.catchLedge=null;getLanding(surface);
  hint('EDGE RECOVERED — CLIMB ON',1.8);
  haptic([12,32,24]);return true;
 }
 hint('AXE HOLD — '+c.strokes+' / 4 · ALTERNATE A / D',.8);
 return true;
}
function updateHanging(dt){
 if(p.state!=='HANGING'||!p.catchLedge)return false;
 const c=p.catchLedge,pl=platforms.find(x=>x.id===c.id);
 if(!pl||elapsed-c.caughtAt>2.8){
  p.state='FALLING';p.vy=45;p.vx=c.side*-55;
  p.standingOn=null;p.catchLedge=null;
  hint('GRIP LOST',.9);
  return true;
 }
 p.y=pl.top+18;p.x=c.side>0?pl.left-20:pl.right+20;
 p.vx=0;p.vy=0;
 return true;
}
