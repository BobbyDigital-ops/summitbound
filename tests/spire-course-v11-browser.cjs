const {chromium}=require('@playwright/test'),{spawn}=require('node:child_process');
(async()=>{
 const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','3478','--strictPort'],{stdio:'ignore'});
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1550,height:1000},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  let loaded=false;
  for(let i=0;i<25;i++){
   try{await page.goto('http://127.0.0.1:3478/game/spire-course-v11-lab.html',{waitUntil:'domcontentloaded',timeout:2000});loaded=true;break}
   catch{await new Promise(done=>setTimeout(done,350))}
  }
  if(!loaded)throw Error('Course preview server did not start');
  await page.waitForFunction(()=>window.__courseV11?.crossings.length===4,{timeout:30000});
  for(let gapId=1;gapId<=10;gapId++){
   await page.selectOption('#gap',String(gapId));
   await page.waitForFunction(id=>window.__courseV11?.gapPreset===id,gapId,{timeout:30000});
   const details=await page.evaluate(()=>({
    actualGap:window.__courseV11.gap,
    gaps:window.__courseV11.crossings.map(q=>q.gap),
    samples:window.__courseV11.crossings.every(q=>q.flightSampleVerified)}));
   if(details.gaps.length!==4||!details.samples||details.gaps.some(g=>g!==details.actualGap))
    throw Error('Gap preview invalid: '+JSON.stringify(details));
   if(gapId===1||gapId===10)
    await page.screenshot({path:'test-results/spire-course-gap-'+gapId+'.png',fullPage:true});
  }
  if(errors.length)throw Error('Browser JS errors: '+errors.join(' | '));
  console.log('All ten selectable gap sizes rendered five-spire courses, with four sampled crossings each');
 }finally{if(browser)await browser.close();server.kill()}
})().catch(error=>{console.error(error);process.exitCode=1});
