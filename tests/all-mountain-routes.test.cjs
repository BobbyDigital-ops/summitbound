const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const ctx=vm.createContext({Image:class Image{},document:{getElementById:()=>null},platforms:[]});
for(const script of ['physics.js','world-data.js'])
 vm.runInContext(fs.readFileSync('public/game/scripts/'+script,'utf8'),ctx);
test('all 997 deterministic routes: every shelf distinct, reachable, and climber-exitable',()=>{
 const counts={2:0,3:0,4:0};
 let closeHigh=0,farHigh=0,lowWidth=Infinity,highWidth=0,minRiseSpread=Infinity;
 for(let seed=0;seed<997;seed++){
  vm.runInContext('applyRoute('+seed+')',ctx);
  const ss=vm.runInContext('spires',ctx);
  for(let i=1;i<=3;i++){
   const ledges=ss[i].ledges,prior=ss[i-1].summit,peak=ss[i].summit;
   assert.ok(ledges.length>=2&&ledges.length<=4,'route '+seed+' stage '+i+' has no alternatives');
   counts[ledges.length]++;
   const sorted=[...ledges].sort((a,b)=>a[2]-b[2]);
   const heights=ledges.map(t=>t[2]),lefts=ledges.map(t=>t[0]),ends=ledges.map(t=>t[1]);
   const spread=Math.max(...heights)-Math.min(...heights);
   minRiseSpread=Math.min(minRiseSpread,spread);
   assert.ok(spread>=310,'route '+seed+' stage '+i+' has visually level shelves');
   assert.ok(Math.max(...lefts)-Math.min(...lefts)>=165,
    'route '+seed+' stage '+i+' lacks horizontal difference');
   for(let j=1;j<sorted.length;j++)
    assert.ok(sorted[j][2]-sorted[j-1][2]>=(ledges.length===4?29:40),
     'route '+seed+' stage '+i+' has two shelves too close in height');
   for(const t of ledges){
    lowWidth=Math.min(lowWidth,t[1]-t[0]);highWidth=Math.max(highWidth,t[1]-t[0]);
    assert.ok(t[0]-prior[1]>=365,'unintentionally tiny chasm');
    assert.ok(t[2]<prior[2]+375&&t[2]>peak[2]+68,
     'invalid mountain landing or summit climb height');
    const ice=vm.runInContext('iceClimbPoints('+i+','+ledges.indexOf(t)+')',ctx);
    assert.ok(ice.length>=3,'missing climb for shelf');
    for(let k=1;k<ice.length;k++)assert.ok(ice[k-1].y>ice[k].y,
     'shared ice section is not continuously ascending');
    assert.ok(ice.at(-1).x>=peak[0]+40&&ice.at(-1).x<=peak[1]-85,
     'ice route does not exit onto summit');
   }
   assert.ok(ledges[0][2]>prior[2]+145&&ledges.at(-1)[2]<prior[2]-75,
    'mountain missing one high and one genuinely low landing');
   assert.ok(peak[0]>ledges.at(-1)[0],
    'summit crest does not rise beyond highest exposed shelf');
   assert.ok(vm.runInContext('viableShelves(spires['+i+'].ledges,spires['+(i-1)+'].summit)',ctx),
    'route '+seed+' stage '+i+' is unreachable under actual vault flight/first contact');
   const hi=ledges.find(t=>t[4]==='High'),lo=ledges.find(t=>t[4]==='Low');
   if(hi[0]<lo[0])closeHigh++;else farHigh++;
  }
  const c=ss[4].cave;
  assert.ok(c.floor<ss[3].summit[2],'final cave is not uphill');
  assert.ok(c.left-ss[3].summit[1]>=540,'cave chasm collapsed');
 }
 assert.ok(counts[3]>counts[2]*2&&counts[3]>counts[4]*2,
  'three-choice mountains are not the majority');
 assert.ok(counts[2]>0&&counts[4]>0,'rare 2/4 choice mountains missing');
 assert.ok(closeHigh>0&&farHigh>0,'height dictates horizontal distance');
 const fallbacks=vm.runInContext('generatorFallbacks',ctx);
 assert.ok(fallbacks<30,'too many layouts require known-good fallback: '+fallbacks);
 console.log('Route sweep:',JSON.stringify({counts,closeHigh,farHigh,lowWidth,highWidth,minRiseSpread,fallbacks}));
});
