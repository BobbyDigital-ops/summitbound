const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const fakeGradient={addColorStop(){}};
const metrics={sourceBackdropPaints:0,composites:0};
const fakeCtx=new Proxy({},{
 get(o,k){
  if(k in o)return o[k];
  if(k==='createLinearGradient'||k==='createRadialGradient')return ()=>fakeGradient;
  if(k==='createPattern')return ()=>({});
  if(k==='drawImage')return (...args)=>{if(args[0]?.src?.includes('mountain-background'))metrics.sourceBackdropPaints++;else metrics.composites++;};
  return ()=>{};
 },
 set(o,k,v){o[k]=v;return true;}
});
let created=0;
const env=vm.createContext({
 Image:class Image{
  constructor(){this.complete=true;this.naturalWidth=3600;this.naturalHeight=2100;this.src='';}
 },
 document:{getElementById:()=>null,createElement:()=>{created++;return {width:0,height:0,getContext:()=>fakeCtx};}},
 innerWidth:390,innerHeight:844,PI:Math.PI,ctx:fakeCtx,graphicsQuality:'auto',
 performance:{now:()=>1000},platforms:[]
});
for(const path of ['physics.js','world-data.js','rendering.js']){
 vm.runInContext(fs.readFileSync('public/game/scripts/'+path,'utf8'),env);
}
test('large background is downsampled once, then reused until invalidated',()=>{
 const first=vm.runInContext('backdropTexture(390,844)',env);
 assert.ok(first?.width<=3600&&first?.height<=2100);
 assert.equal(vm.runInContext('renderStats.backdropBuilds',env),1);
 const again=vm.runInContext('backdropTexture(390,844)',env);
 assert.equal(again,first,'background was re-rasterized with no input change');
 assert.equal(metrics.sourceBackdropPaints,1);
 vm.runInContext('backdropTexture(844,390)',env);
 assert.equal(vm.runInContext('renderStats.backdropBuilds',env),2,
  'rotation did not rebuild the cached background');
});
test('three visible mountains stay in an LRU cache with a strict memory cap',()=>{
 vm.runInContext('applyRoute(1)',env);
 for(const i of [0,1,2])vm.runInContext('mountainCache('+i+')',env);
 assert.equal(vm.runInContext('terrainCache.size',env),3);
 const n=vm.runInContext('renderStats.terrainBuilds',env);
 for(let k=0;k<50;k++)for(const i of [0,1,2])
  vm.runInContext('mountainCache('+i+')',env);
 assert.equal(vm.runInContext('renderStats.terrainBuilds',env),n,
  'terrain was re-rasterized while same three peaks were repeatedly visible');
 assert.ok(vm.runInContext('renderStats.terrainHits',env)>=150);
 assert.ok(vm.runInContext('renderStats.terrainBytes',env)<=40*1024*1024);
 const first=vm.runInContext('terrainCache.get(0)',env);
 assert.ok(first.image.width/first.width>=.70,'foreground cache is too soft');
 assert.ok(Math.max(first.image.width,first.image.height)<=2305,
  'mobile auto cache exceeds the safe texture dimension');
 vm.runInContext('mountainCache(3)',env);
 assert.ok(vm.runInContext('terrainCache.size',env)<=3);
});
test('route or quality reset drops cached images and memory accounting',()=>{
 vm.runInContext('invalidateTerrainCache()',env);
 assert.equal(vm.runInContext('terrainCache.size',env),0);
 assert.equal(vm.runInContext('renderStats.terrainBytes',env),0);
 assert.equal(vm.runInContext('renderStats.backdropBytes',env),0);
});
