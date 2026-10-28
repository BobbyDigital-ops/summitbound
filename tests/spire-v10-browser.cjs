const {chromium}=require('@playwright/test');
const {spawn}=require('node:child_process');
const fs=require('node:fs');
(async()=>{
 const vite=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','3400'],{stdio:'ignore'});
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1500,height:1000},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  let ready=false;
  for(let i=0;i<30;i++){
   try{
    await page.goto('http://127.0.0.1:3400/game/new-spire-lab-v10.html',{waitUntil:'domcontentloaded',timeout:1500});
    ready=true;break;
   }catch{await new Promise(resolve=>setTimeout(resolve,350))}
  }
  if(!ready)throw Error('Vite failed to start after repeated attempts');
  await page.locator('#gallery .tile').first().waitFor();
  const count=await page.locator('#gallery .tile').count();
  if(count!==5)throw Error('Expected 5 independently rendered mountains, got '+count);
  await page.screenshot({path:'test-results/spire-v10-five-mountains.png',fullPage:true});
  await page.locator('#next').click();
  await page.locator('#gallery .tile').first().waitFor();
  await page.screenshot({path:'test-results/spire-v10-second-seed.png',fullPage:true});
  if(errors.length)throw Error('Browser errors: '+errors.join(' | '));
  console.log('Five new vertical spires rendered successfully for two seeds');
 }finally{if(browser)await browser.close();vite.kill();}
})().catch(e=>{console.error(e);process.exitCode=1});
