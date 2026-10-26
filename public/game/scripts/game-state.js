// Summit Leap v0.8.3 — extracted unchanged from v0.8.1.
const canvas = document.getElementById('game'), ctx = canvas.getContext('2d'), meter = document.getElementById('meter'), needle = document.getElementById('needle'), stageEl = document.getElementById('stage'), subEl = document.getElementById('substage'), notice = document.getElementById('notice');
const DT = 1/120; const PI = Math.PI;

let mode = 'practice', p = {}, platforms = [], fingers = {left:new Set(),right:new Set(),up:new Set(),vault:null}, keys = new Set(), camera = {x:0,y:0}, acc = 0, prev = performance.now(), elapsed = 0, completed = false, caveActivated = false, peakBuzz = false, trail = [], lastMessage = '', messageTimeout = 0, atStage = 0, lastSafeStage = 0, landingHistory = [];

const snow = Array.from({length:190},(_,i)=>({x:((i*7919)%1009)/1009,y:((i*179)%977)/977,r:i%7===0?1.9:.75,speed:.2+(i%5)*.12}));

function platform(id,l,r,t,s='snow',extra={}){return {id,x:(l+r)/2,y:t+60,width:r-l,height:120,surfaceType:s,top:t,left:l,right:r,...extra}}

for(let i=0; i<spires.length; i++){
 const m = spires[i];
 platforms.push(platform('s'+i, ...m.summit, {kind:'summit', spire:i}));
 // Active ledge collision surfaces created by applyRoute().
 if(m.cave) platforms.push(platform('cave4', m.cave.left, m.cave.right, m.cave.floor, 'rock', {kind:'cave', spire:i, tier:'Checkpoint'}));
}

applyRoute(0);

function hint(txt, duration=2.4){lastMessage=txt;messageTimeout=duration;notice.textContent=txt}

function spawn(stage=0, keepTime=false){
 let pl = platforms.find(x=>x.id==='s'+stage), x = stage===0?150:pl.left+95;
 p = {x, y:pl.top-22, vx:0, vy:0, state:'GROUNDED', surface:'snow', facingDir:1, runDistance:0, vault:null, anchorX:0, anchorY:0, bend:0, groundedFor:.5, standingOn:pl.id, climb:null};
 if(!keepTime) elapsed=0;
 if(stage===0) caveActivated=false;
 atStage=stage; lastSafeStage=stage; completed=false; trail=[]; acc=0; peakBuzz=false; fingers.vault=null; fingers.up.clear();
 meter.style.display='none'; document.getElementById('victory').classList.remove('open');
 const zoom = getZoom();
 camera.x = x - .26 * innerWidth / zoom; camera.y = p.y - .60 * innerHeight / zoom;
 hint(stage ? 'Retry this ascent.' : 'Four leaps to the Cave of Embers — land high to climb less.', 3);
}

function gameReset(){landingHistory=[];spawn(0)}
function haptic(ms){try{navigator.vibrate?.(ms)}catch{}}
function isGround(){return ['GROUNDED','RUNNING','BRAKING','SLIDING'].includes(p.state)}
function currentPlatform(){return platforms.find(pl=>pl.id===p.standingOn)}

function plant(){
 if(!isGround())return;
 const pl = currentPlatform();
 if(!pl || pl.kind!=='summit' || p.state==='CLIMBING')return;
 const val = PolePhysicsEngine.validatePlantPoint(p.x, p.y, p.facingDir, [pl], cfg);
 if(!val.isValid)return;
 p.vault = PolePhysicsEngine.initVault(p.x, p.y, p.vx, p.vy, val.anchorX, val.anchorY, cfg);
 p.state = 'RIDING_VAULT'; p.anchorX = val.anchorX; p.anchorY = val.anchorY; p.bend = 0; peakBuzz = false; p.standingOn = null;
 haptic(9);
}

function release(){
 if(p.state!=='RIDING_VAULT')return;
 const kick = PolePhysicsEngine.calculateReleaseVelocity(p.vx, p.vy, p.vault, cfg);
 p.vx = kick.vx; p.vy = kick.vy; p.state = 'AIRBORNE'; p.vault = null; p.bend = 0; meter.style.display = 'none';
}

function input(){
 return {
  left: keys.has('a') || keys.has('keya') || keys.has('arrowleft') || fingers.left.size > 0,
  right: keys.has('d') || keys.has('keyd') || keys.has('arrowright') || fingers.right.size > 0,
  up: keys.has('arrowup') || keys.has('w') || keys.has('keyw') || fingers.up.size > 0
 };
}

function getZoom(){return clamp(innerWidth/1150, .62, 1.0) * .76}


