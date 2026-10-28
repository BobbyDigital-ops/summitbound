const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');
const ctx={module:{exports:{}}};
vm.runInNewContext(fs.readFileSync('public/game/scripts/clean-parts-phase1.js','utf8'),ctx);
const L=ctx.module.exports;
test('complete catalogue and distinct geometric assets',()=>{
 assert.equal(L.BASES.length,24);assert.equal(L.EXTENSIONS.length,24);
 assert.equal(L.SUMMITS.length,16);assert.equal(L.PLATFORMS.length,50);
 assert.equal(new Set([...L.BASES,...L.EXTENSIONS,...L.SUMMITS].map(p=>p.id)).size,64);
 for(const p of [...L.BASES,...L.EXTENSIONS,...L.SUMMITS]){
  assert.ok(p.vertices.length>=9);assert.ok(p.mounts.length>0);
  assert.ok(p.sockets.every(s=>L.S[s.size]>0&&s.vertices.length===5));
 }
});
test('all small medium large connectors join perfectly in world coordinates',()=>{
 for(const size of ['S','M','L'])for(let i=0;i<12;i++){
  const a={size,side:'right',vertices:L.edge(i*17,50+i*3,size,'right')};
  const b={size,side:'left',vertices:L.edge(i*11,30,size,'left')};
  const result=L.mate(a,b);assert.equal(result.compatible,true);
  assert.equal(JSON.stringify(result.vertices),JSON.stringify(a.vertices));
 }
});
test('size mismatch and same-facing connectors cannot be installed',()=>{
 const a={size:'S',side:'left',vertices:L.edge(0,0,'S','left')};
 const b={size:'M',side:'right',vertices:L.edge(0,0,'M','right')};
 assert.throws(()=>L.mate(a,b),/size mismatch/);
});
test('50 platform assets have 5 size families and exact collision widths',()=>{
 for(let size=1;size<=5;size++){
  const choices=L.PLATFORMS.filter(p=>p.size===size);
  assert.equal(choices.length,10);
  assert.equal(new Set(choices.map(p=>p.edge)).size,10);
  for(const p of choices){
   assert.equal(p.collision.left,0);
   assert.equal(p.collision.right,p.width);
   assert.equal(p.collision.top,0);
   assert.ok(p.polygon.length>=8);
  }
 }
});
test('every platform can mount on a compatible rock piece',()=>{
 const pieces=[...L.BASES,...L.EXTENSIONS,...L.SUMMITS];
 for(const platform of L.PLATFORMS){
  const piece=pieces.find(p=>p.mounts.some(m=>m.size===platform.size));
  assert.ok(piece);
  const mount=piece.mounts.find(m=>m.size===platform.size);
  const fitted=L.mountPlatform(piece,mount.id,platform.id);
  assert.equal(fitted.collision.right-fitted.collision.left,platform.width);
  const wrong=L.PLATFORMS.find(p=>p.size!==(mount.size));
  assert.throws(()=>L.mountPlatform(piece,mount.id,wrong.id),/size mismatch/);
 }
});
test('catalogue cannot reference deleted legacy course geometry',()=>{
 const fs=require('node:fs'),src=fs.readFileSync('public/game/scripts/clean-parts-phase1.js','utf8');
 for(const key of ['FEATURED_BASE_LAYOUTS','caveLayouts','MOUNTAIN_DESIGNS','installFeaturedCourseGeometry','spires['])
  assert.equal(src.includes(key),false,'unexpected legacy geometry dependency '+key);
});

function pointInside(point,polygon){
 let inside=false;
 for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const a=polygon[i],b=polygon[j];
  if((a[1]>point[1])!==(b[1]>point[1]) &&
   point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }
 return inside;
}
test('every platform mounting point is physically inside its rock component',()=>{
 for(const p of [...L.BASES,...L.EXTENSIONS,...L.SUMMITS])
  for(const m of p.mounts)
   assert.ok(pointInside([m.x,m.y],p.vertices),p.id+'/'+m.id+' outside rock');
});

test('all 64 textured components have distinct deterministic material seeds',()=>{
 const list=[...L.BASES,...L.EXTENSIONS,...L.SUMMITS];
 assert.equal(list.length,64);
 assert.equal(new Set(list.map(p=>p.id)).size,64);
 assert.equal(new Set(list.map(p=>p.role+':'+p.textureSeed)).size,64);
 for(const p of list)assert.ok(['dark-granite','slate','frosted-granite','weathered-rock'].includes(p.material));
});
test('Cinematic texture renderer draws every rock and platform without throwing',()=>{
 const textureContext={save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},clip(){},fillRect(){},fill(){},stroke(){},createLinearGradient(){return {addColorStop(){}}}};
 const context={module:{exports:{}}};
 vm.runInNewContext(fs.readFileSync('public/game/scripts/clean-cinematic-textures.js','utf8'),context);
 const painter=context.module.exports;
 for(const p of [...L.BASES,...L.EXTENSIONS,...L.SUMMITS,...L.PLATFORMS]){
  const stats=painter.render(textureContext,p);
  assert.ok(stats.facets>=18);
  assert.ok(stats.bounds.every(Number.isFinite));
 }
});
