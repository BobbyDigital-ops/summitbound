const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const read=name=>fs.readFileSync('public/game/scripts/'+name,'utf8');
function harness(){
 const store=new Map(),elements=new Map();
 const dom={getElementById(id){
  if(!elements.has(id))elements.set(id,{style:{},hidden:false,
   textContent:'',classList:{add(){},remove(){}},getContext(){return {}},addEventListener(){}});
  return elements.get(id);
 },querySelectorAll(){return [];}};
 const ctx=vm.createContext({Image:class Image{},document:dom,
  performance:{now:()=>1},navigator:{vibrate(){}},innerWidth:960,innerHeight:720,
  localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)}});
 for(const file of ['physics.js','world-data.js','game-state.js','time-trial.js','climb-mechanics.js','simulation.js'])
  vm.runInContext(read(file),ctx,{filename:file});
 return {ctx,store,dom,run:s=>vm.runInContext(s,ctx)};
}
test('Phase 4C: time gates follow the selected seed and increase bronze > silver > gold',()=>{
 const {run}=harness();
 for(const seed of [0,1,7,42,996]){
  run('applyRoute('+seed+')');
  const data=run('medalTargets()');
  assert.ok(data.gold>40,'gold ought not to be a no-skill completion');
  assert.ok(data.gold<data.silver&&data.silver<data.bronze);
  const stage=run('stageMedalTargets(1)'),last=run('stageMedalTargets(4)');
  assert.ok(stage.gold<last.gold,'progress gates did not increase');
  assert.equal(last.gold,data.gold,'final split target differs from medal time');
  assert.equal(run('medalForTime('+data.gold+')'),'GOLD');
  assert.equal(run('medalForTime('+data.silver+')'),'SILVER');
  assert.equal(run('medalForTime('+data.bronze+')'),'BRONZE');
  assert.equal(run('medalForTime('+data.bronze+'+1)'),'FINISHED');
 }
});
test('Phase 4C: record a legal 4-gate PB and replay locally on same seed',()=>{
 const {run,store}=harness();
 run('mode="trial";gameReset()');
 run('for(let i=0;i<640;i++){elapsed+=.12;p.x=150+i;p.y=1080-i*.6;trialTick()}');
 run('elapsed=22;trialSplit(1);elapsed=42;trialSplit(2);elapsed=62;trialSplit(3);elapsed=79;trialSplit(4)');
 const message=run('finishTimeTrial()');
 assert.match(message,/Time trial/);
 assert.ok(store.size===1);
 assert.ok(run('trialGhost?.frames.length')>200,'no ghost trajectory saved');
 run('gameReset()');
 assert.equal(run('trialGhost.best'),79);
 const ghost=run('ghostPositionAt(25)');
 assert.ok(ghost&&ghost[1]>150,'no interpolated ghost during race');
 run('trialGhostVisible=false');
 assert.equal(run('ghostPositionAt(25)'),null,'ghost toggle did not hide replay');
});
test('Phase 4C: skip, incomplete gates, and physics tuning cannot forge ranked PBs',()=>{
 const {run,store}=harness();
 run('mode="trial";gameReset();invalidateTimeTrial()');
 run('trialSplit(1);trialSplit(2);trialSplit(3);trialSplit(4);finishTimeTrial()');
 assert.equal(store.size,0,'unranked skip was stored');
 run('gameReset();elapsed=15;trialSplit(4);finishTimeTrial()');
 assert.equal(store.size,0,'missing split history was stored');
 run('gameReset();cfg.gravity=825;elapsed=15;trialTick();');
 assert.equal(run('trialRun.invalid'),true);
 run('trialSplit(1);trialSplit(2);trialSplit(3);trialSplit(4);finishTimeTrial()');
 assert.equal(store.size,0,'modified gravity was ranked');
});
test('Phase 4C: versioned route-specific records reject corrupt or foreign data',()=>{
 const {run,store}=harness();
 run('mode="trial";gameReset()');
 store.set('summitbound:trial:v5:route:0','{"version":5,"seed":42,"best":8,"frames":[],"splits":[]}');
 assert.equal(run('readTrialRecord()'),null);
 store.set('summitbound:trial:v5:route:0','not-json');
 assert.equal(run('readTrialRecord()'),null);
});
test('Phase 4C: no added decorative snow bridge or detached ledge collider',()=>{
 const art=read('rendering.js');
 assert.match(art,/const rootDeep=mountainContourX\(i,y\+depth\+54\)/);
 assert.match(art,/const radius=Math.max\(39,\(span.left\+span.right\)\*\.46\+9\)/);
 assert.match(art,/const lower=summitY\+5\+feathers\*\(13\+5\*Math.sin/);
 assert.match(art,/const maxLeft=Math.min\(34,x-ledge\[0\]-5\)/);
 const sim=read('simulation.js');
 assert.match(sim,/typeof trialTick==='function'/);
 assert.match(sim,/typeof finishTimeTrial==='function'/);
});
test('Phase 4C: new script loads between game-state and simulation',()=>{
 const html=fs.readFileSync('public/game/summit-leap-v081.html','utf8');
 const a=html.indexOf('game-state.js'),b=html.indexOf('time-trial.js'),
  c=html.indexOf('rendering.js'),d=html.indexOf('simulation.js');
 assert.ok(a>=0&&a<b&&b<c&&c<d);
 assert.match(html,/data-mode="trial"/);
 assert.match(html,/id="ghostToggle"/);
 assert.match(html,/id="trialHud"/);
});
