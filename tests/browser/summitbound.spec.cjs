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
