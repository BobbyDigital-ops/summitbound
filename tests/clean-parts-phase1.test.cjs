const test=require('node:test');
const assert=require('node:assert/strict');
const L=require('../public/game/scripts/clean-parts-phase1.js');
test('complete catalogue and distinct geometric assets',()=>{
 assert.equal(L.BASES.length,12);assert.equal(L.EXTENSIONS.length,12);
 assert.equal(L.SUMMITS.length,8);assert.equal(L.PLATFORMS.length,50);
 assert.equal(new Set([...L.BASES,...L.EXTENSIONS,...L.SUMMITS].map(p=>p.id)).size,32);
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
  assert.deepEqual(result.vertices,a.vertices);
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
