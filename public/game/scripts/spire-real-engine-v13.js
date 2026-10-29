/* Summitbound v13: REAL original-engine terrain adapter.
 * Owns DATA ONLY, route mapping, and rock art. All character drawing,
 * run/air/vault physics, player state, camera and input are the existing
 * rendering.js, simulation.js, game-state.js, input-ui.js, v036 rig.
 *
 * Loaded AFTER game-state.js, BEFORE simulation.js. Never enabled by default
 * in the published Five Peaks entrypoint.
 */
const SummitIntegrated=(()=>{
 'use strict';
 const active=true;
 const X_SHIFT=700,Y_SHIFT=2400;
 let course=null,foundations=null,platformRoutes=new Map(),routes=[];
 let setupError=null;
 // Static rock, scaffold, ice and foundation art is rasterised once per
 // selected seed. Do not repaint hundreds of mineral strokes every frame.
 const staticPaint=new Map();
 const MAX_RASTER_MOUNTAINS=3; // Bound offscreen cached terrain on Android.

 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const platformId=(i,local)=>local==='departure'?'s'+i:
   'l'+i+'-'+Number(local.split('-').at(-1));
 function deck(p,i){
  const d=p.departure;
  return platform('s'+i,p.worldX+d.left,p.worldX+d.right,
   p.worldY+d.y,'rock',{kind:'summit',spire:i,tier:'Departure',modular:true});
 }
 function install(seed=42,preset=1){
  const original=SpireCourseV11.build(seed,{count:5,preset,varyGaps:true},{
   assemble:SpireAssemblyV10.assemble,physics:PolePhysicsEngine,config:cfg
  });
  course={...original,peaks:original.peaks.map(q=>({
   ...q,worldX:q.worldX+X_SHIFT,worldY:q.worldY+Y_SHIFT
  }))};
  foundations=SpireFoundationsV12.build(course);
  const validation=SpireFoundationsV12.inspect(course,foundations);
  if(!validation.valid)throw Error('Foundation invalid: '+validation.errors.join('; '));
  staticPaint.clear();
  routes=[];platformRoutes=new Map();platforms.length=0;
  for(let i=0;i<5;i++){
   const q=course.peaks[i];
   if(!q){
    spires[i].cave=null;spires[i].ridgeArrival=null;spires[i].ridgeCrux=null;
    spires[i].ledges=[];spires[i].summit=[-10000,-9900,4000,'rock'];
    continue;
   }
   const d=deck(q,i);platforms.push(d);
   spires[i].summit=[d.left,d.right,d.top,'rock'];
   spires[i].ledges=[];spires[i].ridgeArrival=null;
   spires[i].ridgeCrux=null;spires[i].cave=null;spires[i].moduleAssembly=null;
   for(let j=0;j<q.platforms.length;j++){
    const a=q.platforms[j],l=platform('l'+i+'-'+j,
     q.worldX+a.left,q.worldX+a.right,q.worldY+a.y,
     a.kind==='scaffold'?'rock':'ice',{kind:'ledge',spire:i,tier:a.kind==='scaffold'?'Scaffold':'Rock',modular:true,scaffold:a.kind==='scaffold'});
    platforms.push(l);
    spires[i].ledges.push([l.left,l.right,l.top,l.surfaceType,l.tier]);
   }
   for(const r of q.routes){
    const from=platformId(i,r.source),target=platformId(i,r.target);
    const entry={
     ...r,id:'r'+i+'-'+r.id,spire:i,source:from,target,
     x:q.worldX+r.x,fromY:q.worldY+r.fromY,toY:q.worldY+r.toY
    };
    routes.push(entry);platformRoutes.set(from,entry);
   }
  }
  const name=document.getElementById('routeLabel');
  if(name)name.textContent='REAL ENGINE · '+course.peaks.length+' SPIRES · GAPS '+course.gaps.join(' / ');
  invalidateTerrainCache();
  return course;
 }
 function startX(stage,pl){
  if(course?.crossings?.[stage]?.flight){
   const flight=course.crossings[stage].flight;
   return course.peaks[stage].worldX+flight.runStartX;
  }
  return clamp(pl.left+13,pl.left+8,pl.right-124);
 }
 function climbEntry(pl){return platformRoutes.get(pl?.id)?.x??-999}
 function beginClimb(pl){
  const r=platformRoutes.get(pl.id);if(!r||Math.abs(p.x-r.x)>39)return false;
  p.state='CLIMBING';p.x=r.x;p.vx=0;p.vy=0;p.standingOn=null;
  p.climb={modular:true,route:r,source:r.source,target:r.target,spire:r.spire,
   originX:r.x,originY:r.fromY-22,targetY:r.toY-22,
   isIce:r.kind==='ice',climbBeat:0,lastAxe:0,lastAxeAt:-100,pulse:0,
   axeHits:0,reverse:false};
  hint(r.kind==='ice'?'VERTICAL ICE — ALTERNATE A / D OR HOLD W':'LADDER — HOLD W',2);
  return true;
 }
 function down(){
  const pl=currentPlatform();if(!pl)return false;
  const r=routes.filter(q=>q.target===pl.id&&Math.abs(p.x-q.x)<32)
   .sort((a,b)=>b.fromY-a.fromY)[0];
  if(!r)return false;
  p.state='CLIMBING';p.x=r.x;p.y=r.toY-22;p.vx=0;p.vy=0;p.standingOn=null;
  p.climb={modular:true,route:r,source:r.source,target:r.target,spire:r.spire,
   originX:r.x,originY:r.fromY-22,targetY:r.toY-22,isIce:r.kind==='ice',
   climbBeat:0,lastAxe:0,lastAxeAt:-100,pulse:0,axeHits:0,reverse:true};
  hint('HOLD DOWN TO DESCEND · UP TO REVERSE',2);
  return true;
 }
 function settle(id){
  const pl=platforms.find(s=>s.id===id);
  if(!pl)throw Error('Climb landed on absent platform '+id);
  p.y=pl.top-22;p.x=clamp(p.x,pl.left+3,pl.right-3);
  p.state='GROUNDED';p.standingOn=id;p.surface=pl.surfaceType;
  p.vx=0;p.vy=0;p.climb=null;p.groundedFor=.4;
  hint(pl.kind==='summit'?'ORANGE DEPARTURE DECK REACHED':'MOUNTAIN ROUTE CONNECTED',1.6);
  if(id==='s'+(course.peaks.length-1))finish();
 }
 function tickClimb(dt,k){
  const c=p.climb;if(!c?.modular)return false;
  const previous=p.y;
  if(c.isIce)p.y=clamp(p.y+iceClimbDisplacement(c,k,dt),c.targetY,c.originY);
  else if(k.up&&!k.down)p.y=Math.max(c.targetY,p.y-116*dt);
  else if(k.down&&!k.up)p.y=Math.min(c.originY,p.y+116*dt);
  p.x=c.route.x;c.climbBeat+=(previous-p.y)/24;
  if(p.y<=c.targetY+.25&&(k.up||(!c.reverse&&previous>p.y))){settle(c.target);return true}
  if(p.y>=c.originY-.25&&k.down){settle(c.source);return true}
  return true;
 }
 function finish(){
  completed=true;p.state='GROUNDED';p.vx=0;p.vy=0;
  document.getElementById('victoryText').textContent=
   'Five modular spires completed using the ORIGINAL Summitbound engine, v036 character, pole physics and camera.';
  document.getElementById('victory').classList.add('open');
  hint('FIVE-SPIRE ASCENT COMPLETE',5);
 }
 function onLanding(pl){if(pl.id==='s'+(course.peaks.length-1))finish()}
 function onFail(){
  const retry=typeof practiceTakeoff!=='undefined'?practiceTakeoff:null;
  if(retry&&retry.platformId&&platforms.some(pl=>pl.id===retry.platformId)){
   const pl=platforms.find(x=>x.id===retry.platformId);
   spawn(pl.spire,true);
   p.standingOn=pl.id;p.x=startX(pl.spire,pl);p.y=pl.top-22;
   p.surface=pl.surfaceType;hint('MISSED JUMP — RETRY FROM TAKEOFF',2);return true;
  }
  spawn(Math.max(0,Math.min(course.peaks.length-2,lastSafeStage||0)),true);hint('MISSED MOUNTAIN — RETRY',2);return true;
 }
 // Solid exterior contact is read from the SAME polygon edges used by the
 // renderer. A three-height sweep covers the player's head, torso and boots;
 // painted foundations remain scenic until subterranean collision is authored.
 let sideHits=0;
 function solidSideCollision(previousX){
  if(!['AIRBORNE','FALLING'].includes(p.state))return false;
  const feet=p.y+22,halfWidth=10;
  for(let i=0;i<course.peaks.length;i++){
   const q=course.peaks[i];
   if(p.x<q.worldX+q.bounds.left-60||p.x>q.worldX+q.bounds.right+60)continue;
   // A genuine scaffold or ledge needs an open approach; never substitute
   // a ghost wall over a walkable top collider.
   const landingCorridor=platforms.some(pl=>pl.spire===i&&
     Math.abs(feet-pl.top)<65&&p.x>=pl.left-45&&p.x<=pl.right+45);
   if(landingCorridor)continue;
   const samples=[feet,feet-19,feet-38];
   for(const sampleY of samples){
    const localY=sampleY-q.worldY;
    const sections=q.pieces.map(piece=>
      localY>=piece.offsetY-piece.height&&localY<=piece.offsetY
       ?SpireAssemblyV10.edgeAt(piece,localY):null).filter(Boolean);
    if(!sections.length)continue;
    const left=q.worldX+Math.min(...sections.map(z=>z.left));
    const right=q.worldX+Math.max(...sections.map(z=>z.right));
    const enteringLeft=previousX+halfWidth<=left&&p.x+halfWidth>left&&p.x<right;
    const enteringRight=previousX-halfWidth>=right&&p.x-halfWidth<right&&p.x>left;
    if(!enteringLeft&&!enteringRight)continue;
    p.x=enteringLeft?left-halfWidth:right+halfWidth;
    p.vx=enteringLeft?-Math.abs(p.vx)*.18:Math.abs(p.vx)*.18;
    p.vy=Math.max(p.vy,60);sideHits++;
    if(messageTimeout<.6)hint('ROCK FACE — AIM FOR A REAL LEDGE',1.4);
    return true;
   }
  }
  return false;
 }
 function paintCache(i){
  const q=course.peaks[i],background=foundations.foundations.filter(f=>f.spire===i);
  const left=Math.floor(q.worldX+q.bounds.left-8);
  const right=Math.ceil(q.worldX+q.bounds.right+8);
  const top=Math.floor(q.worldY+q.bounds.top-8);
  const bottom=Math.ceil(Math.max(q.worldY+q.bounds.bottom,foundations.floor)+8);
  const width=Math.max(1,right-left),height=Math.max(1,bottom-top);
  // Canvas dimensions are intentionally bounded so older Android GPUs do
  // not allocate enormous bitmaps for unusually tall generated mountains.
  if(width>2048||height>4096)return null;
  const canvas=document.createElement('canvas');
  canvas.width=width;canvas.height=height;
  const g=canvas.getContext('2d');
  if(!g)return null;
  g.translate(-left,-top);
  SpireFoundationsV12.draw(g,{foundations:background},SpireRenderV10);
  g.save();g.translate(q.worldX,q.worldY);
  SpireRenderV10.draw(g,q,{clear:false});g.restore();
  return {image:canvas,left,top,width,height};
 }
 function drawTerrain(g){
  const visibleLeft=camera.x-80,visibleRight=camera.x+innerWidth/getZoom()+80;
  for(let i=0;i<course.peaks.length;i++){
   const q=course.peaks[i];
   if(q.worldX+q.bounds.right<visibleLeft||q.worldX+q.bounds.left>visibleRight)continue;
   if(!staticPaint.has(i)){
    const bitmap=paintCache(i);
    if(bitmap){
     while(staticPaint.size>=MAX_RASTER_MOUNTAINS)
      staticPaint.delete(staticPaint.keys().next().value);
     staticPaint.set(i,bitmap);
    }
   }else{
    // Least-recently-used: do not evict the currently visible mountains.
    const bitmap=staticPaint.get(i);staticPaint.delete(i);staticPaint.set(i,bitmap);
   }
   const chunk=staticPaint.get(i);
   if(chunk)g.drawImage(chunk.image,chunk.left,chunk.top,chunk.width,chunk.height);
   else{
    // Safety fallback for unsupported canvas sizes.
    SpireFoundationsV12.draw(g,{foundations:foundations.foundations.filter(f=>f.spire===i)},SpireRenderV10);
    g.save();g.translate(q.worldX,q.worldY);SpireRenderV10.draw(g,q,{clear:false});g.restore();
   }
  }
 }
 function claim(){return {active,seed:course?.seed,gap:course?.gap,peaks:course?.peaks.length,
  platforms:platforms.filter(x=>x.modular).length,routes:routes.length,
  physics:'original simulation.js + PolePhysicsEngine',character:'original rendering.js + character-rig-v036.js',
  foundationCollision:'background-only',cachedRasterMountains:staticPaint.size,
  cachedRasterBytes:[...staticPaint.values()].reduce((sum,c)=>sum+c.width*c.height*4,0),
  maxCachedRasterMountains:MAX_RASTER_MOUNTAINS,rockSideHits:sideHits,rockMassCollision:'physical polygon exterior sampled at boots, torso and head; embedded cavities pending',generatorAudit:course?.audit?.valid??false,certified:false}}
 install(42,1);
 return {active,install,claim,drawTerrain,climbEntry,beginClimb,down,tickClimb,
  startX,finish,onLanding,onFail,solidSideCollision,get course(){return course},get foundations(){return foundations},get routes(){return routes}};
})();
