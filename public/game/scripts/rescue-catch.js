// THE REFORGE — one deliberate, unforgiving axe catch per airborne vault.
// Physical tip must touch the exposed landing rim; no magnetic rescue,
// no extension of horizontal range, no multiple presses / auto-grabs.
let catchUsed=false;
function axeCatchOpportunity(){
 if((p.state!=='AIRBORNE'&&p.state!=='FALLING')||
     p.vy<24||catchUsed)return null;
 const forward=p.facingDir>=0?1:-1,tipX=p.x+forward*20;
 const surfaces=platforms.filter(s=>
  ['summit','ledge','arrival'].includes(s.kind));
 const contacts=surfaces.map(pl=>{
  const edge=forward>0?pl.left:pl.right;
  const dx=forward*(edge-tipX); // Positive distance ahead of the axe
  const dy=p.y-pl.top;          // Hanging just below the platform rim
  const within=dx>=-7&&dx<=21&&dy>=8&&dy<=33;
  return within?{pl,edge,dx,dy,score:Math.abs(dx-5)+Math.abs(dy-18)}:null;
 }).filter(Boolean).sort((a,b)=>a.score-b.score);
 return contacts[0]||null;
}
function attemptAxeCatch(){
 if(p.state!=='AIRBORNE'&&p.state!=='FALLING')return false;
 if(catchUsed)return false;
 const found=axeCatchOpportunity();
 catchUsed=true; // Even a badly timed press expends the ONE attempt.
 if(!found){hint('MISSED THE ROCK — NO SECOND THROW',.9);return false;}
 const pl=found.pl,face=p.facingDir>=0?1:-1;
 p.state='HANGING';p.vx=0;p.vy=0;
 p.x=face>0?pl.left-20:pl.right+20;
 p.y=pl.top+18;p.standingOn=null;
 p.catchLedge={id:pl.id,side:face,strokes:0,lastSide:0,
  caughtAt:elapsed,lastStrikeAt:-100,edge:found.edge};
 hint('AXE BITE! ALTERNATE A / D TO HAUL UP',2);
 haptic([23,32,12]);return true;
}
function axeCatchStrike(side){
 if(p.state!=='HANGING'||!p.catchLedge||![-1,1].includes(side))return false;
 const c=p.catchLedge;
 if(c.lastSide===side)return false;
 const gap=elapsed-c.lastStrikeAt;
 // Fast rhythm is rewarded, but sub-frame keyboard spam and alternating
 // several actions in one physics tick cannot finish a rescue instantly.
 if(gap<.085)return false;
 if(gap>.85&&c.strokes>0)c.strokes=0;
 c.lastSide=side;c.strokes++;c.lastStrikeAt=elapsed;
 haptic(5);
 if(c.strokes>=4){
  const surface=platforms.find(pl=>pl.id===c.id);
  if(!surface){p.state='FALLING';p.catchLedge=null;return false;}
  // Pull over the exact edge where the axe contacted real rock.
  // There must be room for the body on this solid collision interval.
  p.x=c.side>0?surface.left+12:surface.right-12;
  p.y=surface.top-22;p.vx=0;p.vy=0;
  p.standingOn=surface.id;p.state='GROUNDED';p.groundedFor=.35;
  p.catchLedge=null;
  getLanding(surface);
  hint('RECOVERY — YOU EARNED THAT LEDGE',2.3);
  haptic([12,32,24]);return true;
 }
 return true;
}
function updateHanging(dt){
 if(p.state!=='HANGING'||!p.catchLedge)return false;
 const c=p.catchLedge;
 const pl=platforms.find(x=>x.id===c.id);
 if(!pl||elapsed-c.caughtAt>2.6){
  p.state='FALLING';p.vy=45;p.vx=c.side*-55;
  p.standingOn=null;p.catchLedge=null;
  hint('GRIP LOST',.9);
  return true;
 }
 p.y=pl.top+18;p.x=c.side>0?pl.left-20:pl.right+20;
 p.vx=0;p.vy=0;return true;
}
