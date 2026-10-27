const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const ctx=vm.createContext({Image:class Image{},document:{getElementById:()=>null},platforms:[]});
for(const name of ['physics.js','world-data.js'])
 vm.runInContext(fs.readFileSync('public/game/scripts/'+name,'utf8'),ctx);
function fingerprint(str){
 let n=2166136261>>>0;
 for(let i=0;i<str.length;i++)n=Math.imul(n^str.charCodeAt(i),16777619)>>>0;
 return n.toString(16).padStart(8,'0');
}
// Approved v0.9.16 geometry: summit, shelf and cave coordinates.
// Updating these hashes needs deliberate human visual/playability approval.
const reference=[
 [0,'b3830d76'],[1,'6f67305a'],[2,'e2af8298'],
 [7,'b163f0d1'],[42,'3db76450'],
 [250,'98d5d27e'],[996,'7797cd46']
];
for(const [seed,hash] of reference){
 test('approved mountain template seed '+seed+' remains intact',()=>{
  vm.runInContext('applyRoute('+seed+')',ctx);
  const actual=vm.runInContext(
   'spires.map(s=>({summit:s.summit,ledges:s.ledges,cave:s.cave??null}))',ctx);
  assert.equal(fingerprint(JSON.stringify(actual)),hash,
   'approved mountain geometry has changed; inspect before accepting');
 });
}
test('seeded level generation still requires real landing and braking validation',()=>{
 const source=fs.readFileSync('public/game/scripts/world-data.js','utf8');
 assert.match(source,/routeSeed=\(\(Math\.trunc\(seed\)%997\)\+997\)%997/);
 assert.match(source,/if\(!viableShelves\(ledges,previous\)\)continue/);
 assert.match(source,/MOUNTAIN_ARCHETYPES/);
});
