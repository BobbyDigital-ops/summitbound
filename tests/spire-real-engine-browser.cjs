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
  if(!boot.info.active||boot.info.peaks!==2||boot.rig!=='function'||
   boot.originalTick!=='function'||boot.originalRender!=='function'||
   boot.originalInput!=='function'||boot.player.standingOn!=='s0')
   throw Error('Full original game bootstrap failed: '+JSON.stringify(boot));
  // The test NEVER assigns p.vx, p.x, or player state in the flight path.
  // It starts at the game's natural spawn on the orange launch deck;
  // accelerates by real A/D controls and original tick(), plants & releases
  // using the real functions, then collides with the real receiving scaffold.
  const gaps=[90,150,210,270,330,390,450,510,570,630],reports=[];
  for(let seed=42;seed<=44;seed++){
   if(seed!==42)await page.click('#integratedReroll');
   for(let preset=1;preset<=10;preset++){
   await page.selectOption('#integratedGap',String(preset));
   const result=await page.evaluate(()=>{
    const crossing=SummitIntegrated.course.crossings[0],sample=crossing.flight;
    const from=SummitIntegrated.course.peaks[0],to=SummitIntegrated.course.peaks[1];
    const targetId='l1-'+Number(crossing.targetPlatform.split('-').at(-1));
    const target=platforms.find(q=>q.id===targetId);
    const start={x:p.x,y:p.y,velocity:p.vx,state:p.state};
    if(!target||p.standingOn!=='s0'||p.vx!==0)return {error:'not stationary at start',start};
    keys.add('d');
    for(let frame=0;frame<sample.runFrames;frame++)tick(1/120);
    keys.delete('d');
    const sprint={x:p.x,vx:p.vx,state:p.state,standingOn:p.standingOn};
    plant();const planted=p.state==='RIDING_VAULT';
    for(let frame=0;frame<sample.releaseFrames;frame++)tick(1/120);
    release();const released=p.state==='AIRBORNE';
    let landed=null;
    for(let frame=0;frame<950;frame++){
     tick(1/120);
     if(p.standingOn){landed=p.standingOn;break}
    }
    return {seed:SummitIntegrated.course.seed,gap:crossing.gap,actualRockGap:(to.worldX+to.bounds.left)-(from.worldX+from.bounds.right),
     planted,released,landed,expected:targetId,landingKind:target.kind,landingWidth:target.width,
     sourceDeck:from.departure.width,start,sprint,
     expectedSpeed:sample.speed,expectedPlantX:from.worldX+sample.launchX,
     plan:{runFrames:sample.runFrames,releaseFrames:sample.releaseFrames},state:p.state,
     secondSpireReached:p.standingOn?.startsWith('l1-')||p.standingOn==='s1'};
   });
   reports.push(result);
   if(result.error||result.seed!==seed||result.gap!==gaps[preset-1]||Math.abs(result.actualRockGap-result.gap)>1e-7||
      !result.planted||!result.released||result.landed!==result.expected||
      result.landingKind!=='ledge'||result.start.velocity!==0||
      Math.abs(result.sprint.vx-result.expectedSpeed)>1e-6||
      Math.abs(result.sprint.x-result.expectedPlantX)>1e-5)
    throw Error('Stationary-start REAL player crossing failed gap '+gaps[preset-1]+': '+JSON.stringify(result));
   if(seed===42&&(preset===1||preset===10))
    await page.screenshot({path:'test-results/real-engine-landing-gap-'+gaps[preset-1]+'.png',fullPage:true});
   // The receiving scaffold is a real platform and its climb leads onward.
   const climb=await page.evaluate(()=>{
    const pl=currentPlatform(),entry=SummitIntegrated.climbEntry(pl),startX=p.x;
    let attached=false,walkingSteps=0;
    // From the ACTUAL touchdown: brake, walk to the climb entrance and
    // stop naturally. No teleport, p.x edits, or velocity injection.
    for(let i=0;i<1200;i++){
     if(!p.standingOn||!p.standingOn.startsWith('l1-'))break;
     const dx=entry-p.x;
     const targetV=Math.sign(dx)*Math.min(155,Math.sqrt(Math.max(0,Math.abs(dx))*1350)*.75);
     keys.delete('a');keys.delete('d');keys.delete('w');
     if(p.vx<targetV-15)keys.add('d');
     else if(p.vx>targetV+15)keys.add('a');
     else if(Math.abs(dx)>16)keys.add(dx>0?'d':'a');
     else if(Math.abs(p.vx)<85&&p.groundedFor>.09)keys.add('w');
     tick(1/120);walkingSteps++;
     if(p.state==='CLIMBING'){attached=true;break}
    }
    keys.delete('a');keys.delete('d');keys.delete('w');
    if(attached){
     keys.add('w');
     for(let i=0;i<5500&&p.state==='CLIMBING';i++)tick(1/120);
     keys.delete('w');
    }
    return {attached,state:p.state,on:p.standingOn,startX,entry,finishX:p.x,walkingSteps};
   });
   if(!climb.attached||climb.state!=='GROUNDED')
    throw Error('Incoming scaffold has no workable onward climb seed '+seed+' gap '+result.gap+': '+JSON.stringify(climb));
   }
  }
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
  if(errors.length)throw Error('Browser JS errors: '+errors.join(' | '));
  console.log(JSON.stringify({boot:boot.info,originalRuntimeControlledFromRest:true,
   gapCrossings:reports.map(r=>({gap:r.gap,runFrames:r.plan.runFrames,launchSpeed:r.sprint.vx,
    landing:r.landed,scaffoldWidth:r.landingWidth})),rockCollision:collision.blocked}));
 }finally{if(browser)await browser.close();vite.kill()}
})().catch(e=>{console.error(e);process.exitCode=1});
