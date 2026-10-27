const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const gradient={addColorStop(){}};
const ctx2d=new Proxy({},{
 get(obj,key){if(key in obj)return obj[key];
  if(key==='createLinearGradient'||key==='createRadialGradient')return ()=>gradient;
  if(key==='createPattern')return ()=>({});return ()=>{};},
 set(obj,key,val){obj[key]=val;return true;}
});
const env=vm.createContext({
 Image:class Image{constructor(){this.complete=false;this.naturalWidth=0;this.naturalHeight=0;}},
 document:{getElementById:()=>null,createElement:()=>({width:0,height:0,getContext:()=>ctx2d})},
 innerWidth:844,innerHeight:480,PI:Math.PI,ctx:ctx2d,graphicsQuality:'auto',
 performance:{now:()=>1000},platforms:[],
});
for(const path of ['public/game/scripts/physics.js','public/game/scripts/world-data.js','public/game/scripts/rendering.js']){
 vm.runInContext(fs.readFileSync(path,'utf8'),env,{filename:path});
}
for(let seed=0;seed<9;seed++){
 test('draw all mountain faces and ice routes without throwing, route '+(seed+1),()=>{
  vm.runInContext('applyRoute('+seed+')',env);
  assert.doesNotThrow(()=>{
   for(let i=0;i<5;i++)vm.runInContext('drawSpire('+i+',ctx)',env);
   for(let i=1;i<4;i++)vm.runInContext('drawIceClimb('+i+',ctx)',env);
   vm.runInContext('drawCave()',env);
   for(let i=0;i<5;i++)vm.runInContext('mountainCache('+i+')',env);
  });
 });
}
