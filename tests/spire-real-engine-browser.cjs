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
   try{
    await page.goto('http://127.0.0.1:3491/game/summit-leap-modular-integrated.html',{waitUntil:'domcontentloaded',timeout:1500});
    loaded=true;break;
   }catch{await new Promise(done=>setTimeout(done,400))}
  }
  if(!loaded)throw Error('Original integrated game not accessible');
  await page.waitForFunction(()=>!!window.__SummitIntegratedTest,{timeout:30000});
  await page.waitForTimeout(300);
  const boot=await page.evaluate(()=>({
   info:__SummitIntegratedTest.claim(),rig:typeof drawRigMountaineer,
   physics:typeof PolePhysicsEngine,originalTick:typeof tick,
   originalRender:typeof draw,originalInput:typeof processKeyDown,
   player:{state:p.state,standingOn:p.standingOn,x:p.x,y:p.y},
   routes:SummitIntegrated.routes.map(q=>({source:q.source,target:q.target,kind:q.kind})),
   scripts:Array.from(document.querySelectorAll('script[src]')).map(s=>s.getAttribute('src')),
  }));
  if(!boot.info.active||boot.info.peaks!==2||boot.rig!=='function'||boot.originalTick!=='function'||
    boot.originalRender!=='function'||boot.originalInput!=='function'||
    boot.player.standingOn!=='s0'||boot.routes.length<3)
   throw Error('Original gameplay bootstrap mismatch '+JSON.stringify(boot));
  await page.screenshot({path:'test-results/real-engine-two-spires.png',fullPage:true});
  const result=await page.evaluate(()=>{
   // The ORIGINAL game-wide global p and tick() are used; no alternative
   // simulator or test-only player controller is instantiated.
   const sample=SummitIntegrated.course.crossings[0].flight;
   const source=SummitIntegrated.course.peaks[0],dst=SummitIntegrated.course.crossings[0].targetPlatform;
   const deck=platforms.find(pl=>pl.id==='s0');
   p.x=source.worldX+sample.launchX;p.y=deck.top-22;
   p.vx=sample.speed;p.vy=0;p.state='RUNNING';
   p.standingOn='s0';p.facingDir=1;p.groundedFor=.5;
   plant();
   const planted=p.state==='RIDING_VAULT';
   for(let i=0;i<Math.floor(1.75*sample.releaseFraction*120);i++)tick(1/120);
   release();
   const released=p.state==='AIRBORNE';
   let landed=null;
   for(let i=0;i<800;i++){
    tick(1/120);
    if(p.standingOn){landed=p.standingOn;break;}
   }
   return {planted,released,landed,desired:'l1-'+Number(dst.split('-').at(-1)),
    x:p.x,y:p.y,state:p.state,vx:p.vx,drawRig:typeof drawRigMountaineer};
  });
  if(!result.planted||!result.released||result.landed!==result.desired)
   throw Error('ORIGINAL physics tick crossing failed '+JSON.stringify(result));
  await page.screenshot({path:'test-results/real-engine-landing.png',fullPage:true});
  const climb=await page.evaluate(()=>{
   const pl=currentPlatform(),entry=SummitIntegrated.climbEntry(pl);
   p.x=entry;keys.add('w');tick(1/120);
   const attached=p.state==='CLIMBING',kind=p.climb?.route.kind;
   for(let i=0;i<4500&&p.state==='CLIMBING';i++)tick(1/120);
   keys.delete('w');
   return {attached,kind,standingOn:p.standingOn,state:p.state};
  });
  if(!climb.attached||climb.state!=='GROUNDED')throw Error('Original ice input/climb integration failed '+JSON.stringify(climb));
  await page.selectOption('#integratedGap','10');
  await page.waitForFunction(()=>SummitIntegrated.course.gap===210);
  const selection=await page.evaluate(()=>({gap:SummitIntegrated.course.gap,platforms:platforms.filter(pl=>pl.modular).length,player:p.standingOn}));
  if(selection.gap!==210||selection.player!=='s0')throw Error('Gap selector integration failed '+JSON.stringify(selection));
  const sideWall=await page.evaluate(()=>{
   const q=SummitIntegrated.course.peaks[1],base=q.pieces[0];
   let choice=null;
   for(let y=-6;y>-(base.height-6);y-=9){
    const edge=SpireAssemblyV10.edgeAt(base,y);if(!edge)continue;
    const left=q.worldX+edge.left,feet=q.worldY+y,x=left+1;
    const alcove=platforms.some(pl=>pl.spire===1&&Math.abs(feet-pl.top)<65&&x>=pl.left-45&&x<=pl.right+45);
    if(!alcove){choice={left,feet};break}
   }
   if(!choice)return {blocked:false,reason:'No non-alcove rock face available'};
   const {left,feet}=choice;
   p.x=left+1;p.y=feet-22;p.vx=300;p.vy=40;
   p.state='AIRBORNE';p.standingOn=null;
   const blocked=SummitIntegrated.solidSideCollision(left-25);
   return {blocked,x:p.x,expectedX:left-10,impactCount:SummitIntegrated.claim().rockSideHits};
  });
  if(!sideWall.blocked||Math.abs(sideWall.x-sideWall.expectedX)>1e-7)
   throw Error('Rock side wall allowed blind exterior penetration '+JSON.stringify(sideWall));
  if(errors.length)throw Error('Browser script errors: '+errors.join(' | '));
  console.log(JSON.stringify({boot:boot.info,realPhysicsCrossing:result,realOriginalClimb:climb,gapSelection:selection}));
 }finally{if(browser)await browser.close();vite.kill()}
})().catch(e=>{console.error(e);process.exitCode=1;});
