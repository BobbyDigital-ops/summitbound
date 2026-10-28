const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx=vm.createContext({});
vm.runInContext(fs.readFileSync('public/game/scripts/level-engine-v1.js','utf8'),ctx);
const E=ctx.SummitLevelEngine;
test('seed reproducibility and genuinely varied platform widths',()=>{
 const a=E.compose({seed:82,count:15}),b=E.compose({seed:82,count:15}),c=E.compose({seed:83,count:15});
 assert.equal(JSON.stringify(a),JSON.stringify(b));
 assert.notEqual(JSON.stringify(a),JSON.stringify(c));
 assert.ok(E.geometryAudit(a).valid);
 const sizes=new Set(a.platforms.map(p=>p.kind));
 assert.ok(sizes.size>=4,'platform catalogue not varied enough');
 assert.ok(new Set(a.platforms.map(p=>p.right-p.left)).size>=10);
});
test('all five jump templates and platform presets have valid ranges',()=>{
 for(const [k,p] of Object.entries(E.WIDTHS))assert.ok(p.min>0&&p.max>p.min,k);
 for(const motif of Object.keys(E.TEMPLATES)){
  const level=E.compose({seed:9,count:3,motifs:[motif]});
  assert.ok(E.geometryAudit(level).valid,motif);
 }
});
test('geometry audit rejects impossible and malformed shelves',()=>{
 const a=E.compose({seed:5,count:2});a.platforms[1].right=a.platforms[1].left;
 assert.equal(E.geometryAudit(a).valid,false);
});
test('reachability requires actual swept contact data, never gap-only approval',()=>{
 const a=E.compose({seed:12,count:2});
 assert.equal(E.reachability(a,[]).valid,false);
 const mock=[{descending:[{x:0,feet:0,prev:-1}]}];
 assert.equal(E.reachability(a,mock).valid,false);
});
