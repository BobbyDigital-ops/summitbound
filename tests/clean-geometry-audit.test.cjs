const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
function load(path){const context={module:{exports:{}},require};vm.runInNewContext(fs.readFileSync(path,'utf8'),context);return context.module.exports}
const G=load('public/game/scripts/clean-geometry-audit.js');
const M=load('public/game/scripts/clean-map-phase1.js');
test('boundary auditor rejects invented sockets floating within polygons',()=>{
 const p={vertices:[[0,0],[100,0],[100,100],[0,100]]};
 assert.equal(G.socketBoundary(p,{vertices:[[30,10],[30,20]]}).valid,false);
 assert.equal(G.socketBoundary(p,{vertices:[[0,10],[0,20]]}).valid,true);
});
test('new universal sockets lie on actual rock boundaries',()=>{
 const a=M.assemble(17),result=G.audit(a);
 assert.equal(result.valid,true,result.errors.join('; '));
 for(let seed=1;seed<=100;seed++){
  const generated=G.audit(M.assemble(seed));
  assert.equal(generated.valid,true,'seed '+seed+': '+generated.errors.join('; '));
 }
});
