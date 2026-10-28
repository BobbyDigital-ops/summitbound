const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
function load(){const ctx={module:{exports:{}},require,globalThis:{}};vm.runInNewContext(fs.readFileSync('public/game/scripts/clean-map-phase1.js','utf8'),ctx,{filename:'clean-map-phase1.js'});return ctx.module.exports}
const M=load();
test('100 seeded spires consist of 3-7 connected prefab pieces',()=>{
 for(let seed=1;seed<=100;seed++){const a=M.assemble(seed);assert.ok(a.pieces.length>=3&&a.pieces.length<=7);assert.equal(a.joins.length,a.pieces.length-1);assert.equal(M.audit(a).valid,true);}
});
test('identical seeds reproduce identical geometry and other seeds vary',()=>{
 const s=JSON.stringify(M.assemble(7));assert.equal(s,JSON.stringify(M.assemble(7)));
 assert.notEqual(s,JSON.stringify(M.assemble(8)));
});
test('platform colliders belong only to occupied prefab mounting slots',()=>{
 for(let seed=1;seed<=40;seed++){const a=M.assemble(seed);
  assert.equal(a.platforms.length,a.colliders.length);
  for(const p of a.platforms){const c=a.colliders.find(x=>x.id===p.id);assert.ok(c&&c.right>c.left);assert.equal(c.top,p.position.y);}
  for(const slot of a.emptySlots)assert.ok(!a.platforms.some(p=>p.mount===slot.id));
 }
});
test('generated courses do not use Five Peaks map coordinates or sources',()=>{
 for(let i=0;i<20;i++){const c=M.buildCourse(i,3);
  assert.equal(c.source,'new-prefabs-only');assert.equal(c.peaks.length,3);
  assert.ok(c.peaks.every(p=>M.audit(p).valid&&!p.physicsCertified));
 }
 const src=fs.readFileSync('public/game/scripts/clean-map-phase1.js','utf8');
 for(const token of ['FEATURED_BASE_LAYOUTS','installFeaturedCourseGeometry','caveLayouts','MOUNTAIN_DESIGNS','spires['])assert.ok(!src.includes(token));
});
