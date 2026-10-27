// Summitbound v0.13 — physical pole swing and directional spring release.
// This module replaces ONLY the playable vault. Frozen archived route samples
// retain the original physics for the historical 997-route reference suite.
(() => {
 const classicInit=PolePhysicsEngine.initVault;
 const classicStep=PolePhysicsEngine.stepVault;
 const classicRelease=PolePhysicsEngine.calculateReleaseVelocity;

 const grip=(state,u)=>{
  const a=clamp(u,0,1.35);
  const theta=.22+2.05*a;
  const unload=clamp((a-.28)/.57,0,1);
  const smooth=unload*unload*(3-2*unload);
  const radius=state.startRadius-12*Math.sin(Math.PI*clamp(a/.56,0,1))+64*smooth;
  return {x:state.anchorX-radius*Math.cos(theta)-3,
          y:state.anchorY-radius*Math.sin(theta)+5,theta,radius};
 };

 PolePhysicsEngine.initVault=function(px,py,vx,vy,ax,ay,config){
  const state=classicInit.call(this,px,py,vx,vy,ax,ay,config);
  state.startRadius=Math.hypot(px+3-ax,py-5-ay);
  return state;
 };

 PolePhysicsEngine.stepVault=function(state,dt,config){
  if(config.archivedArcadePhysics===true)
   return classicStep.call(this,state,dt,config);
  const elapsed=state.elapsed+dt,u=elapsed/state.rideDuration;
  const pose=grip(state,u);
  const next=grip(state,Math.min(u+.002,1.35));
  const prior=grip(state,Math.max(0,u-.002));
  const vx=(next.x-prior.x)/(.004*state.rideDuration);
  const vy=(next.y-prior.y)/(.004*state.rideDuration);
  const load=clamp(u/.34,0,1)*Math.max(0,1-clamp((u-.35)/.68,0,1));
  const deformationPx=Math.max(0,config.poleLength-pose.radius)*load;
  const strain=clamp(deformationPx/Math.max(1,config.poleLength*config.maxDeformation),0,1);
  const update={...state,elapsed,theta:pose.theta,radius:pose.radius,strain,
   deformationPx,bendOffset:deformationPx*.8,
   storedEnergy:.5*config.poleStiffness*deformationPx*deformationPx,
   springForce:config.poleStiffness*deformationPx,
   tangentialVelocity:Math.hypot(vx,vy),
   phase:u<.3?'LOADING':u<.55?'MAX_FLEX':u<=1.02?'RECOILING':'UNCOILED',
   heightGained:Math.max(0,state.startPy-pose.y),
   distanceTraveled:Math.max(0,pose.x-state.startPx)};
  return {state:update,nextPx:pose.x,nextPy:pose.y,nextVx:vx,nextVy:vy,
   shouldAutoRelease:u>=1.18};
 };

 PolePhysicsEngine.calculateReleaseVelocity=function(vx,vy,state,config){
  if(config.archivedArcadePhysics===true)
   return classicRelease.call(this,vx,vy,state,config);
  const ratio=clamp(state.facingDir*state.initialVx/Math.max(1,config.maxRunSpeed),0,1);
  const u=state.elapsed/state.rideDuration;
  const theta=.22+2.05*u;
  // Momentum feeds a spring. Early release throws higher; later release
  // follows the pole round for a long, lower arc; overholding bleeds power.
  const charge=clamp((u-.07)/.19,0,1);
  const collapse=Math.max(.04,1-clamp((u-1.0)/.19,0,1)*.96);
  const energy=(230+590*Math.pow(ratio,1.6))*charge*collapse;
  return {
   vx:state.facingDir*energy*Math.sin(theta)*(config.arcadeRange??1),
   vy:-energy*Math.cos(theta)*(config.arcadeLift??1)+
     config.gravity*.25*Math.max(0,state.elapsed-state.rideDuration)
  };
 };
})();
