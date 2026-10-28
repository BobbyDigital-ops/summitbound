const {chromium}=require('@playwright/test'),{spawn}=require('node:child_process');
(async()=>{
 const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','3479','--strictPort'],{stdio:'ignore'});
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1420,height:1000},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  let ready=false;
  for(let attempt=0;attempt<30;attempt++){
   try{await page.goto('http://127.0.0.1:3479/game/spire-phase3-two-spire.html',{waitUntil:'domcontentloaded',timeout:1500});ready=true;break}
   catch{await new Promise(resolve=>setTimeout(resolve,350))}
  }
  if(!ready)throw Error('Phase 3 preview server did not start');
  await page.waitForFunction(()=>window.__phase3&&window.__phase3Foundation,{timeout:30000});
  for(const gap of [1,10]){
   await page.selectOption('#gap',String(gap));
   await page.waitForFunction(id=>window.__phase3?.preset===id,gap);
   const current=await page.evaluate(()=>{
    const g=window.__phase3,f=window.__phase3Foundation;
    return {gap:g.course.gap,blocks:f.foundations.reduce((a,x)=>a+x.blocks.length,0),
     valid:SpireFoundationsV12.inspect(g.course,f).valid};
   });
   if(!current.valid||current.blocks<2)throw Error('Broken foundation geometry '+JSON.stringify(current));
   await page.screenshot({path:'test-results/phase3-spire-gap-'+gap+'-foundations.png',fullPage:true});
   const init=await page.evaluate(()=>{
    const m=window.__phase3,f=m.course.crossings[0].flight,p=m.course.peaks[0],d=m.surface('0:departure');
    m.player.x=p.worldX+f.launchX-f.speed*f.speed/(2*m.cfg.runAcceleration)-2;
    m.player.y=d.top-22;m.player.vx=0;m.player.vy=0;m.player.state='GROUNDED';m.player.surface=d.id;
    return {launchX:p.worldX+f.launchX,releaseFraction:f.releaseFraction,target:'1:'+m.course.crossings[0].targetPlatform};
   });
   await page.keyboard.down('d');
   const run=await page.evaluate(goal=>{
    const m=window.__phase3;
    let count=0;
    while(m.player.x<goal&&count++<350&&m.player.state!=='AIRBORNE')m.tick(1/120);
    return {count,speed:m.player.vx,failed:m.player.state==='AIRBORNE'};
   },init.launchX);
   await page.keyboard.up('d');
   if(run.failed||run.count>=350||run.speed<180)throw Error('Cannot build actual run-up '+JSON.stringify(run));
   await page.keyboard.down(' ');
   const planted=await page.evaluate(()=>{
    const m=window.__phase3;return {state:m.player.state,message:m.message,
     x:m.player.x,surface:m.player.surface,vx:m.player.vx,
     departure:m.surface('0:departure')};
   });
   if(planted.state!=='RIDING_VAULT')
    throw Error('Keyboard Space failed to plant the actual pole: '+JSON.stringify(planted));
   await page.evaluate(fraction=>{
    const m=window.__phase3;
    for(let i=0;i<Math.floor(1.75*fraction*120);i++)m.tick(1/120);
   },init.releaseFraction);
   await page.keyboard.up(' ');
   const landed=await page.evaluate(()=>{
    const m=window.__phase3;
    for(let i=0;i<800&&!m.lastLanding;i++)m.tick(1/120);
    return {actual:m.lastLanding,position:m.player.x,state:m.player.state,vaults:m.vaults};
   });
   if(landed.actual!==init.target||landed.vaults!==1||landed.state!=='GROUNDED')
    throw Error('Keyboard-controlled physical vault failed '+JSON.stringify({gap,landed,init}));
   await page.screenshot({path:'test-results/phase3-spire-gap-'+gap+'-landed.png',fullPage:true});
  }
  if(errors.length)throw Error('Browser errors: '+errors.join(' | '));
  console.log('Both shortest and longest gap: real keyboard run-up, pole plant and release, physical landing; modular foundations rendered');
 }finally{if(browser)await browser.close();server.kill()}
})().catch(e=>{console.error(e);process.exitCode=1});
