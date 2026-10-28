const {chromium}=require('@playwright/test'),{spawn}=require('node:child_process');
(async()=>{
 const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','3477','--strictPort'],{stdio:'ignore'});
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1320,height:900},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  let loaded=false;
  for(let attempt=0;attempt<20;attempt++){
   try{await page.goto('http://127.0.0.1:3477/game/spire-phase2-playtest.html',{waitUntil:'domcontentloaded',timeout:2000});loaded=true;break;}
   catch{await new Promise(resolve=>setTimeout(resolve,400));}
  }
  if(!loaded)throw Error('Phase 2 browser playtest not available');
  await page.waitForFunction(()=>!!window.__spirePlaytest);
  const initial=await page.evaluate(()=>{
   const g=window.__spirePlaytest;
   return {seed:g.seed,state:g.player.state,platforms:g.spire.platforms.length,routes:g.spire.routes.length};
  });
  if(initial.seed!==42||initial.state!=='GROUNDED'||initial.platforms<2||initial.routes<2)
   throw Error('Bad initial generated playtest scene '+JSON.stringify(initial));
  await page.screenshot({path:'test-results/spire-v11-playtest-start.png',fullPage:true});
  await page.keyboard.down('w');
  await page.waitForTimeout(150);
  const started=await page.evaluate(()=>window.__spirePlaytest.player.state);
  if(started!=='CLIMBING')throw Error('W key did not attach to actual ice/ladder route: '+started);
  const climb=await page.evaluate(()=>{
   const g=window.__spirePlaytest;
   for(let i=0;i<3600&&g.player.state==='CLIMBING';i++)g.tick(1/120);
   return {state:g.player.state,on:g.player.standingOn,complete:g.completed};
  });
  if(climb.state!=='GROUNDED')throw Error('Original climbing physics could not reach real landing '+JSON.stringify(climb));
  await page.keyboard.up('w');
  await page.screenshot({path:'test-results/spire-v11-playtest-climbed.png',fullPage:true});
  if(errors.length)throw Error('Browser JS errors '+errors.join(' | '));
  console.log('Keyboard attached to a real climb, original ice-step reached physical generated landing');
 }finally{if(browser)await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
