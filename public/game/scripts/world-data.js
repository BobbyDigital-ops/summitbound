// Summit Leap v0.8.3 — extracted unchanged from v0.8.1.
const mountainBackdrop = new Image(); mountainBackdrop.src='/game/mountain-background.jpg';
const cliffTexture = new Image(); cliffTexture.src='/game/cliff-texture.png';
const climberSheet = new Image(); climberSheet.src='/game/mountaineer-red-puffer.png';
const slateTexture = new Image(); slateTexture.src='/game/rock-slate-seamless.png';
// Replaced the inverted vector fir and pasted-on shrub sprites with the
// established native painted cliff and tree pass. Art files remain for archival reference.

const cfg = {gravity:800,arcadeLift:1.18,arcadeRange:.84,arcadeFlightTempo:.88,runAcceleration:850,maxRunSpeed:360,brakingDecel:2000,poleLength:195,poleStiffness:120,poleDamping:4.5,bendingStiffness:40,maxDeformation:.52,energyRetention:.96,playerMass:70,airborneSteerForce:520,rockFriction:.88,snowFriction:.48,iceFriction:.05,simSpeed:1};

const spires = [
 {name:'Wolvesgate',summit:[0,900,1100,'snow'],ledges:[]},
 // Narrower, progressively stepped rock crests replace the huge rectangular
 // summit blocks. Wide enough for real takeoff run-ups, with longer canyons.
 {name:'The Broken Tooth',summit:[1260,2020,800,'snow'],ledges:[]},
 {name:'The Windward Spire',summit:[2380,3140,555,'snow'],ledges:[]},
 {name:'The Lantern Crag',summit:[3490,4250,305,'snow'],ledges:[]},
 {name:'Firespine Cavern',summit:[4960,5810,-55,'snow'],ledges:[],cave:{left:4810,right:5035,floor:235,ceiling:85}}
];

// Procedural, independently varied shelves with physics-based reachability.
const caveLayouts = [
 {left:6850,right:7075,floor:892,ceiling:756},
 {left:6895,right:7078,floor:882,ceiling:764},
 {left:6835,right:7090,floor:925,ceiling:778},
 {left:6875,right:7075,floor:908,ceiling:781},
 {left:6845,right:7100,floor:877,ceiling:744},
 {left:6880,right:7085,floor:895,ceiling:758},
 {left:6860,right:7070,floor:888,ceiling:752},
 {left:6900,right:7095,floor:915,ceiling:772},
 {left:6840,right:7080,floor:900,ceiling:760}
];

const leapTitles = ['OPENING CHASM','WINDWARD RISE','STEEP ICE CRUX','CAVERN APPROACH'];
let routeSeed=0;

// Phase 2 authored composition rules. These describe three different leap
// identities, not a permanent low-left / high-right staircase. Each mountain
// normally has 3 choices; a few have 2 or 4. Takeoff Y is the reference.
const MOUNTAIN_DESIGNS={
 1:{name:'Broken Tooth',difficulty:'precision / ledge width',
    near:393,mid:496,far:602,baseAltitude:800},
 2:{name:'Windward Spire',difficulty:'range / high-near inversions',
    near:399,mid:510,far:619,baseAltitude:555},
 3:{name:'Lantern Crag',difficulty:'verticality / narrow high shelves',
    near:397,mid:493,far:605,baseAltitude:305}
};
// Most layouts must SHOW three distinct options in the same camera view.
// No one-shelf route is allowed; the rare alternatives contain 2 or 4.
function terraceCount(spire,seed){
 const n=((seed+spire*11)%17);
 return n===2||n===11?2:n===8||n===15?4:3;
}
function seededRandom(seed,spire){
 let state=(Math.imul(seed+1,2654435761)^Math.imul(spire+11,1597334677))>>>0;
 return ()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;};
}
const summitAltitudes=[1100,800,555,305,-55];
let cachedFlights=null,cachedFlightPhysics='';
function candidateFlights(){
 const signature=[cfg.gravity,cfg.arcadeLift,cfg.arcadeRange,
  cfg.arcadeFlightTempo,cfg.maxRunSpeed,cfg.brakingDecel].join(':');
 if(signature===cachedFlightPhysics&&cachedFlights)return cachedFlights;
 if(typeof PolePhysicsEngine==='undefined')
  throw Error('Actual pole physics must be loaded before generating terrain');
 const paths=[],dt=1/120,flightStep=dt*cfg.arcadeFlightTempo;
 for(const offset of [120,140,170,200])
 for(const speed of [260,320,360])
 for(let tick=42;tick<=210;tick+=12){
  const start=-offset,py=-22;
  const initial=PolePhysicsEngine.initVault(start,py,speed,0,start+120,0,cfg);
  const r=PolePhysicsEngine.stepVault(initial,tick*dt,cfg);
  const kick=PolePhysicsEngine.calculateReleaseVelocity(r.nextVx,r.nextVy,r.state,cfg);
  let x=r.nextPx,y=r.nextPy,vy=kick.vy;
  const descending=[];
  for(let step=0;step<325;step++){
   const prev=y+22;
   vy+=cfg.gravity*flightStep;x+=kick.vx*flightStep;y+=vy*flightStep;
   if(vy>=0)descending.push({x,feet:y+22,prev});
   if(vy>=0&&y+22>40)break;
  }
  paths.push({descending,releaseFeet:r.nextPy+22,
   braking:kick.vx*kick.vx/(2*cfg.brakingDecel)});
 }
 cachedFlightPhysics=signature;cachedFlights=paths;
 return paths;
}
function viableShelves(ledges,previous){
 const stats=ledges.map(()=>({hits:0,safe:0}));
 for(const path of candidateFlights()){
  let first=-1,contact=0;
  for(const step of path.descending){
   for(let i=0;i<ledges.length;i++){
    const t=ledges[i],left=t[0]-previous[1],right=t[1]-previous[1];
    const top=t[2]-previous[2];
    if(step.x<left+3||step.x>right-3||
      step.prev>top+3||step.feet<top-4)continue;
    if(first<0||t[2]<ledges[first][2]){first=i;contact=step.x+previous[1];}
   }
   if(first>=0)break;
  }
  if(first<0)continue;
  const t=ledges[first];
  if(path.releaseFeet>t[2]-previous[2])continue;
  stats[first].hits++;
  if(t[1]-contact>=path.braking+12)stats[first].safe++;
 }
 return stats.every(s=>s.hits>=3&&s.safe>=2);
}
function selectTerraces(spire,seed){
 const rand=seededRandom(seed,spire),previous=spires[spire-1].summit;
 const design=MOUNTAIN_DESIGNS[spire],count=terraceCount(spire,seed);
 const labels=count===2?['Low','High']:count===3?
  ['Low','Middle','High']:['Low','Middle','High','Ridge'];
 const near=design.near,far=design.far;
 // Separate altitude bands so a mountain can't render as 2 similarly
 // elevated shelves. Horizontal order is independently shuffled.
 const altitudeBands=count===2?[[35,61],[165,199]]:
  count===3?[[30,56],[99,130],[171,205]]:
  [[28,47],[79,104],[137,165],[197,224]];
 const widthBands=count===2?[[108,153],[167,230]]:
  count===3?[[100,135],[141,190],[196,244]]:
  [[94,120],[130,158],[166,199],[208,252]];
 const horizontal=count===2?[near,far]:
  count===3?[near,design.mid,far]:
  [near,near+60,design.mid+22,far];
 let best=null,bestScore=-Infinity;
 for(let attempt=0;attempt<620;attempt++){
  const zones=[...horizontal],widthSlots=[...widthBands];
  for(let i=zones.length-1;i>0;i--){
   const j=Math.floor(rand()*(i+1));
   [zones[i],zones[j]]=[zones[j],zones[i]];
   const k=Math.floor(rand()*(i+1));
   [widthSlots[i],widthSlots[k]]=[widthSlots[k],widthSlots[i]];
  }
  const ledges=labels.map((label,i)=>{
   const [low,high]=altitudeBands[i];
   const rise=low+Math.floor(rand()*(high-low+1));
   const left=previous[1]+zones[i]+Math.floor(rand()*37)-18;
   const [wmin,wmax]=widthSlots[i];
   const width=wmin+Math.floor(rand()*(wmax-wmin+1));
   return [left,left+width,previous[2]-rise,
    ['rock','snow','ice'][Math.floor(rand()*3)],label];
  });
  const sorted=[...ledges].sort((a,b)=>a[2]-b[2]);
  const xs=ledges.map(t=>t[0]),ends=ledges.map(t=>t[1]);
  if(Math.max(...xs)-Math.min(...xs)<175)continue;
  if(sorted.some((t,i)=>i>0&&t[2]-sorted[i-1][2]<55))continue;
  if(ends.some((x,i)=>ends.some((y,j)=>i!==j&&Math.abs(x-y)<38)))continue;
  if(!viableShelves(ledges,previous))continue;
  const left=previous[1]+346+Math.floor(rand()*14);
  const right=Math.max(...ends)+230+Math.floor(rand()*65);
  const top=design.baseAltitude+Math.floor(rand()*25)-12;
  if(ledges.some(t=>t[2]<top+43||t[0]<left+24))continue;
  // Prefer compositions whose shelves do not read as a staircase.
  const rangeY=sorted.at(-1)[2]-sorted[0][2];
  const sizes=ledges.map(t=>t[1]-t[0]);
  const score=rangeY*.9+(Math.max(...xs)-Math.min(...xs))*.35+
   (Math.max(...sizes)-Math.min(...sizes))*.4+
   (ledges[0][0]>ledges.at(-1)[0]?16:0);
  if(score>bestScore){
   bestScore=score;best={ledges,summit:[left,right,top,'snow'],
    ridge:{character:rand(),roughness:.75+rand()*.6}};
  }
  // Don't spend the entire candidate budget after a strong, playable map.
  if(bestScore>310&&attempt>55)break;
 }
 if(best)return best;
 throw Error('Cannot map playable, distinct shelves for '+design.name+
  ', route '+seed+' without changing pole physics');
}

function applyRoute(seed){
 routeSeed=((Math.trunc(seed)%997)+997)%997;
 if(typeof invalidateTerrainCache==='function')invalidateTerrainCache();
 for(let i=1;i<=3;i++){
  const generated=selectTerraces(i,routeSeed);
  spires[i].summit=generated.summit;
  spires[i].ledges=generated.ledges;
  spires[i].ridge=generated.ridge;
 }
 const original=caveLayouts[routeSeed%9];
 const floor=235+Math.round((original.floor-892)*.12);
 const left=spires[3].summit[1]+560+Math.round((original.left-6850)*.15);
 spires[4].cave={left,right:left+original.right-original.left,
  floor,ceiling:floor-150};
 spires[4].summit=[left+150,left+1070,-55,'snow'];
 if(typeof platforms!=='undefined'&&Array.isArray(platforms)){
  for(let k=platforms.length-1;k>=0;k--)if(platforms[k].kind==='ledge')platforms.splice(k,1);
  for(let i=1;i<=4;i++){
   const t=spires[i].summit,pl=platforms.find(p=>p.id==='s'+i);
   if(pl)Object.assign(pl,{x:(t[0]+t[1])/2,y:t[2]+60,
    width:t[1]-t[0],height:120,left:t[0],right:t[1],top:t[2]});
  }
  for(let i=1;i<=3;i++)for(let j=0;j<spires[i].ledges.length;j++){
   const t=spires[i].ledges[j];
   if(typeof platform==='function')
    platforms.push(platform('l'+i+'-'+j,t[0],t[1],t[2],
     t[3],{kind:'ledge',spire:i,tier:t[4]}));
  }
  const cave=spires[4].cave,pl=platforms.find(p=>p.kind==='cave');
  if(pl)Object.assign(pl,{x:(cave.left+cave.right)/2,y:cave.floor+60,
   width:cave.right-cave.left,height:120,
   left:cave.left,right:cave.right,top:cave.floor});
 }
 const label=document.getElementById('routeLabel');
 if(label)label.textContent='Route '+(routeSeed+1);
}


/**
 * Independent ice ascent from EACH actual landing. Never merge all branches
 * at one trunk. Different shelves get different entrance AND summit-exit X.
 * Most of the initial climb is near-vertical, with a short rock-following
 * traverse as the route approaches its own section of the upper crest.
 */
function iceClimbPoints(spireIndex,fromTier=null){
 const s=spires[spireIndex];
 if(!s||spireIndex<1||spireIndex>3||s.cave)return [];
 if(fromTier===null) return s.ledges.length ? iceClimbPoints(spireIndex,0) : [];
 const ledge=s.ledges[fromTier];
 if(!ledge)return [];
 const startX=ledge[1]-30,startY=ledge[2]-22;
 // Exit near the chosen route's own upper face. Never funnel every ledge
 // backwards to the left corner of the summit.
 const endX=Math.min(s.summit[1]-90,Math.max(s.summit[0]+48,startX+26));
 const endY=s.summit[2]-22;
 const spread=endX-startX,climbHeight=startY-endY;
 const bend={x:startX+spread*.28,y:startY-climbHeight*.64};
 return [
  {x:startX,y:startY,tierIndex:fromTier},
  {...bend,tierIndex:fromTier},
  {x:endX,y:endY,tierIndex:fromTier}
 ];
}
function icePositionAt(spireIndex,y,fromTier=0){
 const points=iceClimbPoints(spireIndex,fromTier);
 if(!points.length)return null;
 if(y>=points[0].y)return {x:points[0].x,y};
 for(let k=0;k<points.length-1;k++){
  const a=points[k],b=points[k+1];
  if(y>=b.y){
   const t=Math.max(0,Math.min(1,(a.y-y)/(a.y-b.y)));
   // Smooth tool placement at a change of slope, no abrupt sideways snap.
   const eased=t*t*(3-2*t);
   return {x:a.x+(b.x-a.x)*eased,y};
  }
 }
 return {x:points.at(-1).x,y};
}
function independentIceRoutes(i){
 const s=spires[i];
 if(!s||i<1||i>3)return [];
 return s.ledges.map((_,tier)=>({tier,points:iceClimbPoints(i,tier)}));
}

function climbEntryX(platform) {
 if (!platform) return -999;
 return platform.kind === 'cave' ? spires[4].cave.right - 25 : platform.right - 30;
}

/**
 * Geologically continuous left-hand cliff boundary. At each ledge height it
 * passes just outside the real physics landing edge (tier[0]); all other rock
 * follows interpolated cliff face. No separate platforms or collision edits.
 */
function mountainContourNodes(index) {
 const mountain=spires[index], top=mountain.summit;
 const nodes=[{x:top[0]-12,y:top[2]+2}];
 if(mountain.ledges.length) {
  for(const tier of [...mountain.ledges].sort((a,b)=>a[2]-b[2])) {
   nodes.push({x:tier[0]-10,y:tier[2]+3});
  }
 } else if(mountain.cave) {
  nodes.push({x:mountain.cave.left+72,y:top[2]+48});
  nodes.push({x:mountain.cave.left-115,y:mountain.cave.ceiling-12});
  nodes.push({x:mountain.cave.left-123,y:mountain.cave.floor+82});
 } else {
  nodes.push({x:top[0]-55,y:top[2]+240});
 }
 const lowest=mountain.ledges.length ? Math.min(...mountain.ledges.map(v=>v[0])) : (mountain.cave ? mountain.cave.left : top[0]);
 nodes.push({x:lowest-85,y:2100});
 return nodes;
}
function mountainContourX(index,y){
 const nodes=mountainContourNodes(index);
 if(y<=nodes[0].y) return nodes[0].x;
 for(let i=0;i<nodes.length-1;i++){
  const a=nodes[i],b=nodes[i+1];
  if(y<=b.y){
   const t=Math.max(0,Math.min(1,(y-a.y)/(b.y-a.y)));
   const jag=Math.sin(Math.PI*t)*(Math.sin(y*.071+index*2.2)*4-7);
   return a.x+(b.x-a.x)*t+jag;
  }
 }
 return nodes[nodes.length-1].x;
}
