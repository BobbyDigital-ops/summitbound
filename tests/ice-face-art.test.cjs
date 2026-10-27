const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const render=fs.readFileSync('public/game/scripts/rendering.js','utf8');
test('ice cliff faces have irregular, broad and asymmetric edges',()=>{
 const from=render.indexOf('function iceFaceWidths(');
 const to=render.indexOf('function drawIceClimb(',from);
 assert.ok(from>=0&&to>from,'missing terrain ice width profile');
 const profile=vm.runInNewContext(render.slice(from,to)+'\niceFaceWidths');
 for(const [spire,tier] of [[1,0],[2,1],[3,2]]){
  const widths=[];
  for(let n=0;n<=40;n++)widths.push(profile(n/40,spire,tier));
  const totals=widths.map(w=>w.left+w.right);
  assert.ok(Math.max(...totals)>77,'ice must be visibly wider than old 23px tube');
  assert.ok(Math.max(...totals)-Math.min(...totals)>25,'ice width is too uniform');
  assert.ok(widths.some(w=>Math.abs(w.left-w.right)>12),
   'ice wall is a symmetrical ribbon');
  assert.ok(widths.every(w=>w.left>=20&&w.right>=21),
   'ice surface collapses into a thin line');
 }
 assert.match(render,/outline\(1\.10,1\.10\)/);
 assert.match(render,/outline\(\.53,\.61\)/);
 assert.doesNotMatch(render,/lineWidth=23;paintCtx\.stroke\(\)/,
  'uniform tubular centre stroke has returned');
});
