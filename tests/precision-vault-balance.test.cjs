const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
function runtime(){
 const ctx=vm.createContext({Image:class Image{},document:{getElementById:()=>null}});
 for(const n of ['physics.js','world-data.js','course-engine.js','pole-dynamics.js'])
  vm.runInContext(fs.readFileSync('public/game/scripts/'+n,'utf8'),ctx,{filename:n});
 vm.runInContext('applyRoute(0)',ctx);
 return s=>vm.runInContext(s,ctx);
}
function fullFlight(run,speed,phase){
 return run(`(()=>{
  const x=spires[0].summit[1]-125,y=spires[0].summit[2]-22;
  const v=PolePhysicsEngine.initVault(x,y,${speed},0,x+120,y+22,cfg);
  const r=PolePhysicsEngine.stepVault(v,v.rideDuration*${phase},cfg);
  const k=PolePhysicsEngine.calculateReleaseVelocity(r.nextVx,r.nextVy,r.state,cfg);
  let xx=r.nextPx,yy=r.nextPy,vy=k.vy,highest=yy,landing=null;
  const dt=cfg.arcadeFlightTempo/120;
  for(let j=0;j<540;j++){
   const prev=yy;vy+=cfg.gravity*dt;xx+=k.vx*dt;yy+=vy*dt;
   highest=Math.min(highest,yy);
   if(vy>=0&&prev<=y&&yy>=y){landing=xx;break}
  }
  return {range:Math.round(landing-x),height:Math.round(y-highest),
   vx:k.vx,vy:k.vy};
 })()`);
}
test('Pure vertical release remains physically usable, with minimal horizontal travel',()=>{
 const run=runtime();
 const vertical=fullFlight(run,450,.20),balanced=fullFlight(run,450,.55);
 assert.ok(vertical.range>=0&&vertical.range<75,'vertical control drifts sideways');
 assert.ok(vertical.height>450,'vertical vault has no meaningful height');
 assert.ok(vertical.height>balanced.height+110);
 assert.ok(Math.abs(vertical.vx)<5,'early release should have an almost vertical impulse');
 const repeat=fullFlight(run,450,.20);
 assert.deepEqual(Array.from(Object.values(vertical)),Array.from(Object.values(repeat)));
});
test('Range is useful but cannot bridge whole mountains; late releases visibly lose energy',()=>{
 const run=runtime();
 const middle=fullFlight(run,450,.55),late=fullFlight(run,450,.85),
  overheld=fullFlight(run,450,1.15),slow=fullFlight(run,320,.55);
 assert.ok(middle.range>775&&middle.range<960,'long-range release is unbalanced');
 assert.ok(middle.range>late.range+225,'release timing has little control over range');
 assert.ok(middle.range>slow.range+300,'run-up momentum is not consequential');
 assert.ok(late.range>overheld.range*1.45,'overheld pole is not punishing');
 let most=0;
 for(let tick=14;tick<=118;tick+=2)
  most=Math.max(most,fullFlight(run,450,tick/100).range);
 assert.ok(most<985,'one leap can skip entire climbing sections again: '+most);
});
test('Every receiving summit requires a real platform/ice approach, not a direct vault shortcut',()=>{
 const run=runtime();
 const result=run(`(()=>{
  const result=[];
  for(let stage=1;stage<spires.length;stage++){
   const takeoff=spires[stage-1].summit,target=spires[stage];
   const surfaces=[...target.ledges,target.summit];
   let direct=0,ledgeHits=0;
   for(const offset of [120,140,170,200])
    for(const speed of [300,375,450])
     for(let tick=36;tick<=205;tick+=6){
      const x=takeoff[1]-offset,y=takeoff[2]-22;
      const s=PolePhysicsEngine.initVault(x,y,speed,0,x+120,takeoff[2],cfg);
      const r=PolePhysicsEngine.stepVault(s,tick/120,cfg);
      const k=PolePhysicsEngine.calculateReleaseVelocity(r.nextVx,r.nextVy,r.state,cfg);
      let xx=r.nextPx,yy=r.nextPy,vy=k.vy,hit=-1,dt=cfg.arcadeFlightTempo/120;
      for(let j=0;j<500&&hit<0;j++){
       const old=yy+22;vy+=cfg.gravity*dt;xx+=k.vx*dt;yy+=vy*dt;
       if(vy<0)continue;
       for(let id=0;id<surfaces.length;id++){
        const pl=surfaces[id];
        if(old<=pl[2]+3&&yy+22>=pl[2]-4&&
           xx>=pl[0]+3&&xx<=pl[1]-3){hit=id;break}
       }
       if(xx>target.summit[1]+250||yy>1850)break;
      }
      if(hit===surfaces.length-1)direct++;
      else if(hit>=0)ledgeHits++;
     }
   result.push({stage,direct,ledgeHits});
  }
  return result;
 })()`);
 for(const peak of result){
  assert.equal(peak.direct,0,'direct summit bypass on receiving peak '+peak.stage);
  assert.ok(peak.ledgeHits>4,'no viable lower landing on peak '+peak.stage);
 }
});
test('All five peaks retain rock-supported ledges and verified checkpoint accessibility',()=>{
 const run=runtime(),a=run('auditPlayableCourse()'),g=run('compilePhysicalCourseGraph()');
 assert.equal(a.valid,true,a.failures.join('; '));
 assert.equal(g.valid,true,g.issues.join('; '));
 assert.equal(run('spires.length'),5);
 assert.equal(run('FEATURED_COURSE.campaignSize'),100);
 assert.equal(run('spires[2].ledges.length'),1);
 assert.equal(run('spires[4].ledges.length'),1);
 assert.ok(a.summary[1].landings[0]>=5,'first camp is effectively unreachable');
 assert.ok(a.summary[3].landings[0]>=5,'last camp is effectively unreachable');
 for(const stage of [1,3]){
  const geometry=run('spires['+stage+']');
  assert.ok(geometry.summit[0]>Math.min(...geometry.ledges.map(l=>l[0])),
   'snowy walkable crest once again extends over lower cliff ledges');
 }
});
