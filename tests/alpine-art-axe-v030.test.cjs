const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=n=>fs.readFileSync('public/game/scripts/'+n,'utf8');
const html=fs.readFileSync('public/game/summit-leap-v081.html','utf8');
function runtime(){
 const calls={fills:0,strokes:0,gradients:0};
 const gradient={addColorStop(){}};
 const painter=new Proxy({},{
  get(obj,key){
   if(key in obj)return obj[key];
   if(key==='createLinearGradient'||key==='createRadialGradient')
    return ()=>{calls.gradients++;return gradient};
   if(key==='getImageData')return ()=>({data:new Uint8ClampedArray(4)});
   if(key==='fill')return ()=>{calls.fills++};
   if(key==='stroke')return ()=>{calls.strokes++};
   return ()=>{};
  },
  set(obj,key,val){obj[key]=val;return true}
 });
 const nodes=new Map();
 const document={
  getElementById(id){
   if(!nodes.has(id))nodes.set(id,{textContent:'',style:{},hidden:true,
    classList:{add(){},remove(){},toggle(){}},addEventListener(){},
    getContext(){return painter}});
   return nodes.get(id);
  },
  querySelectorAll(){return []},createElement(){return {width:0,height:0,getContext(){return painter}}}
 };
 const ctx=vm.createContext({Image:class Image{},document,innerWidth:1280,
  innerHeight:720,devicePixelRatio:1,navigator:{vibrate(){}},
  performance:{now:()=>1000},localStorage:{getItem(){return null},setItem(){}},
  Uint8ClampedArray});
 for(const f of ['physics.js','world-data.js','course-engine.js',
  'pole-dynamics.js','game-state.js','time-trial.js','climb-mechanics.js',
  'rescue-catch.js','rendering.js','bleak-art.js','alpine-art-v030.js',
  'simulation.js'])
  vm.runInContext(source(f),ctx,{filename:f});
 return {run:s=>vm.runInContext(s,ctx),calls};
}
test('alpine painter is loaded after the old renderer and before gameplay',()=>{
 const older=html.indexOf('/game/scripts/bleak-art.js');
 const newer=html.indexOf('/game/scripts/alpine-art-v030.js');
 const sim=html.indexOf('/game/scripts/simulation.js');
 assert.ok(older>=0&&newer>older&&sim>newer);
 assert.match(html,/v0\.30\.0/);
 assert.match(source('alpine-art-v030.js'),/const routes=iceRouteNetwork\(i\)/);
 assert.match(source('alpine-art-v030.js'),/mountainContourX\(i,y\)/);
 assert.match(source('alpine-art-v030.js'),/function alpineFir\(/);
 assert.match(source('alpine-art-v030.js'),/function deadTree\(/);
 assert.match(source('alpine-art-v030.js'),/function ledgeRock\(/);
});
test('every mountain is drawn and textured in the static terrain cache',()=>{
 const {run,calls}=runtime();
 const result=run("(()=>{const out=[];for(let i=0;i<5;i++){drawSpire(i,ctx);if(i>0)drawIceClimb(i,ctx);decorate(i,ctx);out.push(spires[i].summit[2]);}return out})()");
 assert.equal(result.length,5);
 assert.ok(calls.fills>200,'terrain painter did not produce varied opaque facets');
 assert.ok(calls.strokes>500,'terrain painter did not render crack/branch detail');
 assert.ok(calls.gradients>14,'terrain gradients missing');
 const render=source('rendering.js');
 assert.match(render,/drawSpire\(i,off\)/);
 assert.match(render,/terrainCache\.set\(i,data\)/);
});
test('axe cue only appears near real falling contact, never magnetic across a canyon',()=>{
 const {run}=runtime();
 const out=run("(()=>{const pl=platforms.find(x=>x.id==='l2-0');p={x:pl.left-340,y:pl.top+18,vx:450,vy:80,state:'AIRBORNE',facingDir:1};catchUsed=false;const distant=axeCatchApproach();p.x=pl.left-34;const close=axeCatchApproach(),ready=axeCatchOpportunity();return {distant,close:!!close,ready:!!ready,edge:ready?.edge,physical:pl.left};})()");
 assert.equal(out.distant,null);
 assert.equal(out.close,true);
 assert.equal(out.ready,true);
 assert.equal(out.edge,out.physical);
});
test('one early swing buffers briefly and only latches at real rim intersection',()=>{
 const {run}=runtime();
 const out=run("(()=>{const pl=platforms.find(q=>q.id==='l2-0');p={x:pl.left-100,y:pl.top+18,vx:430,vy:85,state:'AIRBORNE',standingOn:null,facingDir:1};catchUsed=false;catchQueuedUntil=-1;elapsed=5;const early=attemptAxeCatch(),pending=catchQueuedUntil>elapsed;const repeat=attemptAxeCatch();p.x=pl.left-36;elapsed+=.1;const hit=updatePendingAxeCatch();const first=axeCatchStrike(-1);elapsed+=.12;const second=axeCatchStrike(1);elapsed+=.12;const third=axeCatchStrike(-1);elapsed+=.12;const fourth=axeCatchStrike(1);return {early,pending,repeat,hit,first,second,third,fourth,state:p.state,standing:p.standingOn,used:catchUsed};})()");
 assert.deepEqual(Object.fromEntries(Object.entries(out)),{
  early:false,pending:true,repeat:false,hit:true,first:true,second:true,
  third:true,fourth:true,state:'GROUNDED',standing:'l2-0',used:true});
});
test('a too-early swing expires and never teleports to the platform',()=>{
 const {run}=runtime();
 const out=run("(()=>{const pl=platforms.find(q=>q.id==='l2-0');p={x:pl.left-103,y:pl.top+18,vx:410,vy:90,state:'AIRBORNE',facingDir:1};catchUsed=false;elapsed=3;const attempt=attemptAxeCatch();elapsed+=.3;const hit=updatePendingAxeCatch();return {attempt,hit,state:p.state,used:catchUsed,queued:catchQueuedUntil};})()");
 assert.equal(out.attempt,false);
 assert.equal(out.hit,false);
 assert.equal(out.state,'AIRBORNE');
 assert.equal(out.used,true);
 assert.equal(out.queued,-1);
});
test('physics stays linked to existing collision surfaces and 100-level scope is unchanged',()=>{
 const {run}=runtime(),audit=run('auditPlayableCourse()');
 assert.equal(audit.valid,true,audit.failures.join('; '));
 assert.equal(run('spires.length'),5);
 assert.equal(run('FEATURED_COURSE.campaignSize'),100);
 assert.equal(run('cfg.maxRunSpeed'),450);
 assert.equal(run('cfg.poleLength'),195);
});
