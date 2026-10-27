const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const sim=fs.readFileSync('public/game/scripts/simulation.js','utf8');
const from=sim.indexOf('function canvasRatioFor('),end=sim.indexOf('\nfunction resize()',from);
assert.ok(from>=0&&end>from,'explicit resolution budget helper missing');
const ratio=vm.runInNewContext(sim.slice(from,end)+'\ncanvasRatioFor');
test('pixel ratio balances edge clarity with capped phone fill cost',()=>{
 assert.equal(ratio('low',390,3),1);
 assert.equal(ratio('auto',390,3),1.2);
 assert.equal(ratio('auto',390,3,1),1);
 assert.equal(ratio('auto',390,1,1.2),1);
 assert.equal(ratio('auto',1280,3),1.6);
 assert.equal(ratio('high',390,3),2);
 assert.equal(ratio('auto',390,0),1);
 assert.ok(Math.pow(ratio('auto',390,3),2)<1.5,
  'auto pixel cost is too high relative to former 1x mobile setting');
});
test('auto performance fallback has hysteresis and does not retune pole physics',()=>{
 assert.match(sim,/stable&&p95>24\?slowAutoWindows\+1:0/);
 assert.match(sim,/slowAutoWindows>=3/);
 assert.match(sim,/autoPortraitCap=1;slowAutoWindows=0/);
 assert.match(sim,/for\(let n = 0; acc >= DT && n < 7/);
 assert.doesNotMatch(sim,/cfg\.gravity\s*=/);
 assert.doesNotMatch(sim,/cfg\.arcadeLift\s*=/);
});
