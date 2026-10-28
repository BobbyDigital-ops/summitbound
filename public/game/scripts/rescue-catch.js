// SUMMITBOUND v0.30 — TRUE EDGE CATCH
// A deliberate throw at an exposed collision rim, without auto aim, a
// platform magnet, unlimited retries or scripted shortcut teleports.
// The short input buffer accommodates human perception + mobile touch latency
// but still requires physical contact with the actual ledge edge.
let catchUsed=false;
let catchQueuedUntil=-1;
const AXE_WINDOW=Object.freeze({behind:25,ahead:70,above:-12,below:72,
 warningAhead:150,warningAbove:53,warningBelow:98,bufferSeconds:.4});
function axeCatchApproach(ignoreUsed=false){
 if((p.state!=='AIRBORNE'&&p.state!=='FALLING')||
   p.vy<0||(!ignoreUsed&&catchUsed))return null;
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
 // Prioritise a catchable ledge over a nearer but non-catchable rim.
 near.sort((a,b)=>Number(b.ready)-Number(a.ready)||a.score-b.score);
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
 hint('AXE SET! ALTERNATE A / D THREE TIMES',2.4);
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
 if(near&&!near.ready&&near.dx>=-AXE_WINDOW.behind-12&&
    near.dx<=AXE_WINDOW.warningAhead&&
    near.dy>=-AXE_WINDOW.warningAbove&&
    near.dy<=AXE_WINDOW.warningBelow){
  catchQueuedUntil=elapsed+Math.max(.55,AXE_WINDOW.bufferSeconds);
  hint('AXE THROWN — REACH FOR THE ROCK',.8);
  haptic(9);
  return false;
 }
 // An out-of-range button press should NOT permanently burn the only
 // rescue attempt; the deliberate, ledge-proximate swing still is one-shot.
 catchUsed=false;
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
 if(gap>1.5&&c.strokes>0)c.strokes=0;
 c.lastSide=side;c.strokes++;c.lastStrikeAt=elapsed;
 haptic(5);
 if(c.strokes>=3){
  const surface=platforms.find(pl=>pl.id===c.id);
  if(!surface){p.state='FALLING';p.catchLedge=null;return false;}
  // Commit the catch now, but keep the climber visually attached to the rim
  // until the mantle has actually reached the platform.
  p.mantle={surfaceId:surface.id,fromX:p.x,fromY:p.y,
   toX:c.side>0?surface.left+12:surface.right-12,toY:surface.top-22,
   side:c.side,elapsed:0,duration:.95};
  p.state='PULLING_UP';p.standingOn=null;p.vx=0;p.vy=0;
  p.catchLedge=null;
  hint('PULLING UP!',1.05);
  haptic([12,32,24]);return true;
 }
 hint('AXE HOLD — '+c.strokes+' / 3 · ALTERNATE A / D',.8);
 return true;
}
function updateHanging(dt){
 if(p.state!=='HANGING'||!p.catchLedge)return false;
 const c=p.catchLedge,pl=platforms.find(x=>x.id===c.id);
 if(!pl||elapsed-c.caughtAt>4.5){
  p.state='FALLING';p.vy=45;p.vx=c.side*-55;
  p.standingOn=null;p.catchLedge=null;
  hint('GRIP LOST',.9);
  return true;
 }
 p.y=pl.top+18;p.x=c.side>0?pl.left-20:pl.right+20;
 p.vx=0;p.vy=0;
 return true;
}

function updatePullUp(dt){
 if(p.state!=='PULLING_UP'||!p.mantle)return false;
 const m=p.mantle,pl=platforms.find(q=>q.id===m.surfaceId);
 if(!pl){p.state='FALLING';p.mantle=null;return true;}
 m.elapsed=Math.min(m.duration,m.elapsed+dt);
 const t=m.elapsed/m.duration;
 // First hoist the shoulders, then shift weight horizontally over the lip.
 const smooth=t*t*(3-2*t);
 const up=t<.72?(t/.72)**.85:1;
 const over=t<.26?0:((t-.26)/.74)**1.35;
 p.x=m.fromX+(m.toX-m.fromX)*Math.min(1,over);
 p.y=m.fromY+(m.toY-m.fromY)*up;
 p.vx=0;p.vy=0;p.standingOn=null;
 if(t>=1){
  p.x=m.toX;p.y=m.toY;p.state='GROUNDED';
  p.mantle=null;p.standingOn=pl.id;p.groundedFor=.35;
  getLanding(pl);
  hint('EDGE RECOVERED',1.2);
 }
 return true;
}
