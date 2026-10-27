const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');
const ctx=vm.createContext({Image:class Image{},document:{getElementById:()=>null},platforms:[]});
vm.runInContext(fs.readFileSync('public/game/scripts/physics.js','utf8'),ctx);
vm.runInContext(fs.readFileSync('public/game/scripts/world-data.js','utf8'),ctx);
for(let route=0;route<9;route++){
 test('continuous cliff safely backs landing surfaces on route '+(route+1),()=>{
  vm.runInContext('applyRoute('+route+')',ctx);
  for(let i=1;i<=3;i++){
   const mountain=vm.runInContext('spires['+i+']',ctx);
   const nodes=vm.runInContext('mountainContourNodes('+i+')',ctx);
   assert.equal(nodes.length,mountain.ledges.length+2,'summit, active ledges, base');
   for(let t=0;t<nodes.length-1;t++)assert.ok(nodes[t].y<nodes[t+1].y);
   for(const tier of mountain.ledges){
    const edge=vm.runInContext('mountainContourX('+i+','+(tier[2]+3)+')',ctx);
    assert.ok(Number.isFinite(edge));
    // The playable lip must project into open air but its inner part must
    // embed in the solid mountain body; no suspended ledges or giant fins.
    assert.ok(edge>=tier[0]+15,'shelf has no exposed lip outside the rock');
    assert.ok(edge<=tier[1]-15,'shelf no longer overlaps the mountain body');
    assert.ok(tier[0]+10<edge&&tier[1]-10>edge,
     'cliff must actually intersect the ledge span');
   }
   for(let y=mountain.summit[2]+4;y<2100;y+=11){
    assert.ok(Number.isFinite(vm.runInContext('mountainContourX('+i+','+y+')',ctx)));
   }
  }
 });
}
test('checkpoint cave and initial peak have continuous rock profiles',()=>{
 for(const i of [0,4]){
  assert.ok(vm.runInContext('mountainContourNodes('+i+').length',ctx)>=3);
  assert.ok(Number.isFinite(vm.runInContext('mountainContourX('+i+',1200)',ctx)));
 }
});

test('procedural ledge rock anchors remain inside the cliff without changing surfaces',()=>{
 const fakeGradient={addColorStop(){}};
 const fakeCtx=new Proxy({},{
  get(obj,key){if(key in obj)return obj[key];
   if(key==='createLinearGradient'||key==='createRadialGradient')return ()=>fakeGradient;
   if(key==='createPattern')return ()=>({});return ()=>{};},
  set(obj,key,value){obj[key]=value;return true;}
 });
 const art=vm.createContext({Image:class Image{},document:{getElementById:()=>null},
  platforms:[],ctx:fakeCtx,performance:{now:()=>1000},innerWidth:390,innerHeight:820,
  graphicsQuality:'auto'});
 for(const path of ['physics.js','world-data.js','rendering.js'])
  vm.runInContext(fs.readFileSync('public/game/scripts/'+path,'utf8'),art);
 for(const seed of [0,1,2,3,4,5,6,7,8,42,250,996]){
  vm.runInContext('applyRoute('+seed+')',art);
  const mountains=vm.runInContext('spires',art);
  for(let i=1;i<=3;i++)for(const ledge of mountains[i].ledges){
   const p=vm.runInContext('terraceButtressProfile('+i+','+
    ledge[0]+','+ledge[1]+','+ledge[2]+')',art);
   assert.ok(p.length>=10,'buttress lacks rounded/jagged supporting profile');
   assert.ok(p.every(v=>v.every(Number.isFinite)),'non-finite rock anchor');
   const contour=vm.runInContext('mountainContourX('+i+','+p[8][1]+')',art);
   assert.ok(p[8][0]>=contour+10,
    'outcrop root is not embedded in continuous mountain rock');
   assert.ok(p[0][0]<ledge[0]&&p[3][0]>ledge[1],
    'outcrop does not support the full real landing span');
   assert.ok(p[8][1]>ledge[2]+80&&p[8][1]<ledge[2]+155,
    'detached deep rock fin rather than a local joined buttress');
  }
 }
});
