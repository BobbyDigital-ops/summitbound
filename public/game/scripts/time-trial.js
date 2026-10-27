// Summitbound Phase 4C: seeded time trials, medal gates and replayable local ghosts.
// Records are course-specific, validated against versioned terrain + stock physics.
const TRIAL_RECORD_VERSION=1;
const TRIAL_SAMPLE_SECONDS=.12;
const TRIAL_MAX_SAMPLES=3500;
let trialRun={samples:[],splits:[],nextSample:0,invalid:false};
let trialGhost=null,trialGhostCursor=0,trialGhostVisible=true,trialLastSplit='';
function medalTargets(seed=routeSeed){
 // Quantify the best accessible high-route climb, then allow finite vault,
 // traverse, cave and setup time. Aspirational rather than fixed magic seconds;
 // thresholds require real playtest calibration before final release.
 const ascent=spires.slice(1,4).reduce((sum,m)=>{
  const high=m.ledges.at(-1);
  return sum+(high?Math.max(0,high[2]-m.summit[2])/62:0);
 },0);
 const ladder=Math.max(0,spires[4].cave.floor-spires[4].summit[2])/125;
 const gold=Math.ceil((36+ascent+ladder)*1.04/5)*5;
 return {gold,silver:Math.ceil(gold*1.32/5)*5,bronze:Math.ceil(gold*1.76/5)*5};
}
function trialRecordKey(seed=routeSeed){
 return 'summitbound:trial:v'+TRIAL_RECORD_VERSION+':route:'+seed;
}
function readTrialRecord(seed=routeSeed){
 try{
  const raw=localStorage.getItem(trialRecordKey(seed));
  if(!raw||raw.length>220000)return null;
  const record=JSON.parse(raw);
  if(record?.version!==TRIAL_RECORD_VERSION||record.seed!==seed||
     !Number.isFinite(record.best)||record.best<=0||record.best>900||
     !Array.isArray(record.frames)||record.frames.length>TRIAL_MAX_SAMPLES||
     !Array.isArray(record.splits))return null;
  if(record.frames.some(f=>!Array.isArray(f)||f.length!==5||
     !f.every(Number.isFinite)))return null;
  return record;
 }catch{return null;}
}
function resetTimeTrial(){
 trialRun={samples:[],splits:[],nextSample:0,invalid:false};
 trialGhostCursor=0;trialLastSplit='';
 trialGhost=mode==='trial'?readTrialRecord():null;
 const ghostButton=document.getElementById('ghostToggle');
 if(ghostButton)ghostButton.hidden=mode!=='trial'||!trialGhost;
 const hud=document.getElementById('trialHud');
 if(hud)hud.hidden=mode!=='trial';
 updateTrialHud();
}
function trialSnapshot(){
 const state=p.vault?9:(p.state==='AIRBORNE'||p.state==='FALLING')?10:
  p.state==='CLIMBING'||p.state==='STEP_OFF'?11:
  Math.abs(p.vx)>30?Math.floor((p.runDistance||0)/55)%8:8;
 return [Math.round(elapsed*1000),Math.round(p.x),Math.round(p.y),
  state,p.facingDir<0?-1:1];
}
function trialTick(){
 if(mode!=='trial'||completed||trialRun.invalid)return;
 if(elapsed+1e-6<trialRun.nextSample)return;
 if(trialRun.samples.length<TRIAL_MAX_SAMPLES)trialRun.samples.push(trialSnapshot());
 else trialRun.invalid=true; // An overly long run must not exhaust storage.
 trialRun.nextSample=elapsed+TRIAL_SAMPLE_SECONDS;
}
function trialSplit(stage){
 if(mode!=='trial'||trialRun.invalid||stage<1||stage>4)return;
 if(!Number.isFinite(trialRun.splits[stage-1]))
  trialRun.splits[stage-1]=Math.round(elapsed*100)/100;
 const prior=stage===1?0:trialRun.splits[stage-2]??0;
 const secs=trialRun.splits[stage-1]-prior;
 const old=trialGhost?.splits?.[stage-1];
 const delta=Number.isFinite(old)?' · vs PB '+(elapsed<=old?'-':'+')+Math.abs(elapsed-old).toFixed(1)+'s':'';
 trialLastSplit='GATE '+stage+' / 4 · '+secs.toFixed(1)+'s'+delta;
 updateTrialHud();
}
function medalForTime(seconds,targets=medalTargets()){
 if(seconds<=targets.gold)return 'GOLD';
 if(seconds<=targets.silver)return 'SILVER';
 if(seconds<=targets.bronze)return 'BRONZE';
 return 'FINISHED';
}
function finishTimeTrial(){
 if(mode!=='trial')return '';
 trialSplit(4);
 const medal=medalForTime(elapsed),valid=!trialRun.invalid;
 if(valid&&(!trialGhost||elapsed<trialGhost.best)){
  // Cap bytes and only store a validated FULL uninterrupted run.
  const record={version:TRIAL_RECORD_VERSION,seed:routeSeed,
   best:Math.round(elapsed*100)/100,frames:trialRun.samples.slice(),
   splits:trialRun.splits.slice()};
  record.frames.push(trialSnapshot());
  if(record.frames.length<=TRIAL_MAX_SAMPLES){
   try{localStorage.setItem(trialRecordKey(),JSON.stringify(record));
    trialGhost=record;}catch{}
  }
 }
 updateTrialHud();
 return medal+' · '+(valid?'Time trial':'Unranked (tuning / skip)');
}
function invalidateTimeTrial(){
 if(mode==='trial'){
  trialRun.invalid=true;
  trialLastSplit='UNRANKED — RESTART FOR A VALID TIME';
  updateTrialHud();
 }
}
function ghostPositionAt(seconds=elapsed){
 if(mode!=='trial'||!trialGhostVisible||!trialGhost?.frames?.length)return null;
 const frames=trialGhost.frames,time=seconds*1000;
 if(time>frames.at(-1)[0])return null;
 if(time<frames[0][0])return frames[0];
 while(trialGhostCursor<frames.length-2&&frames[trialGhostCursor+1][0]<time)
  trialGhostCursor++;
 while(trialGhostCursor>0&&frames[trialGhostCursor][0]>time)
  trialGhostCursor--;
 const a=frames[trialGhostCursor],b=frames[Math.min(trialGhostCursor+1,frames.length-1)];
 const t=Math.max(0,Math.min(1,(time-a[0])/Math.max(1,b[0]-a[0])));
 return [time,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t,a[3],a[4]];
}
function updateTrialHud(){
 const hud=document.getElementById('trialHud');
 if(!hud||mode!=='trial')return;
 const target=medalTargets(),clock=elapsed;
 const targetText=document.getElementById('medalPace');
 if(targetText){
  const rank=medalForTime(clock,target);
  const timeLeft=(rank==='GOLD'?target.gold:rank==='SILVER'?target.silver:
   rank==='BRONZE'?target.bronze:0)-clock;
  const str=rank==='FINISHED'?'ALL MEDAL GATES MISSED':
   rank+' GATE · '+Math.max(0,timeLeft).toFixed(1)+'s LEFT';
  if(targetText.textContent!==str)targetText.textContent=str;
 }
 const goals=document.getElementById('medalTargets');
 if(goals){
  const text='G '+formatTime(target.gold)+' · S '+formatTime(target.silver)+
   ' · B '+formatTime(target.bronze);
  if(goals.textContent!==text)goals.textContent=text;
 }
 const best=document.getElementById('trialBest');
 if(best){
  const label='PB '+(trialGhost?formatTime(trialGhost.best):'—');
  if(best.textContent!==label)best.textContent=label;
 }
 const split=document.getElementById('trialSplit');
 if(split&&split.textContent!==trialLastSplit)split.textContent=trialLastSplit;
}
