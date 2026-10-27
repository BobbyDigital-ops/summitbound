const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const code=name=>fs.readFileSync('public/game/scripts/'+name,'utf8');

function terrain(){
 const ctx=vm.createContext({Image:class Image{},document:{getElementById:()=>null},platforms:[]});
 for(const file of ['physics.js','world-data.js'])vm.runInContext(code(file),ctx);
 return ctx;
}

test('Phase 4B: release-time and first-contact risk/reward across 997 seeds',()=>{
 const ctx=terrain();
 let good=0,total=0;
 for(let seed=0;seed<997;seed++){
  vm.runInContext('applyRoute('+seed+')',ctx);
  for(let stage=1;stage<=3;stage++){
   const profiles=vm.runInContext(
    'shelfTimingProfiles(spires['+stage+'].ledges,spires['+(stage-1)+'].summit)',ctx);
   assert.ok(profiles.every(p=>p.hits>=3&&p.safe>=2),
    'no physically brakeable landing: '+seed+'/'+stage);
   assert.ok(profiles.every(p=>p.releaseWindows>0),
    'no safe pole-release timing: '+seed+'/'+stage);
   if(vm.runInContext('routeHasMeaningfulRiskReward('+JSON.stringify(profiles)+')',ctx))good++;
   total++;
  }
 }
 assert.equal(total,2991);
 assert.ok(good>=2980,'high landing release windows are not consistently more demanding: '+good+'/'+total);
});

test('Phase 4B: shared ice actually intersects the higher shelf, and never teleports',()=>{
 const ctx=terrain();
 let merged=0;
 for(let seed=0;seed<997;seed++){
  vm.runInContext('applyRoute('+seed+')',ctx);
  const mountains=vm.runInContext('spires',ctx);
  for(let stage=1;stage<=3;stage++){
   const routes=vm.runInContext('iceRouteNetwork('+stage+')',ctx);
   for(const route of routes){
    const pts=route.points;
    for(let k=1;k<pts.length;k++)
     assert.ok(pts[k-1].y>pts[k].y,'ice must ascend without reversal');
    if(route.sharedWith===null)continue;
    merged++;
    const parent=routes[route.sharedWith],ledge=mountains[stage].ledges[route.sharedWith];
    const baseline=vm.runInContext('independentIcePoints('+stage+','+route.tier+')',ctx);
    const x=vm.runInContext('iceXOnPath('+JSON.stringify(baseline)+','+(ledge[2]-22)+')',ctx);
    assert.ok(x>=ledge[0]+10&&x<=ledge[1]-12,'junction misses ledge');
    assert.ok(Math.abs(x-(ledge[1]-30))<=80,'junction crosses a detached ice gap');
    assert.deepEqual(pts.slice(-parent.points.length).map(q=>[q.x,q.y]),
     parent.points.map(q=>[q.x,q.y]),'shared route does not physically join');
   }
  }
 }
 assert.ok(merged>700,'most logical ice connections did not consolidate');
});

function game(){
 const elements=new Map();
 const document={
  getElementById(id){
   if(!elements.has(id))elements.set(id,{style:{},classList:{add(){},remove(){}},
    textContent:'',hidden:false,getContext(){return {}},addEventListener(){}});
   return elements.get(id);
  },
  querySelectorAll(){return [];}
 };
 const ctx=vm.createContext({Image:class Image{},document,
  performance:{now:()=>1},innerWidth:1024,innerHeight:768,navigator:{vibrate(){}}});
 for(const file of ['physics.js','world-data.js','game-state.js','simulation.js'])
  vm.runInContext(code(file),ctx,{filename:file});
 return ctx;
}
const act=(ctx,expression)=>vm.runInContext(expression,ctx);
test('Phase 4B: climb can pause, reverse, and safely dismount when descending',()=>{
 for(const [seed,stage,tier] of [[0,1,0],[1,2,0],[7,3,1],[42,1,2]]){
  const ctx=game();
  act(ctx,'applyRoute('+seed+')');
  act(ctx,`{
   const pl=platforms.find(e=>e.id==='l'+${stage}+'-'+${tier});
   p={x:pl.right-30,y:pl.top-22,vx:0,vy:0,
    state:'GROUNDED',surface:pl.surfaceType,standingOn:pl.id,
    groundedFor:.5,climb:null};atStage=${stage-1};lastSafeStage=${stage-1};
   keys.clear();keys.add('w');
  }`);
  const before=act(ctx,'(()=>{for(let i=0;i<160;i++)tick(1/120);return p.y})()');
  assert.equal(act(ctx,'p.state'),'CLIMBING');
  const still=act(ctx,'(()=>{keys.delete("w");for(let i=0;i<30;i++)tick(1/120);return p.y})()');
  assert.equal(before,still,'climber moves after releasing Up');
  const lower=act(ctx,'(()=>{keys.add("s");for(let i=0;i<60;i++)tick(1/120);return p.y})()');
  assert.ok(lower>still,'Down does not descend');
  const reversed=act(ctx,'(()=>{keys.delete("s");keys.add("w");for(let i=0;i<80;i++)tick(1/120);return p.y})()');
  assert.ok(reversed<lower,'Up cannot reverse the descent');
  act(ctx,'keys.clear()');
  const rest=act(ctx,'p.y');
  act(ctx,'for(let i=0;i<100;i++)tick(1/120)');
  assert.equal(act(ctx,'p.y'),rest,'climber drifts while resting on ice');
  const landed=act(ctx,`(()=>{
   keys.add('s');let n=0;
   while(p.state==='CLIMBING'&&n++<2400)tick(1/120);
   return [p.state,p.standingOn,p.vx,p.vy];
  })()`);
  assert.equal(landed[0],'GROUNDED','down climb never completes');
  assert.equal(landed[1],'l'+stage+'-'+tier,'descent landed on wrong shelf');
  assert.equal(landed[2],0);assert.equal(landed[3],0);
 }
});

test('Phase 4B: descending from summit chooses a legitimate ledge',()=>{
 const ctx=game();
 act(ctx,'applyRoute(0)');
 for(const stage of [1,2,3]){
  act(ctx,`{
   const route=iceRouteNetwork(${stage}).slice()
    .sort((a,b)=>a.points[0].y-b.points[0].y)[0];
   const top=platforms.find(pl=>pl.id==='s'+${stage});
   p={x:route.points.at(-1).x,y:top.top-22,vx:0,vy:0,
    state:'GROUNDED',surface:'snow',standingOn:top.id,groundedFor:.5,climb:null};
   keys.clear();keys.add('s');tick(1/120);
  }`);
  assert.equal(act(ctx,'p.state'),'CLIMBING','summit has no ice descent');
  const result=act(ctx,`(()=>{
   let n=0;
   while(p.state==='CLIMBING'&&n++<2400)tick(1/120);
   return [p.state,p.standingOn];
  })()`);
  assert.equal(result[0],'GROUNDED');
  assert.match(result[1],new RegExp('^l'+stage+'-'));
 }
});

test('Phase 4B: shared ice allows descent from a higher shelf to a lower shelf',()=>{
 const ctx=game();
 act(ctx,'applyRoute(0)');
 const joining=act(ctx,`(()=>{
  for(let stage=1;stage<=3;stage++){
   const child=iceRouteNetwork(stage).find(route=>route.sharedWith!==null);
   if(child)return [stage,child.tier,child.sharedWith];
  }return null;
 })()`);
 assert.ok(joining,'missing seed with shared ice');
 const [stage,child,parent]=joining;
 act(ctx,`{
  const pl=platforms.find(q=>q.id==='l'+${stage}+'-'+${parent});
  p={x:pl.right-30,y:pl.top-22,vx:0,vy:0,
   state:'GROUNDED',surface:pl.surfaceType,standingOn:pl.id,groundedFor:.5,climb:null};
  keys.clear();keys.add('s');tick(1/120);
 }`);
 assert.equal(act(ctx,'p.state'),'CLIMBING');
 assert.equal(act(ctx,'p.climb.tierIndex'),child);
 const landing=act(ctx,`(()=>{
  let n=0;
  while(p.state==='CLIMBING'&&n++<2400)tick(1/120);
  return [p.state,p.standingOn];
 })()`);
 assert.deepEqual(Array.from(landing),['GROUNDED','l'+stage+'-'+child]);
});
