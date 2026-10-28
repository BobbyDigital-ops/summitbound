const {test,expect}=require('@playwright/test');
const url='/game/summit-leap-v081.html';
test('game starts with a painted canvas, active course and zero browser errors',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);await expect(page.locator('#game')).toBeVisible();
 await expect(page.locator('#stage')).toContainText('FIVE PEAKS');
 await page.waitForTimeout(700);
 const result=await page.locator('#game').evaluate(c=>({width:c.width,height:c.height,alpha:c.getContext('2d').getImageData(Math.floor(c.width/2),Math.floor(c.height/2),1,1).data[3]}));
 expect(result.width).toBeGreaterThan(100);expect(result.height).toBeGreaterThan(100);
 expect(result.alpha).toBeGreaterThan(0);expect(errors).toEqual([]);
});
test('run input moves climber, renders multiple sprite frames and releases pole',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);
 const before=await page.evaluate(()=>({x:p.x,state:p.state,sprite:typeof drawSpriteMountaineer}));
 expect(before.sprite).toBe('function');
 await page.keyboard.down('KeyD');await page.waitForTimeout(480);await page.keyboard.up('KeyD');
 const after=await page.evaluate(()=>({x:p.x,distance:p.runDistance,state:p.state,frame:spritePoseFor(p),atlasLoaded:climberAtlasV033.complete&&climberAtlasV033.naturalWidth>0}));
 expect(after.x).toBeGreaterThan(before.x+8);
 expect(after.distance).toBeGreaterThan(0);
 expect(after.atlasLoaded).toBe(true);
 // Fixed-sequence deterministic screenshots of the actual game renderer.
 await page.screenshot({path:'test-results/summitbound-running.png'});
 expect(errors).toEqual([]);
});
test('reaching pose aims forward at a real ledge, without DOM errors',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);
 const data=await page.evaluate(()=>{
  const ledge=platforms.find(a=>a.kind==='ledge'&&a.spire===2);
  p.x=ledge.left-36;p.y=ledge.top+18;p.vx=120;p.vy=110;
  window.SUMMITBOUND_LEDGE_GRIP_ENABLED=true;
  p.facingDir=1;p.state='FALLING';p.standingOn=null;catchUsed=false;
  const approach=axeCatchApproach();
  return {approach:!!approach,pose:spritePoseFor(p),expected:CLIMBER_POSES.reach};
 });
 expect(data.approach).toBe(true);expect(data.pose).toBe(data.expected);
 await page.waitForTimeout(60);
 await page.screenshot({path:'test-results/summitbound-axe-reach.png'});
 expect(errors).toEqual([]);
});
test('art style controls and power display remain wired',async({page})=>{
 await page.goto(url);
 await page.locator('#tuneToggle').click();
 const toggle=page.locator('#artPackToggle');
 await expect(toggle).toBeVisible();
 const before=await toggle.innerText();await toggle.click();
 expect(await toggle.innerText()).not.toBe(before);
 const meter=await page.evaluate(()=>({bar:!!document.getElementById('bar'),needle:!!document.getElementById('needle'),labels:document.querySelector('#meter .label')?.innerText}));
 expect(meter.bar&&meter.needle).toBe(true);
 expect(meter.labels).toMatch(/MAX HEIGHT/);
});

test('running animation changes actual character frame across stride',async({page})=>{
 await page.goto(url);
 const x=await page.evaluate(()=>{
  p.state='RUNNING';p.standingOn='s0';p.vx=350;
  const indexes=[0,32,64,96,128].map(d=>{p.runDistance=d;return spritePoseFor(p)});
  return indexes;
 });
 expect(x).toEqual([1,2,3,4,1]);
});
test('airborne axe-reach animation extends horizontally toward a real ledge',async({page})=>{
 await page.goto(url);
 const x=await page.evaluate(()=>{
  window.SUMMITBOUND_LEDGE_GRIP_ENABLED=true;
  const edge=platforms.find(q=>q.kind==='ledge'&&q.spire===2);
  p.state='FALLING';p.vy=130;p.vx=200;p.facingDir=1;
  p.x=edge.left-34;p.y=edge.top+20;p.standingOn=null;
  return {approach:axeCatchApproach(true)?.ready,pose:spritePoseFor(p)};
 });
 expect(x.approach).toBe(true);
 expect(x.pose).toBe(8);
});

test('v0.36 approved character rig renders instead of the old sprite and axes stay attached',async({page})=>{
 await page.goto(url);
 const result=await page.evaluate(()=>({rig:typeof drawRigMountaineer,tune:SUMMITBOUND_RUN_TUNING,script:!!document.querySelector('script[src$="character-rig-v036.js"]')}));
 expect(result.rig).toBe('function');expect(result.script).toBe(true);
 expect(result.tune).toEqual({stride:1.25,clearance:1.25});
 await page.screenshot({path:'test-results/v036-character-integrated.png'});
});

test('v0.36.1 33-percent character downscale and detailed accessories',async({page})=>{
 await page.goto(url);
 const src=await page.evaluate(async()=>await (await fetch('/game/scripts/character-rig-v036.js')).text());
 expect(src).toContain("const unit=.64*.67");
 expect(src).toContain("crampon cleats");
 expect(src).toContain("Helmet crown");
 expect(await page.evaluate(()=>typeof drawRigMountaineer)).toBe('function');
});

test('grab latches at a real rim and three alternating strikes recover',async({page})=>{
 await page.goto(url);
 const r=await page.evaluate(()=>{
  window.SUMMITBOUND_LEDGE_GRIP_ENABLED=true;
  const pl=platforms.find(x=>x.kind==='ledge'&&x.spire===2);
  p.state='FALLING';p.standingOn=null;p.vx=150;p.vy=120;
  p.facingDir=1;p.x=pl.left-34;p.y=pl.top+25;
  catchUsed=false;catchQueuedUntil=-1;
  const near=axeCatchOpportunity();
  const latched=attemptAxeCatch();
  const state=p.state,edge=p.catchLedge?.edge;
  let strokes=[];
  for(const side of [-1,1,-1]){elapsed+=.15;strokes.push(axeCatchStrike(side));}
  const afterStrikes=p.state,afterStrokes=p.mantle?.elapsed;
  for(let i=0;i<70;i++){elapsed+=1/60;updatePullUp(1/60);}
  return {ready:!!near,latched,state,edge,strokes,afterStrikes,afterStrokes,final:p.state,on:p.standingOn,expected:pl.id};
 });
 expect(r.ready).toBe(true);expect(r.latched).toBe(true);
 expect(r.state).toBe('HANGING');expect(r.strokes).toEqual([true,true,true]);
 expect(r.afterStrikes).toBe('PULLING_UP');expect(r.afterStrokes).toBe(0);
 expect(r.final).toBe('GROUNDED');expect(r.on).toBe(r.expected);
});
test('miss far from ledge does not consume entire grab opportunity',async({page})=>{
 await page.goto(url);
 const r=await page.evaluate(()=>{
  window.SUMMITBOUND_LEDGE_GRIP_ENABLED=true;
  p.state='FALLING';p.standingOn=null;p.vy=120;p.x=-10000;p.y=-10000;
  catchUsed=false;catchQueuedUntil=-1;const hit=attemptAxeCatch();
  return {hit,used:catchUsed};
 });expect(r.hit).toBe(false);expect(r.used).toBe(false);
});

test('mantle is a progressive visible move, not a frame teleport',async({page})=>{
 await page.goto(url);
 const r=await page.evaluate(()=>{
  const pl=platforms.find(x=>x.kind==='ledge'&&x.spire===2);
  p.state='PULLING_UP';p.x=pl.left-20;p.y=pl.top+18;
  p.vx=0;p.vy=0;p.standingOn=null;
  p.mantle={surfaceId:pl.id,fromX:p.x,fromY:p.y,toX:pl.left+12,toY:pl.top-22,side:1,elapsed:0,duration:.95};
  const start={x:p.x,y:p.y};updatePullUp(.35);
  const middle={x:p.x,y:p.y,state:p.state};
  updatePullUp(.7);
  return {start,middle,finish:{x:p.x,y:p.y,state:p.state,standingOn:p.standingOn},surface:pl.id};
 });
 expect(r.middle.state).toBe('PULLING_UP');
 expect(r.middle.x).toBeGreaterThan(r.start.x);
 expect(r.middle.y).toBeLessThan(r.start.y);
 expect(r.finish.state).toBe('GROUNDED');
 expect(r.finish.standingOn).toBe(r.surface);
});

test('Original and Challenge have distinct real collision courses; toggle restores original',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);
 await page.locator('#tuneToggle').click();
 const button=page.locator('#courseToggle');
 await expect(button).toContainText('Modular');
 await button.click(); // preserve tested Original/Challenge back-compat
 await expect(button).toContainText('Original');
 const original=await page.evaluate(()=>JSON.stringify(spires.map(q=>({summit:q.summit,ledges:q.ledges,ridge:q.ridgeArrival}))));
 await button.click();
 await expect(button).toContainText('Challenge');
 await expect(page.locator('#routeLabel')).toContainText('CHALLENGE');
 const changed=await page.evaluate(()=>({
  geometry:JSON.stringify(spires.map(q=>({summit:q.summit,ledges:q.ledges,ridge:q.ridgeArrival}))),
  grades:SummitDifficulty.gradeCourse(spires,shelfTimingProfiles),
  audit:auditPlayableCourse(),graph:compilePhysicalCourseGraph(),
  currentState:p.state
 }));
 expect(changed.geometry).not.toBe(original);
 expect(changed.grades.valid).toBe(true);
 expect(changed.audit.valid).toBe(true);
 expect(changed.graph.valid).toBe(true);
 expect(changed.currentState).toBe('GROUNDED');
 await expect(page.locator('#difficultyReadout')).toContainText('Firespine');
 await button.click(); // cycle Challenge -> Modular
 await button.click(); // cycle Modular -> Original
 await expect(page.locator('#routeLabel')).toContainText('ORIGINAL');
 const restored=await page.evaluate(()=>JSON.stringify(spires.map(q=>({summit:q.summit,ledges:q.ledges,ridge:q.ridgeArrival}))));
 expect(restored).toBe(original);
 expect(errors).toEqual([]);
});


test('Peak Forge is default and its pieces attach only to real collision surfaces',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);await expect(page.locator('#stage')).toContainText('FIVE PEAKS');
 const data=await page.evaluate(()=>({
  pack:window.getSummitboundArtPack(),
  engine:activeSummitCourse,
  grip:window.SUMMITBOUND_LEDGE_GRIP_ENABLED,
  audits:window.SummitPeakForge.allAudits(),
  manifests:spires.map((_,i)=>window.SummitPeakForge.manifest(i)),
  ground:platforms.filter(pl=>pl.kind==='ledge').map(pl=>pl.id),
  canvas:[canvas.width,canvas.height]
 }));
 expect(data.pack).toBe('cinematic');
 expect(data.engine).toBe('modular');
 expect(data.grip).toBe(false);
 expect(data.manifests).toHaveLength(5);
 expect(data.audits.every(a=>a.valid)).toBe(true);
 for(const m of data.manifests){
  expect(m.pieces.length).toBeGreaterThanOrEqual(3);
  expect(m.pieces.length).toBeLessThanOrEqual(7);
  expect(m.slots.every(s=>data.ground.includes(s.collisionId))).toBe(true);
  expect(m.sockets.every(s=>[72,132,190].includes(s.length))).toBe(true);
 }
 await page.screenshot({path:'test-results/peak-forge-full-course.png'});
 expect(errors).toEqual([]);
});
test('Peak Forge painter switches back to originals and restores modular view',async({page})=>{
 await page.goto(url);await page.locator('#tuneToggle').click();
 const button=page.locator('#artPackToggle');
 await expect(button).toContainText('Cinematic');
 const before=await page.evaluate(()=>({x:p.x,time:elapsed,mode:window.getSummitboundArtPack()}));
 await button.click();await expect(button).toContainText('Modular');
 await button.click();await expect(button).toContainText('Painterly');
 await button.click();await expect(button).toContainText('Cinematic');
 const after=await page.evaluate(()=>({x:p.x,time:elapsed,mode:window.getSummitboundArtPack()}));
 expect(after.x).toBeCloseTo(before.x,1);
 expect(after.time).toBeGreaterThanOrEqual(before.time);
 await page.screenshot({path:'test-results/peak-forge-modular-return.png'});
});
test('Real Five Peaks movement and the retired catch mechanic remain safe',async({page})=>{
 await page.goto(url);
 const before=await page.evaluate(()=>p.x);
 await page.keyboard.down('KeyD');await page.waitForTimeout(340);await page.keyboard.up('KeyD');
 const moved=await page.evaluate(()=>({x:p.x,ground:platforms.some(pl=>pl.id===p.standingOn)}));
 expect(moved.x).toBeGreaterThan(before);
 expect(moved.ground).toBe(true);
 const grip=await page.evaluate(()=>{
  const ledge=platforms.find(pl=>pl.kind==='ledge');
  p.x=ledge.left-34;p.y=ledge.top+18;p.vy=100;p.state='FALLING';p.facingDir=1;
  return {near:axeCatchApproach(),grab:attemptAxeCatch()};
 });
 expect(grip.near).toBeNull();expect(grip.grab).toBe(false);
 await expect(page.locator('#catch')).toBeHidden();
});
test('Modular art remains coherent after switching Original / Challenge geometry',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);await page.locator('#tuneToggle').click();
 const button=page.locator('#courseToggle');
 await button.click(); // Original first
 const before=await page.evaluate(()=>window.SummitPeakForge.manifest(4));
 await button.click();await expect(button).toContainText('Challenge');
 const data=await page.evaluate(()=>({m:window.SummitPeakForge.manifest(4),a:window.SummitPeakForge.allAudits()}));
 expect(data.m.pieces.length).toBeGreaterThanOrEqual(3);
 expect(data.a.every(x=>x.valid)).toBe(true);
 expect(data.m.pieces.find(p=>p.role==='landing-extension').x)
 .not.toBe(before.pieces.find(p=>p.role==='landing-extension').x);
 await page.screenshot({path:'test-results/peak-forge-challenge.png'});
 await button.click(); // Challenge -> Modular
 await button.click();await expect(button).toContainText('Original');
 expect(errors).toEqual([]);
});


test('v0.40 modular peaks change REAL platform geometry and certify every ice/climb edge',async({page})=>{
 test.setTimeout(120000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);
 await expect(page.locator('#routeLabel')).toContainText('MODULAR');
 const baseline=await page.evaluate(()=>({
  initial:JSON.stringify(platforms.filter(q=>q.kind==='ledge').map(q=>[q.id,q.left,q.right,q.top])),
  first:SummitModularEngine.auditInstalled(),
  physics:auditPlayableCourse().valid,
  graph:compilePhysicalCourseGraph().valid,
  seed:SummitModularEngine.seed()
 }));
 console.log('MODULAR LIVE AUDIT',JSON.stringify({issues:baseline.first.issues,report:baseline.first.report}));
 expect(baseline.first.valid).toBe(true);
 expect(baseline.first.report.certified).toBe(true);
 expect(baseline.first.report.changes.changed).toBeGreaterThanOrEqual(2);
 expect(baseline.physics).toBe(true);expect(baseline.graph).toBe(true);
 await page.locator('#tuneToggle').click();
 const variants=new Set([baseline.initial]);
 for(let i=0;i<3;i++){
  if(i>0)await page.locator('#tuneToggle').click();
  await page.locator('#regenModular').click();
  const result=await page.evaluate(()=>({
   state:activeSummitCourse,
   geometry:JSON.stringify(platforms.filter(q=>q.kind==='ledge').map(q=>[q.id,q.left,q.right,q.top])),
   report:SummitModularEngine.report(),
   audit:SummitModularEngine.auditInstalled(),
   physics:auditPlayableCourse().valid,
   graph:compilePhysicalCourseGraph().valid,
   on:platforms.some(q=>q.id===p.standingOn)
  }));
  expect(result.state).toBe('modular');
  expect(result.report.certified).toBe(true);
  expect(result.report.changes.changed).toBeGreaterThanOrEqual(2);
  expect(result.audit.valid).toBe(true);
  expect(result.physics).toBe(true);
  expect(result.graph).toBe(true);
  expect(result.on).toBe(true);
  variants.add(result.geometry);
 }
 expect(variants.size).toBeGreaterThanOrEqual(3);
 await page.screenshot({path:'test-results/modular-v040-generated-peak.png'});
 expect(errors).toEqual([]);
});
test('v0.40 restores the exact Original course after a modular regenerate',async({page})=>{
 test.setTimeout(70000);
 await page.goto(url);await page.locator('#tuneToggle').click();
 const toggle=page.locator('#courseToggle');
 await toggle.click();await expect(toggle).toContainText('Original');
 const original=await page.evaluate(()=>JSON.stringify(spires.map(m=>({
  summit:m.summit,ledges:m.ledges,ridge:m.ridgeArrival
 }))));
 await toggle.click();await expect(toggle).toContainText('Challenge');
 await toggle.click();await expect(toggle).toContainText('Modular');
 await page.locator('#regenModular').click();
 await page.locator('#tuneToggle').click();
 await toggle.click();await expect(toggle).toContainText('Original');
 const restored=await page.evaluate(()=>JSON.stringify(spires.map(m=>({
  summit:m.summit,ledges:m.ledges,ridge:m.ridgeArrival
 }))));
 expect(restored).toBe(original);
});

test('five physically assembled peaks each render a separate inspected scene',async({page})=>{
 test.setTimeout(90000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);await expect(page.locator('#routeLabel')).toContainText('MODULAR');
 for(let i=0;i<5;i++){
  const data=await page.evaluate(index=>{
   const m=spires[index],upper=m.ridgeArrival||m.summit;
   const low=m.ledges?.[0]||upper;
   const zoom=getZoom();
   camera.x=low[0]-.24*innerWidth/zoom;
   camera.y=(upper[2]+low[2])*.5-.53*innerHeight/zoom;
   draw();
   return {pieces:m.moduleAssembly?.pieces.length,
    realSurfaces:platforms.filter(pl=>pl.spire===index).length,
    ice:index===0?[]:iceRouteNetwork(index).map(route=>route.points.length)};
  },i);
  expect(data.pieces).toBeGreaterThanOrEqual(3);
  expect(data.pieces).toBeLessThanOrEqual(7);
  expect(data.realSurfaces).toBeGreaterThanOrEqual(2);
  if(i>0)expect(data.ice.length).toBeGreaterThan(0);
  await page.screenshot({path:'test-results/modular-peak-'+i+'.png'});
 }
 expect(errors).toEqual([]);
});
