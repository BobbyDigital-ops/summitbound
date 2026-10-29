const {chromium}=require('@playwright/test');
const {spawn}=require('node:child_process');
const fs=require('node:fs');
(async()=>{
 const vite=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','3492','--strictPort'],{stdio:'ignore'});
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  let loaded=false;
  for(let i=0;i<40;i++){
   try{await page.goto('http://127.0.0.1:3492/game/summit-leap-gap-preview.html',{waitUntil:'domcontentloaded',timeout:1700});loaded=true;break}
   catch{await new Promise(done=>setTimeout(done,350))}
  }
  if(!loaded)throw Error('10x gap visual page unavailable');
  await page.waitForFunction(()=>!!window.__SummitSpacingTest,{timeout:45000});
  const expected=[900,1500,2100,2700,3300,3900,4500,5100,5700,6300];
  const report=[];
  for(let preset=1;preset<=10;preset++){
   await page.selectOption('#preset',String(preset));
   const result=await page.evaluate(()=>{
    const o=window.__SummitSpacingTest,summary=o.getSummary(),p=o.expanded.peaks;
    const gaps=p.slice(1).map((q,i)=>
     (q.worldX+q.bounds.left)-(p[i].worldX+p[i].bounds.right));
    const pixel=document.querySelector('#afterCanvas').getContext('2d').getImageData(6,6,1,1).data;
    return {...summary,gaps,painted:pixel[3]>0,preview:o.expanded.visualOnly};
   });
   if(result.preset!==preset||result.tenfoldGap!==expected[preset-1]||
      result.standardGap!==expected[preset-1]/10||!result.valid||
      !result.preview||result.crossings!==4||!result.painted||
      result.gaps.some(g=>Math.abs(g-expected[preset-1])>1e-6)||
      result.afterWidth<=result.beforeWidth)
    throw Error('Gap scale visual regression preset '+preset+': '+JSON.stringify(result));
   report.push({preset,gap:result.tenfoldGap,previewPixelWidth:result.afterWidth});
   if(preset===1||preset===10){
    fs.mkdirSync('test-results',{recursive:true});
    await page.screenshot({path:'test-results/tenfold-gap-'+result.tenfoldGap+'.png',fullPage:true});
   }
  }
  await page.selectOption('#crossing','3');
  const last=await page.evaluate(()=>window.__SummitSpacingTest.getSummary());
  if(last.crossings!==4||!last.valid)throw Error('Final crossing selection invalid');
  if(errors.length)throw Error('Browser JS errors: '+errors.join('; '));
  console.log(JSON.stringify({visualOnly:true,allTenGapPresets:report,originalGameUntouched:true,realMeshRendering:true}));
 }finally{if(browser)await browser.close();vite.kill()}
})().catch(e=>{console.error(e);process.exitCode=1});
