/* v18: true tenfold rock gaps plus explicitly modelled long-vault flight.
 * Preserves the original pole bending, plant, release timing and character.
 * Rebalances only the POST-release airborne phase in the modular route;
 * the original five-peaks game and the classic modular mode remain unchanged.
 */
(function(root){
'use strict';
const TENFOLD=10;
function transform(base,multiplier=TENFOLD){
 if(!base?.peaks||base.peaks.length<2||!Array.isArray(base.crossings))
  throw Error('Certified modular course required');
 if(!Number.isFinite(multiplier)||multiplier<1||multiplier>10)
  throw Error('Unsupported playable gap scale');
 const peaks=base.peaks.map(p=>({...p})),crossings=[];
 let advance=0;
 for(let i=0;i<peaks.length;i++){
  if(i)advance+=base.crossings[i-1].gap*(multiplier-1);
  peaks[i].worldX=base.peaks[i].worldX+advance;
 }
 for(let i=0;i<base.crossings.length;i++){
  const c=base.crossings[i],f=c.flight;
  if(!f||!c.flightSampleVerified)throw Error('Cannot extend uncertified vault '+i);
  const baseDx=f.landingX-f.releaseX;
  if(!Number.isFinite(baseDx)||baseDx<120)throw Error('Invalid flight distance at '+i);
  const shift=c.gap*(multiplier-1);
  const stretch=1+shift/baseDx;
  const timeScale=Math.sqrt(stretch);
  // vx multiplied by timeScale and vertical velocity divided by timeScale.
  // Gravity divided by timeScale² => same aerial height and a longer arc.
  // This is a genuine, disclosed change to long-mode airborne physics.
  const flight={...f,longTimeScale:timeScale,longRangeScale:stretch,
   originalLandingX:f.landingX,landingX:f.landingX+shift,
   originalReleaseX:f.releaseX,verticalGravityScale:1/(timeScale*timeScale)};
  crossings.push({...c,baselineGap:c.gap,gap:c.gap*multiplier,flight,
   flightSampleVerified:false, // preflight proof is not a game-play cert!
   longPhysicsModel:'time-scaled arc; long horizontal release impulse'});
 }
 const course={...base,peaks,crossings,gap:base.gap*multiplier,
  gaps:crossings.map(c=>c.gap),gapScale:multiplier,baselineSeed:base.seed,
  standingStartCertified:false,fullGameplayCertified:false,
  physicsSampled:false,longMode:true};
 const validity=audit(course);
 if(!validity.valid)throw Error('Invalid long course: '+validity.errors.join('; '));
 course.audit=validity;return course;
}
function audit(course){
 const errors=[],p=course?.peaks||[],c=course?.crossings||[];
 if(p.length<2||c.length!==p.length-1)errors.push('disconnected peaks');
 for(let i=0;i<c.length;i++){
  const leg=c[i],f=leg.flight;
  const actual=(p[i+1].worldX+p[i+1].bounds.left)-(p[i].worldX+p[i].bounds.right);
  if(Math.abs(actual-leg.gap)>1e-6)errors.push('physical gap mismatch '+i);
  if(leg.gap!==leg.baselineGap*course.gapScale)errors.push('wrong multiplier '+i);
  if(!f||f.longTimeScale<=1||!Number.isFinite(f.longTimeScale))errors.push('bad long physics '+i);
  const landing=p[i+1].platforms.find(z=>z.id===leg.targetPlatform);
  if(!landing||landing.kind!=='scaffold')errors.push('lost landing collider '+i);
  const plannedX=p[i].worldX+f.landingX;
  if(landing&&(plannedX<p[i+1].worldX+landing.left+3||
     plannedX>p[i+1].worldX+landing.right-3))errors.push('long touchdown misses landing '+i);
  if(leg.flightSampleVerified)errors.push('long mode falsely certified '+i);
 }
 return {valid:errors.length===0,errors,peaks:p.length,crossings:c.length,gaps:c.map(z=>z.gap),
  physics:'long-mode time-scaled post-release flight, retains original pole'};
}
const API=Object.freeze({TENFOLD,transform,audit});
if(typeof module==='object'&&module.exports)module.exports=API;
else root.SpireLongGapV18=API;
})(typeof globalThis!=='undefined'?globalThis:this);
