const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=n=>fs.readFileSync('public/game/scripts/'+n,'utf8');
test('Phase 7: hidden Android tab cannot advance physics and time trials',()=>{
 const simulation=read('simulation.js');
 assert.match(simulation,/if\(document\.hidden\)\{prev=now;acc=0;requestAnimationFrame\(loop\);return;\}/);
 assert.match(simulation,/const stationary=innerWidth<950/);
 assert.match(simulation,/perfDrawSamples\.length>120/);
});
test('Phase 7: focus, pagehide, visibility and parent iframe blur share one input reset',()=>{
 const input=read('input-ui.js');
 const callbacks={window:{},document:{}},fields=new Map();
 const document={hidden:false,addEventListener(name,cb){callbacks.document[name]=cb;},
  querySelectorAll(){return []},
  getElementById(id){if(!fields.has(id))fields.set(id,{
   addEventListener(){},classList:{remove(n){this.last=n},add(){}},
   style:{},hidden:false});
  return fields.get(id)}};
 const window={addEventListener(name,cb){callbacks.window[name]=cb;},focus(){}};
 const fingers={left:new Set(),right:new Set(),up:new Set(),down:new Set(),vault:null};
 const context=vm.createContext({document,window,fingers,keys:new Set(),canvas:{addEventListener(){}},
  mode:'practice',routeSeed:0,graphicsQuality:'auto',autoPortraitCap:1.2,slowAutoWindows:0,
  prev:0,acc:123,lastRenderedAt:1000,performance:{now(){return 4321}},
  resize(){},spawn(){},requestAnimationFrame(){},loop(){},gameReset(){},
  applyRoute(){},gameReset(){},retry(){},plant(){},release(){context.released=true},
  continueCaveAscent(){},retryFinalLeap(){},invalidateTerrainCache(){},
  invalidateTimeTrial(){},cfg:{},draw(){},haptic(){}});
 vm.runInContext(input,context);
 context.keys.add('arrowright');
 context.fingers.right.add(9);
 context.fingers.down.add(12);
 context.fingers.vault=88;
 callbacks.window.pagehide();
 assert.equal(context.keys.size,0);
 assert.equal(context.fingers.right.size,0);
 assert.equal(context.fingers.down.size,0);
 assert.equal(context.fingers.vault,null);
 assert.equal(context.acc,0);
 assert.equal(context.prev,4321);
 assert.equal(context.lastRenderedAt,0);
 assert.equal(context.released,true);
 context.keys.add('w');
 document.hidden=true;
 callbacks.document.visibilitychange();
 assert.equal(context.keys.size,0);
 assert.equal(context.acc,0);
 document.hidden=false;
 callbacks.document.visibilitychange();
 assert.equal(context.prev,4321);
});
