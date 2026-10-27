const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const ctx=vm.createContext({Image:class Image{},document:{getElementById:()=>null},platforms:[]});
for(const name of ['physics.js','world-data.js'])
 vm.runInContext(fs.readFileSync('public/game/scripts/'+name,'utf8'),ctx);
vm.runInContext(`
 function platform(id,l,r,t,s='snow',extra={}){
  return {id,x:(l+r)/2,y:t+60,width:r-l,height:120,
   left:l,right:r,top:t,surfaceType:s,...extra};
 }
 for(let i=0;i<spires.length;i++){
  const m=spires[i];
  platforms.push(platform('s'+i,...m.summit,{kind:'summit',spire:i}));
  if(m.cave)platforms.push(platform('cave4',m.cave.left,m.cave.right,
   m.cave.floor,'rock',{kind:'cave',spire:4}));
 }
`,ctx);
test('procedural routes are deterministic, varied, and maintain live collision geometry',()=>{
 const configurations=new Set(),topHeights=new Set(),widths=new Set();
 let highNearLowFar=0,lowNearHighFar=0;
 for(const seed of [...Array.from({length:85},(_,i)=>i),99,250,512,996]){
  vm.runInContext('applyRoute('+seed+')',ctx);
  const stages=vm.runInContext('spires',ctx);
  const signature=JSON.stringify(stages.map(s=>[s.summit,s.ledges,s.cave]));
  configurations.add(signature);
  for(let i=1;i<=3;i++){
   const m=stages[i],prior=stages[i-1],ledges=m.ledges;
   const safe=ctx.platforms.find(p=>p.id==='s'+i);
   assert.deepEqual([safe.left,safe.right,safe.top],
    Array.from(m.summit.slice(0,3)),'summit collider not regenerated');
   topHeights.add(m.summit[2]);widths.add(Math.round(m.summit[1]-m.summit[0]));
   assert.ok(ledges.length>=2&&ledges.length<=4);
   if(seed===0)assert.equal(ledges.length,3,'default route must show three choices');
   const elevations=[...ledges].map(t=>t[2]).sort((a,b)=>a-b);
   assert.ok(elevations.at(-1)-elevations[0]>=310,
    'shelves are too level to read as separate landing routes');
   for(let j=1;j<elevations.length;j++)assert.ok(
    elevations[j]-elevations[j-1]>=(ledges.length===4?28:40),
    'shelf elevation levels visually overlap');
   const lengths=ledges.map(t=>t[1]-t[0]);
   assert.ok(Math.max(...lengths)-Math.min(...lengths)>=38,
    'platform widths lack clear visual variety');
   if(seed<9)assert.ok(ledges.length>=2,'ordinary route must offer alternatives');
   assert.equal(ctx.platforms.filter(p=>p.kind==='ledge'&&p.spire===i).length,
    ledges.length,'stale or missing ledge collision');
   for(const t of ledges){
    assert.ok(t[0]-prior.summit[1]>=385,'short unchallenging chasm');
    assert.ok(t[2]<prior.summit[2]+375&&t[2]>m.summit[2]+68,'invalid safe descent or summit climb');
    assert.ok(t[1]-t[0]>=95,'shelf too narrow to be a landing');
    assert.ok(m.summit[1]>t[1]+210,'no summit runup after the climb');
   }
   const low=ledges.find(t=>t[4]==='Low'),high=ledges.find(t=>t[4]==='High');
   if(low&&high){
    if(high[0]<low[0])highNearLowFar++;else lowNearHighFar++;
   }
  }
 }
 assert.equal(configurations.size,89,'different seeds repeated identical mountains');
 assert.ok(topHeights.size>20,'mountain height is not varied');
 assert.ok(widths.size>65,'mountain width is not varied');
 assert.ok(highNearLowFar>0&&lowNearHighFar>0,
  'height incorrectly dictates jump distance');
 vm.runInContext('applyRoute(17)',ctx);
 const before=JSON.stringify(vm.runInContext('spires.map(s=>[s.summit,s.ledges,s.cave])',ctx));
 vm.runInContext('applyRoute(18);applyRoute(17)',ctx);
 const after=JSON.stringify(vm.runInContext('spires.map(s=>[s.summit,s.ledges,s.cave])',ctx));
 assert.equal(after,before,'route changed across retries');
});
