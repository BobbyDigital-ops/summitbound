/* Summitbound v17 — genuine world-coordinate gap spacing visual experiment.
 * Never alters the original playable course or player physics.  A newly
 * positioned course is returned with crossing flight certifications cleared.
 */
(function(root){
'use strict';
const BASE_GAPS=Object.freeze([90,150,210,270,330,390,450,510,570,630]);
const TENFOLD_GAPS=Object.freeze(BASE_GAPS.map(g=>g*10));
function layout(source,presetId=1,multiplier=10){
 if(!source||!Array.isArray(source.peaks)||source.peaks.length<2)
  throw Error('A generated course with at least two real spires is required');
 if(!Number.isInteger(presetId)||presetId<1||presetId>10)throw Error('Invalid gap preset');
 if(!Number.isFinite(multiplier)||multiplier<=0||multiplier>10)
  throw Error('Gap multiplier must be between 0 and 10');
 const standard=BASE_GAPS[presetId-1],desired=standard*multiplier;
 const peaks=source.peaks.map((q,i)=>({...q,worldX:i===0?q.worldX:0}));
 for(let i=1;i<peaks.length;i++){
  // These are physical outer ROCK bounds, not platform/scaffold distances.
  // Moving spires moves their visual render, colliders and climbing routes
  // together. A preview does not inject a longer pole or a landing magnet.
  peaks[i].worldX=peaks[i-1].worldX+peaks[i-1].bounds.right
    -peaks[i].bounds.left+desired;
 }
 const crossings=peaks.slice(1).map((q,j)=>({
  from:j,to:j+1,gapPreset:presetId,gap:desired,
  physicallyReachable:false,flightSampleVerified:false,
  status:'visual-only: original pole dynamics cannot certify 10x gaps'
 }));
 const result={
  schema:'summitbound.gap-spacing-preview.v17',
  visualOnly:true,physicallyReachable:false,preset:presetId,
  standardGap:standard,multiplier,desiredGap:desired,
  seed:source.seed,peaks,crossings
 };
 const check=audit(result);
 if(!check.valid)throw Error('Invalid preview layout: '+check.errors.join('; '));
 return result;
}
function audit(result){
 const errors=[],p=result?.peaks||[],cs=result?.crossings||[];
 if(p.length<2||cs.length!==p.length-1)errors.push('invalid spire count');
 for(let i=0;i<cs.length;i++){
  const expected=cs[i].gap;
  const measured=(p[i+1].worldX+p[i+1].bounds.left)-(p[i].worldX+p[i].bounds.right);
  if(Math.abs(expected-measured)>1e-6)errors.push('gap mismatch '+i);
  if(expected<=0)errors.push('overlapping spires '+i);
  if(cs[i].flightSampleVerified!==false||cs[i].physicallyReachable!==false)
   errors.push('preview must never be gameplay-certified '+i);
 }
 return {valid:errors.length===0,errors,gaps:cs.map(c=>c.gap),peakCount:p.length};
}
const API=Object.freeze({BASE_GAPS,TENFOLD_GAPS,layout,audit});
if(typeof module==='object'&&module.exports)module.exports=API;
else root.SpireGapScaleV17=API;
})(typeof globalThis!=='undefined'?globalThis:this);
