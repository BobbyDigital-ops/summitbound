const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
function load(name,requireFn=()=>{throw Error('unexpected legacy dependency')}){
 const context={module:{exports:{}},require:requireFn};
 vm.runInNewContext(fs.readFileSync('public/game/scripts/'+name,'utf8'),context);
 return context.module.exports;
}
const K=load('spire-kit-v10.js');
const A=load('spire-assembly-v10.js',path=>{
 assert.equal(path,'./spire-kit-v10.js');
 return K;
});
const R=load('spire-render-v10.js');
const serial=x=>JSON.stringify(x);
test('fresh prefab catalogue: 64 mountain modules, 50 ledges/scaffolds, vertical ice and ladders',()=>{
 assert.equal(K.BASES.length,24);
 assert.equal(K.BODIES.length,24);
 assert.equal(K.CAPS.length,16);
 assert.equal(K.PLATFORMS.length,50);
 assert.equal(K.PLATFORMS.filter(x=>x.kind==='scaffold').length,25);
 assert.equal(K.PLATFORMS.filter(x=>x.kind==='rock').length,25);
 assert.equal(Object.keys(K.WIDTH).length,3);
 for(const p of [...K.BASES,...K.BODIES,...K.CAPS]){
  assert.ok(p.vertices.length>=9);
  assert.ok(p.mounts.length>0);
  if(p.role==='body'){
   assert.ok(K.WIDTH[p.bottomSocket]);assert.ok(K.WIDTH[p.topSocket]);
   assert.equal(serial(p.vertices.slice(0,2)),serial([[-K.WIDTH[p.bottomSocket]/2,0],[K.WIDTH[p.bottomSocket]/2,0]]));
  }
  if(p.role!=='cap'){
   const w=K.WIDTH[p.topSocket];
   assert.equal(serial(p.vertices.slice(-6,-4)),serial([[w/2,-p.height],[-w/2,-p.height]]));
  }
 }
 for(const c of [...K.ICE,...K.LADDERS])assert.equal(c.straight,true);
});
test('2,000 seeds build physically disjoint, vertically stacked spires',()=>{
 const lengths=new Set(),blueprints=new Set();
 for(let i=1;i<=2000;i++){
  const s=A.assemble(i),check=A.inspect(s);
  assert.equal(check.valid,true,'seed '+i+' '+check.errors.join('; '));
  assert.equal(s.source,'new-vertical-assets-only');
  assert.equal(s.joins.length,s.pieces.length-1);
  assert.equal(s.pieces[0].role,'base');
  assert.equal(s.pieces.at(-1).role,'cap');
  assert.equal(s.pieces[0].offsetY,0);
  assert.ok(s.pieces.at(-1).offsetY<-250);
  assert.equal(s.physicsCertified,false);
  lengths.add(s.pieces.length);
  blueprints.add(s.pieces.map(p=>p.prefab).join(','));
  for(const r of s.routes){
   assert.equal(r.x,r.finishX);
   assert.equal(r.collider.climbable,true);
   assert.ok(r.fromY>r.toY);
  }
 }
 assert.equal(serial([...lengths].sort()),serial([3,4,5,6,7]));
 assert.ok(blueprints.size>1800,'assemblies unexpectedly repetitive');
});
test('500 seeds preserve route-to-departure reachability and vary both platform and climbing types',()=>{
 const kinds=new Set(),climbs=new Set();
 for(let i=1;i<=500;i++){
  const s=A.assemble(i),platforms=new Map(s.platforms.map(p=>[p.id,p]));
  assert.ok(s.platforms.length>=2&&s.platforms.length<=4);
  assert.equal(s.routes.length,s.platforms.length);
  for(const p of s.platforms){
   kinds.add(p.kind);let current=p.id,steps=0;
   while(current!=='departure'){
    assert.ok(steps++<s.platforms.length,'cyclic route at seed '+i);
    const route=s.routes.find(r=>r.source===current);
    assert.ok(route);
    climbs.add(route.kind);
    assert.ok(route.target==='departure'||platforms.has(route.target));
    current=route.target;
   }
  }
 }
 assert.equal(serial([...kinds].sort()),serial(['rock','scaffold']));
 assert.equal(serial([...climbs].sort()),serial(['ice','ladder']));
});
test('deterministic seed, no original map or texture dependencies',()=>{
 assert.equal(serial(A.assemble(151)),serial(A.assemble(151)));
 for(const name of ['spire-kit-v10.js','spire-assembly-v10.js','spire-render-v10.js']){
  const s=fs.readFileSync('public/game/scripts/'+name,'utf8');
  for(const forbidden of ['world-data','five-peaks','modular-course-v040','true-peak-mesh-v041','cliff-texture.png','rock-slate-seamless.png','mountain-background.jpg','art-packs-v031'])
   assert.ok(!s.includes(forbidden),name+' reused '+forbidden);
 }
});
test('new textured rock/scaffold/ice/ladder renderer draws generated assemblies without missing APIs',()=>{
 const ctx={save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},clip(){},fillRect(){},clearRect(){},fill(){},stroke(){},strokeRect(){},
 createLinearGradient(){return {addColorStop(){}};}};
 for(let i=1;i<=40;i++)R.draw(ctx,A.assemble(i));
});
