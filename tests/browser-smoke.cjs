// Runs the real game in Chromium, which our fake Canvas unit tests cannot do.
const {spawn,execFile}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {promisify}=require('node:util');
const run=promisify(execFile);
const port=3391;
const url='http://127.0.0.1:'+port;
const fixture=path.join(process.cwd(),'public/game/__browser_smoke.html');
const probe='<script>window.addEventListener("error",e=>{window.__smokeError=String(e.message)+" at "+e.filename+":"+e.lineno;});const nativeRaf=window.requestAnimationFrame.bind(window);let startupFrames=0;window.requestAnimationFrame=(fn)=>startupFrames++<3?nativeRaf(fn):0;'+'<'+'/script>';
const page='<!doctype html><html><body>'
 +'<iframe id="gameframe" style="width:1200px;height:700px;border:0"></iframe>'
 +'<script>(async()=>{'
 +'const raw=await fetch("/game/summit-leap-v081.html").then(x=>x.text());'
 +'const frame=document.getElementById("gameframe");'
 +'frame.srcdoc=raw.replace("<head>","<head>"+'+JSON.stringify(probe).replace('</script>','<\\/script>')+');'
 +'const start=Date.now();const check=()=>{const win=frame.contentWindow;'
 +'const stage=win.document.getElementById("stage")?.textContent||"";'
 +'const canvas=win.document.getElementById("game");'
 +'const ready=(stage.startsWith("LEAP")||stage.startsWith("FIVE PEAKS"))&&canvas?.width>0&&canvas?.height>0;'
 +'document.body.dataset.stage=stage;'
 +'document.body.dataset.error=win.__smokeError||"none";'
 +'document.body.dataset.canvas=canvas?.width+"x"+canvas?.height;'
 +'document.body.dataset.readiness=win.document.readyState;'
 +'if(ready||Date.now()-start>3000){document.body.dataset.result=ready?"pass":"fail";clearInterval(poll);}};'
 +'const poll=setInterval(check,80);check();'
 +'})();'+'<'+'/script></body></html>';
const chromeNames=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'];
const chrome=process.env.CHROME_BIN||chromeNames.find(name=>fs.existsSync(name));
if(!chrome)throw Error('No Chromium/Chrome browser installed on runner: real-browser smoke test required');
fs.writeFileSync(fixture,page);
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:['ignore','pipe','pipe']});
let serverErrors='';
server.stderr.on('data',b=>serverErrors+=b.toString());
const deadline=Date.now()+14000;
(async()=>{
 try {
  let live=false;
  while(Date.now()<deadline){
   await new Promise(resolve=>setTimeout(resolve,250));
   try{const response=await fetch(url+'/game/__browser_smoke.html');if(response.ok){live=true;break;}}catch{}
  }
  if(!live)throw Error('Vite did not start: '+serverErrors);
  const output=await run(chrome,['--headless','--no-sandbox','--disable-gpu',
   '--disable-dev-shm-usage','--hide-scrollbars','--window-size=1280,800',
   '--virtual-time-budget=3800','--dump-dom',url+'/game/__browser_smoke.html'],{maxBuffer:3e6,timeout:35000});
  const dom=output.stdout;
  const found=(key)=>dom.match(new RegExp('data-'+key+'="([^"]*)"'))?.[1];
  console.log('Browser stage:',found('stage'),'Result:',found('result'),'Canvas:',found('canvas'));
  console.log('Browser JavaScript error:',found('error'));
  if(found('result')!=='pass')throw Error('Game failed to render in real Chromium. '+(found('error')||'Unknown error')+'\n'+dom.slice(-2100));
 }catch(error){console.error(error);process.exitCode=1;}
 finally{server.kill('SIGTERM');fs.rmSync(fixture,{force:true});}
})();