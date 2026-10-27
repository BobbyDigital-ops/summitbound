const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const code=n=>fs.readFileSync('public/game/scripts/'+n,'utf8');
function physicsContext(){
 const ctx=vm.createContext({Image:class Image{},document:{getElementById:()=>null}});
 for(const file of ['physics.js','world-data.js'])vm.runInContext(code(file),ctx);
 return {ctx,run:s=>vm.runInContext(s,ctx)};
}
function gameContext(){
 const els=new Map();
 const document={getElementById(id){if(!els.has(id))els.set(id,{textContent:'',
  style:{},hidden:false,classList:{add(){},remove(){}},getContext(){return {}},addEventListener(){}});
  return els.get(id);},querySelectorAll(){return []}};
 const ctx=vm.createContext({Image:class Image{},document,
  performance:{now:()=>1},innerWidth:1200,innerHeight:780,
  navigator:{vibrate(){}},localStorage:{getItem(){return null},setItem(){}}});
 for(const file of ['physics.js','world-data.js','game-state.js','time-trial.js',
  'climb-mechanics.js','simulation.js'])vm.runInContext(code(file),ctx,{filename:file});
 return {ctx,run:s=>vm.runInContext(s,ctx),els};
}
test('Phase 8: release range rewards approach speed, controlled loading and precision',()=>{
 const {run}=physicsContext();
 const shot=(speed,u)=>run(`(()=>{
  const s=PolePhysicsEngine.initVault(700,1000-22,${speed},0,820,1000,cfg);
  s.elapsed=s.rideDuration*${u};
  return PolePhysicsEngine.calculateReleaseVelocity(0,0,s,cfg);
 })()`);
 const ideal=shot(360,.68);
 const tooEarly=shot(360,.22),late=shot(360,1.16);
 const slow=shot(170,.68);
 assert.ok(ideal.vx>slow.vx*2,'run-up speed lacks meaningful consequence');
 assert.ok(Math.abs(ideal.vy)>Math.abs(tooEarly.vy)*1.9,'release angle insensitive');
 assert.ok(ideal.vx>late.vx*2,'late release is unrealistically rescued');
 assert.deepEqual(Array.from(Object.values(ideal)),Array.from(Object.values(shot(360,.68))),
  'identical inputs must never have random outcomes');
});
test('Phase 8: alternating strikes give 2-3x the climbing movement of holding Up',()=>{
 const {run}=gameContext();run('applyRoute(0)');
 run(`{
  const pl=platforms.find(pl=>pl.id==='l1-0');
  p={x:pl.right-30,y:pl.top-22,vx:0,vy:0,state:'GROUNDED',
   surface:pl.surfaceType,standingOn:pl.id,groundedFor:.5,climb:null,facingDir:1};
  atStage=0;keys.clear();climbStart(pl);
 }`);
 const before=run('p.y');
 run('keys.add("w");for(let i=0;i<120;i++)tick(1/120)');
 const steady=before-run('p.y');
 run('keys.clear();p.y=p.climb.originY;p.climb.pulse=0;p.climb.lastAxe=0;p.climb.lastAxeAt=-100');
 let hits=0;
 for(let i=0;i<120;i++){
  if(i%18===0){const dir=(Math.floor(i/18)%2===0)?-1:1;
   if(run('iceAxeStrike('+dir+')'))hits++;}
  run('tick(1/120)');
 }
 const rhythmic=before-run('p.y');
 assert.ok(hits>=6);
 assert.ok(rhythmic>steady*1.5,'alternation needs a real speed advantage');
 assert.equal(run('iceAxeStrike('+((Math.floor(119/18)%2===0)?-1:1)+')'),false,
  'repeating the same axe must not increase speed');
});
test('Phase 8: ice exit is an actual world-space summit vertex, not a horizontal slide',()=>{
 const {run}=gameContext();
 for(const seed of [0,1,2,7,42,250,996]){
  run('applyRoute('+seed+')');
  for(let stage=1;stage<=3;stage++){
   const count=run('spires['+stage+'].ledges.length');
   for(let tier=0;tier<count;tier++){
    run(`{
     const pl=platforms.find(p=>p.id==='l'+${stage}+'-'+${tier});
     p={x:pl.right-30,y:pl.top-22,vx:0,vy:0,state:'GROUNDED',
       surface:pl.surfaceType,standingOn:pl.id,groundedFor:.5,climb:null,facingDir:1};
     completed=false;keys.clear();climbStart(pl);
     p.y=p.climb.targetY+.2;keys.add('w');
    }`);
    const lip=run('iceClimbPoints('+stage+','+tier+').at(-1)');
    run('tick(1/120)');
    assert.equal(run('p.state'),'GROUNDED',seed+'/'+stage+'/'+tier+' retains artificial STEP_OFF');
    assert.equal(run('p.standingOn'),'s'+stage);
    assert.ok(Math.abs(run('p.x')-lip.x)<.01,'summit dismount teleports sideways');
    assert.equal(run('p.climb'),null);
   }
  }
 }
});
test('Phase 8: precise swept landing catches unintended real recovery ledge',()=>{
 const {run}=gameContext();run('applyRoute(0)');
 const surface=run('platforms.find(p=>p.id==="l1-0")');
 run(`{
   const ledge=platforms.find(pl=>pl.id==='l1-0');
   p={x:ledge.left+21,y:ledge.top-22-5,vx:470,vy:690,
    state:'FALLING',surface:'snow',standingOn:null,groundedFor:0,climb:null,facingDir:1};
   atStage=0;lastSafeStage=0;keys.clear();completed=false;
 }`);
 run('tick(1/120)');
 assert.equal(run('p.standingOn'),'l1-0','missed collision at high speed');
 assert.equal(run('p.y'),surface.top-22);
});
test('Phase 8: existing golden route seeds retain physically reachable landings',()=>{
 const {run}=physicsContext();
 for(const seed of [0,1,2,7,42,250,996]){
  run('applyRoute('+seed+')');
  for(let stage=1;stage<=3;stage++){
   const prof=run(`shelfTimingProfiles(spires[${stage}].ledges,spires[${stage-1}].summit)`);
   assert.ok(prof.every(p=>p.safe>=2),seed+'/'+stage+' has unreachable shelf');
  }
 }
});
test('Phase 8: a real landing shelf may also be a pole launch surface',()=>{
 const {run}=gameContext();run('applyRoute(0)');
 const found=run(`(()=>{
  const pl=platforms.find(pl=>pl.kind==='ledge'&&pl.right-pl.left>=150);
  p={x:pl.left+9,y:pl.top-22,vx:300,vy:0,state:'GROUNDED',
  surface:pl.surfaceType,standingOn:pl.id,groundedFor:.5,climb:null,facingDir:1};
  plant();return [p.state,pl.id];
 })()`);
 assert.equal(found[0],'RIDING_VAULT','a sufficiently wide real ledge cannot serve as a shortcut');
});

test('Phase 8: A/D keys and mobile left/right buttons translate to axes only while attached',()=>{
 const input=code('input-ui.js');
 const html=fs.readFileSync('public/game/summit-leap-v081.html','utf8');
 assert.match(input,/axeSide&&!keys.has\(k\)&&!keys.has\(c\)/);
 assert.match(input,/iceAxeStrike\(axeSide\)/);
 assert.match(input,/dir==='left'\?-1:1/);
 assert.match(html,/game\/scripts\/climb-mechanics.js/);
 assert.match(html,/alternate A \/ D or ◀ ▶ rapidly/);
});
