// Summitbound sprite-sheet animation v0.33. Actual illustrated SVG atlas asset.
// Draw only once per frame. No procedural body-part painting at runtime.
const climberAtlasV033=new Image();
climberAtlasV033.src='/game/assets/climber-v033-sprites.svg';
const CLIMBER_POSES=Object.freeze({idle:0,runA:1,runB:2,runC:3,runD:4,plant:5,launch:6,flight:7,reach:8,hang:9,pullup:10,climb:11});
function spritePoseFor(p){
 if(p.state==='HANGING')return CLIMBER_POSES.hang;
 if(p.state==='CLIMBING')return CLIMBER_POSES.climb;
 if(p.state==='RIDING_VAULT')return p.vault?.elapsed/p.vault?.rideDuration>.48?CLIMBER_POSES.launch:CLIMBER_POSES.plant;
 if(p.state==='AIRBORNE'||p.state==='FALLING'){
  // The axe arm projects into the direction of travel on a descending
  // ledge approach; idle flight has a separate stretched body pose.
  return (p.vy>0&&typeof axeCatchApproach==='function'&&axeCatchApproach(true))?
    CLIMBER_POSES.reach:CLIMBER_POSES.flight;
 }
 if(Math.abs(p.vx)>30&&p.standingOn){
  const cycle=Math.floor((p.runDistance||0)/22)%4;
  return CLIMBER_POSES.runA+((cycle+4)%4);
 }
 return CLIMBER_POSES.idle;
}
function drawSpriteMountaineer(g,p){
 if(!climberAtlasV033.complete||!climberAtlasV033.naturalWidth)return false;
 const idx=spritePoseFor(p);
 // This is called with the canvas already translated to player feet;
 // aligned to the original 78x100 gameplay footprint.
 g.drawImage(climberAtlasV033,idx*96,0,96,120,-40,-100,80,105);
 return true;
}
