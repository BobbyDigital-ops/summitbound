// Summitbound v0.34 — state-driven animated illustrated sprite, replacing
// the rigid four-frame cadence with physically paced poses and stance movement.
// The original 12-pose atlas is reused; no physics or collision edits.
const climberAtlasV033=new Image();
climberAtlasV033.src='/game/assets/climber-v033-sprites.svg';
const CLIMBER_POSES=Object.freeze({idle:0,runA:1,runB:2,runC:3,runD:4,plant:5,launch:6,flight:7,reach:8,hang:9,pullup:10,climb:11});
function spritePoseFor(p){
 if(p.state==='HANGING')return CLIMBER_POSES.hang;
 if(p.state==='CLIMBING')return CLIMBER_POSES.climb;
 if(p.state==='RIDING_VAULT')return p.vault?.elapsed/p.vault?.rideDuration>.48?CLIMBER_POSES.launch:CLIMBER_POSES.plant;
 if(p.state==='AIRBORNE'||p.state==='FALLING'){
  return (p.vy>=-25&&typeof axeCatchApproach==='function'&&axeCatchApproach(true))?
   CLIMBER_POSES.reach:CLIMBER_POSES.flight;
 }
 if(Math.abs(p.vx)>25&&p.standingOn){
  // The gait is measured by real distance, never frame count or browser FPS.
  const phase=(p.runDistance||0)/32;
  return CLIMBER_POSES.runA+(Math.floor(phase)%4+4)%4;
 }
 return CLIMBER_POSES.idle;
}
function drawSpriteMountaineer(g,p){
 if(!climberAtlasV033.complete||!climberAtlasV033.naturalWidth)return false;
 const pose=spritePoseFor(p),running=pose>=1&&pose<=4;
 const gait=(p.runDistance||0)/32*Math.PI*.5;
 const speed=Math.min(1,Math.abs(p.vx||0)/Math.max(1,cfg.maxRunSpeed));
 const airborne=p.state==='AIRBORNE'||p.state==='FALLING';
 const reach=pose===CLIMBER_POSES.reach;
 g.save();
 if(running){
  // Compression, counter-rotation and bounce add a visible full-body stride.
  // The atlas supplies distinctly posed arms and legs; this transform
  // animates the centre of mass without altering foot/collision positions.
  g.translate(0,-1.9*Math.max(0,Math.sin(gait*2))*speed);
  g.rotate((.055+.025*speed)+Math.sin(gait)*.027*speed);
  g.translate(0,1.5*Math.sin(gait)*speed);
 } else if(airborne) {
  // Flight becomes visibly prone while the axe reaches ahead.
  g.translate(reach?13:4,reach?-19:-6);
  g.rotate(reach?-.34:-.13);
 } else if(p.state==='RIDING_VAULT') {
  const u=p.vault?.elapsed/p.vault?.rideDuration||0;
  g.rotate(-.05-Math.min(1,u)*.35);
 } else if(p.state==='HANGING'){
  g.translate(0,2*Math.sin((p.catchLedge?.strokes||0)*2));
 }
 g.drawImage(climberAtlasV033,pose*96,0,96,120,-40,-100,80,105);
 if(reach){
  // Leading pick and impact point are independent of the torso's art.
  // The visible hit-box cue points in the same facing direction as the
  // real axeCatchApproach() calculation; no visual rear-facing grab.
  g.strokeStyle='#22323d';g.lineWidth=4;g.lineCap='round';
  g.beginPath();g.moveTo(21,-62);g.lineTo(55,-79);g.stroke();
  g.strokeStyle='#c2dbdf';g.lineWidth=3;
  g.beginPath();g.moveTo(45,-85);g.quadraticCurveTo(60,-90,70,-82);
  g.lineTo(63,-76);g.stroke();
 }
 g.restore();
 return true;
}
