const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const context={module:{exports:{}},require};
vm.runInNewContext(fs.readFileSync('public/game/scripts/clean-map-phase1.js','utf8'),context);
const M=context.module.exports;
test('ASSEMBLY ACCEPTANCE GATE: a spire must grow vertically, not as a horizontal chain',()=>{
 for(let seed=1;seed<=25;seed++){
  const a=M.assemble(seed);
  const origins=new Set(a.pieces.map(p=>Math.round(p.transform.y)));
  const width=a.bounds.right-a.bounds.left,height=a.bounds.bottom-a.bounds.top;
  assert.ok(origins.size>1&&height>width*.8,
   'seed '+seed+' is not a vertical spire: width '+width+', height '+height+', vertical origins '+origins.size);
 }
});
