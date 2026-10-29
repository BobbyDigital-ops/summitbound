const {chromium}=require('@playwright/test');
const {spawn}=require('node:child_process');
(async()=>{
 const vite=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','3491','--strictPort'],{stdio:'ignore'});
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:940},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',err=>errors.push(err.message));
  let loaded=false;
  for(let i=0;i<35;i++){
   try{await page.goto('http://127.0.0.1:3491/game/summit-leap-modular-integrated.html',{waitUntil:'domcontentloaded',timeout:1500});loaded=true;break}
   catch{await new Promise(done=>setTimeout(done,400))}
  }
  if(!loaded)throw Error('Original integrated Summitbound game not accessible');
  await page.waitForFunction(()=>!!window.__SummitIntegratedTest,{timeout:30000});
  await page.waitForTimeout(300);
  const boot=await page.evaluate(()=>({info:__SummitIntegratedTest.claim(),rig:typeof drawRigMountaineer,
   physics:typeof PolePhysicsEngine,originalTick:typeof tick,
   originalRender:typeof draw,originalInput:typeof processKeyDown,
   player:{state:p.state,standingOn:p.standingOn,x:p.x,y:p.y}}));
  if(!boot.info.active||boot.info.peaks!==5||boot.info.gapMultiplier!==10||boot.rig!=='function'||
   boot.originalTick!=='function'||boot.originalRender!=='function'||
   boot.originalInput!=='function'||boot.player.standingOn!=='s0')
   throw Error('Full original game bootstrap failed: '+JSON.stringify(boot));
  // Every vault uses the original 120Hz tick, actual sprint input, original
  // pole plant/release, actual landing collision, and all real climb links.
  // Only the position between completed crossings is reset to the next
  // authored run-up (the normal Retry Peak spawn). This is a segment-level
  // gameplay test, not an unassisted end-to-end speedrun.
  const reports=[];
  for(let stage=0;stage<4;stage++){
   const result=await page.evaluate(stage=>{
    if(stage)spawn(stage,true);
    const course=SummitIntegrated.course,c=course.crossings[stage],sample=c.flight;
    const from=course.peaks[stage],to=course.peaks[stage+1];
    const targetId='l'+(stage+1)+'-'+Number(c.targetPlatform.split('-').at(-1));
    const initial={x:p.x,vx:p.vx,state:p.state,on:p.standingOn};
    if(p.standingOn!=='s'+stage||p.vx!==0)
     return {error:'wrong standing launch',stage,initial};
    const wallHitsBefore=SummitIntegrated.claim().rockSideHits;
    keys.add('d');
    for(let frame=0;frame<sample.runFrames;frame++)tick(1/120);
    keys.delete('d');
    const sprint={x:p.x,vx:p.vx};
    plant();const planted=p.state==='RIDING_VAULT';
    for(let frame=0;frame<sample.releaseFrames;frame++)tick(1/120);
    release();const released=p.state==='AIRBORNE',arcScale=p.longFlightScale;
    let landed=null;
    for(let frame=0;frame<950;frame++){
     tick(1/120);if(p.standingOn){landed=p.standingOn;break}
    }
    return {stage,gap:c.gap,actualGap:(to.worldX+to.bounds.left)-(from.worldX+from.bounds.right),
     totalPeaks:course.peaks.length,legs:course.crossings.length,audit:course.audit?.valid,
     planted,released,landed,targetId,initial,sprint,arcScale,
     postLandingSpeed:Math.abs(p.vx),postLandingArc:p.longFlightScale,
     wallHits:SummitIntegrated.claim().rockSideHits-wallHitsBefore,expectedSpeed:sample.speed,
     expectedPlantX:from.worldX+sample.launchX,runFrames:sample.runFrames};
   },stage);
   reports.push(result);
   if(result.error||result.totalPeaks!==5||result.legs!==4||!result.audit||
      Math.abs(result.gap-result.actualGap)>1e-6||result.gap<900||!result.planted||!result.released||
      result.arcScale<=1||result.wallHits>0||
      result.postLandingSpeed>180.001||result.postLandingArc!==1||
      result.landed!==result.targetId||result.initial.vx!==0||
      Math.abs(result.sprint.vx-result.expectedSpeed)>1e-6||
      Math.abs(result.sprint.x-result.expectedPlantX)>1e-5)
    throw Error('Five-spire original-runtime vault failed: '+JSON.stringify(result));
   if(stage===0||stage===3){
    await page.waitForFunction(expected=>document.getElementById('stage').textContent.includes(expected),
      (stage+2)+' / 5',{timeout:5000});
    await page.screenshot({path:'test-results/real-engine-landing-stage-'+stage+'.png',fullPage:true});
   }
   // Follow EVERY actual climb/ladder edge; some procedurally built routes
   // require multiple linked landing shelves before reaching the orange deck.
   const climb=await page.evaluate(stage=>{
    const target='s'+(stage+1),steps=[];
    for(let section=0;section<9;section++){
     if(p.standingOn===target)return {ok:true,on:p.standingOn,steps,finished:completed};
     const pl=currentPlatform();
     if(!pl)return {ok:false,reason:'no current platform',steps,state:p.state};
     const entry=SummitIntegrated.climbEntry(pl);
     if(!Number.isFinite(entry)||entry<0)return {ok:false,reason:'missing climb entrance',on:pl.id,steps};
     let attached=false,walkFrames=0;
     for(let i=0;i<1200;i++){
      if(!p.standingOn||p.standingOn!==pl.id)break;
      const dx=entry-p.x;
      const targetV=Math.sign(dx)*Math.min(155,Math.sqrt(Math.max(0,Math.abs(dx))*1350)*.75);
      keys.delete('a');keys.delete('d');keys.delete('w');
      if(Math.abs(dx)<24)keys.add('w');
      else if(p.vx<targetV-15)keys.add('d');
      else if(p.vx>targetV+15)keys.add('a');
      else keys.add(dx>0?'d':'a');
      tick(1/120);walkFrames++;
      if(p.state==='CLIMBING'){attached=true;break}
     }
     keys.delete('a');keys.delete('d');keys.delete('w');
     if(!attached)return {ok:false,reason:'failed to reach climb entrance',from:pl.id,x:p.x,entry,walkFrames,steps};
     keys.add('w');
     for(let i=0;i<5500&&p.state==='CLIMBING';i++)tick(1/120);
     keys.delete('w');
     steps.push({from:pl.id,to:p.standingOn,state:p.state,walkFrames});
     if(p.state!=='GROUNDED')return {ok:false,reason:'climb did not finish',steps};
    }
    return {ok:p.standingOn===target,on:p.standingOn,steps,finished:completed};
   },stage);
   if(!climb.ok)throw Error('Five-spire climb graph failed at '+stage+': '+JSON.stringify(climb));
   reports[reports.length-1].climb=climb;
  }
  const finished=await page.evaluate(()=>({completed,overlay:document.getElementById('victory').classList.contains('open'),peak:atStage}));
  if(!finished.completed||!finished.overlay)
   throw Error('Fifth spire did not trigger true completion '+JSON.stringify(finished));
  const collision=await page.evaluate(()=>{
   const q=SummitIntegrated.course.peaks[1],base=q.pieces[0];
   let choice=null;
   for(let y=-6;y>-(base.height-6);y-=9){
    const edge=SpireAssemblyV10.edgeAt(base,y);if(!edge)continue;
    const left=q.worldX+edge.left,feet=q.worldY+y,x=left+1;
    const alcove=platforms.some(pl=>pl.spire===1&&Math.abs(feet-pl.top)<65&&x>=pl.left-45&&x<=pl.right+45);
    if(!alcove){choice={left,feet};break}
   }
   if(!choice)return {blocked:false,reason:'No non-alcove exposed wall'};
   const {left,feet}=choice;
   p.x=left+1;p.y=feet-22;p.vx=300;p.vy=40;p.state='AIRBORNE';p.standingOn=null;
   const blocked=SummitIntegrated.solidSideCollision(left-25);
   return {blocked,x:p.x,want:left-10};
  });
  if(!collision.blocked||Math.abs(collision.x-collision.want)>1e-6)
   throw Error('Exposed rock collision failed '+JSON.stringify(collision));
  // The most ambitious gap presets must also use real pole movement and
  // collision, not just pass a geometry-only generator audit.
  const farther=await page.evaluate(()=>{
   const reports=[];
   for(const preset of [5,10]){
    SummitIntegrated.install(42,preset,10);gameReset();
    const course=SummitIntegrated.course;
    for(let stage=0;stage<4;stage++){
     if(stage)spawn(stage,true);
     const c=course.crossings[stage],f=c.flight;
     const startHits=SummitIntegrated.claim().rockSideHits;
     keys.add('d');
     for(let i=0;i<f.runFrames;i++)tick(1/120);
     keys.delete('d');plant();
     if(p.state!=='RIDING_VAULT')throw Error('no pole plant preset '+preset+' leg '+stage);
     for(let i=0;i<f.releaseFrames;i++)tick(1/120);
     release();
     if(p.state!=='AIRBORNE')throw Error('no release preset '+preset+' leg '+stage);
     let landed='';
     for(let i=0;i<1800;i++){
      tick(1/120);
      if(p.standingOn){landed=p.standingOn;break}
     }
     const expected='l'+(stage+1)+'-'+Number(c.targetPlatform.split('-').at(-1));
     const wallHits=SummitIntegrated.claim().rockSideHits-startHits;
     const realGap=(course.peaks[stage+1].worldX+course.peaks[stage+1].bounds.left)-
      (course.peaks[stage].worldX+course.peaks[stage].bounds.right);
     const result={preset,stage,gap:c.gap,realGap,landed,expected,wallHits,
      postLandingSpeed:Math.abs(p.vx),postLandingArc:p.longFlightScale};
     reports.push(result);
     if(landed!==expected||wallHits!==0||Math.abs(realGap-c.gap)>1e-6||
        result.postLandingSpeed>180.001||result.postLandingArc!==1)
      throw Error('long-chasm flight or collision regression '+JSON.stringify(result));
    }
   }
   return reports;
  });
  // Classic mode is a genuine 1x fallback with untouched airborne dynamics.
  await page.selectOption('#integratedSpacing','1');
  const classic=await page.evaluate(()=>{
   const info=SummitIntegrated.claim();
   const course=SummitIntegrated.course;
   return {scale:info.gapMultiplier,gaps:course.gaps,long:info.longPhysics};
  });
  if(classic.scale!==1||classic.long||classic.gaps[0]!==90)
   throw Error('Classic mode failed '+JSON.stringify(classic));
  const memory=await page.evaluate(()=>SummitIntegrated.claim());
  if(memory.cachedRasterMountains>memory.maxCachedRasterMountains||
     memory.maxCachedRasterMountains!==3||
     memory.cachedRasterBytes>3*2048*4096*4)
   throw Error('Unbounded mountain raster cache: '+JSON.stringify(memory));
  if(errors.length)throw Error('Browser JS errors: '+errors.join(' | '));
  console.log(JSON.stringify({boot:boot.info,originalRuntimeControlledFromRest:true,
   gapCrossings:reports.map(r=>({stage:r.stage,gap:r.gap,runFrames:r.runFrames,
    landing:r.landed,arcScale:r.arcScale,wallHits:r.wallHits,
    climbSteps:r.climb.steps.length})),rockCollision:collision.blocked,longGapPresets:farther,
   classicFallback:classic,
   rasterCache:{peaks:memory.cachedRasterMountains,bytes:memory.cachedRasterBytes,limit:memory.maxCachedRasterMountains}}));
 }finally{if(browser)await browser.close();vite.kill()}
})().catch(e=>{console.error(e);process.exitCode=1});
