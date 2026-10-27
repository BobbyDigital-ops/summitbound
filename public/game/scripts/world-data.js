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

// 9 Deterministic Seeded Routes with varied shelf width, height, offset and depth
const ledgeLayouts = [
 // Seed 0 (Route 1)
 [
  [[1675,1760,1010,'rock','High'],[1553,1693,1130,'snow','Middle'],[1502,1705,1240,'rock','Low']],
  [[3280,3436,895,'rock','High'],[3185,3285,1010,'ice','Middle'],[3135,3302,1125,'snow','Low']],
  [[5050,5198,810,'snow','High'],[4968,5143,935,'rock','Middle'],[4940,5067,1050,'ice','Low']]
 ],
 // Seed 1 (Route 2)
 [
  [[1650,1760,1010,'rock','High'],[1540,1670,1130,'snow','Middle'],[1470,1690,1240,'rock','Low']],
  [[3350,3438,895,'rock','High'],[3200,3390,1010,'ice','Middle'],[3150,3280,1125,'snow','Low']],
  [[5110,5197,810,'snow','High'],[5020,5180,935,'rock','Middle'],[4940,5140,1050,'ice','Low']]
 ],
 // Seed 2 (Route 3)
 [
  [[1690,1760,1010,'rock','High'],[1530,1720,1130,'snow','Middle'],[1490,1650,1240,'rock','Low']],
  [[3270,3425,895,'rock','High'],[3220,3340,1010,'ice','Middle'],[3160,3370,1125,'snow','Low']],
  [[5040,5196,810,'snow','High'],[4970,5080,935,'rock','Middle'],[4910,5150,1050,'ice','Low']]
 ],
 // Seed 3 (Route 4)
 [
  [[1660,1755,1000,'rock','High'],[1560,1685,1120,'snow','Middle'],[1480,1660,1235,'rock','Low']],
  [[3310,3440,890,'rock','High'],[3210,3330,1005,'ice','Middle'],[3140,3290,1120,'snow','Low']],
  [[5070,5195,805,'snow','High'],[4990,5120,930,'rock','Middle'],[4925,5100,1045,'ice','Low']]
 ],
 // Seed 4 (Route 5)
 [
  [[1640,1750,1015,'rock','High'],[1545,1700,1135,'snow','Middle'],[1510,1715,1245,'rock','Low']],
  [[3290,3430,900,'rock','High'],[3190,3360,1015,'ice','Middle'],[3170,3320,1130,'snow','Low']],
  [[5090,5190,815,'snow','High'],[4980,5150,940,'rock','Middle'],[4950,5120,1055,'ice','Low']]
 ],
 // Seed 5 (Route 6)
 [
  [[1680,1760,1005,'rock','High'],[1535,1665,1125,'snow','Middle'],[1475,1675,1230,'rock','Low']],
  [[3330,3435,890,'rock','High'],[3230,3380,1005,'ice','Middle'],[3130,3270,1120,'snow','Low']],
  [[5060,5195,805,'snow','High'],[4960,5100,930,'rock','Middle'],[4905,5080,1040,'ice','Low']]
 ],
 // Seed 6 (Route 7)
 [
  [[1655,1755,1010,'rock','High'],[1550,1710,1130,'snow','Middle'],[1495,1700,1240,'rock','Low']],
  [[3300,3430,895,'rock','High'],[3205,3350,1010,'ice','Middle'],[3155,3310,1125,'snow','Low']],
  [[5080,5192,810,'snow','High'],[5000,5135,935,'rock','Middle'],[4930,5110,1050,'ice','Low']]
 ],
 // Seed 7 (Route 8)
 [
  [[1670,1760,1010,'rock','High'],[1525,1680,1125,'snow','Middle'],[1485,1680,1235,'rock','Low']],
  [[3340,3438,895,'rock','High'],[3180,3310,1005,'ice','Middle'],[3145,3340,1120,'snow','Low']],
  [[5100,5195,810,'snow','High'],[4970,5110,930,'rock','Middle'],[4915,5075,1045,'ice','Low']]
 ],
 // Seed 8 (Route 9)
 [
  [[1645,1750,1005,'rock','High'],[1565,1720,1130,'snow','Middle'],[1505,1710,1245,'rock','Low']],
  [[3275,3425,890,'rock','High'],[3215,3375,1010,'ice','Middle'],[3165,3355,1125,'snow','Low']],
  [[5045,5190,805,'snow','High'],[4985,5160,935,'rock','Middle'],[4935,5130,1050,'ice','Low']]
 ]
];

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

// Each leap has its own traversal profile without changing the pole physics.
// Every destination gains altitude; the second emphasises distance, the
// third a short steep ascent, and the final targets a high side-cave mouth.
const leapTitles = ['OPENING CHASM','WINDWARD RISE','STEEP ICE CRUX','CAVERN APPROACH'];
const stageOffsets=[{dx:0,dy:0},{dx:-190,dy:0},{dx:-425,dy:0},{dx:-485,dy:0},{dx:0,dy:0}];
let routeSeed = 0;

// Stage-specific upward targets. Every playable landing is ABOVE the prior
// spire's launch summit (lower world Y means higher altitude).
// 1–4 terraces are distributed vertically across a genuine cliff face.
// At every mountain: LOW gains a little altitude, HIGH saves real climbing,
// RIDGE is the skill-based near-summit shortcut.
const risingTerraces={
 1:{High:905,Middle:970,Low:1045},
 2:{High:667,Middle:719,Low:780},
 3:{High:420,Middle:478,Low:540}
};
const originalTierY={1:{High:1010,Middle:1130,Low:1240},
 2:{High:895,Middle:1010,Low:1125},
 3:{High:810,Middle:935,Low:1050}};
// Author all shelves against the takeoff summit's RIGHT edge, not against
// the next mountain's LEFT edge. No low-tier landing begins before 390 units,
// rather than the previous easy ~240–260-unit steps. High/Ridge save climbing
// at the cost of sharply narrower, more distant and higher airborne targets.
// Shelf lip widths and the modest seeded variation are calibrated with actual
// PolePhysicsEngine ride/release/flight trajectories and braking room.
const cliffProfiles={
 1:{Low:[395,1086,160],Middle:[492,1047,125],High:[565,1009,102],Ridge:[604,975,130]},
 2:{Low:[402,786,162],Middle:[495,747,130],High:[565,709,103],Ridge:[605,675,135]},
 3:{Low:[395,541,162],Middle:[495,502,125],High:[566,464,104],Ridge:[605,430,135]}
};
const terraceCounts=[1,2,4,3,2,1,4,3,4];
function terraceCount(spire,seed){return terraceCounts[(seed+(spire-1)*3)%9];}
function selectTerraces(group,spire,seed){
 const lookup=Object.fromEntries(group.map(t=>[t[4],t]));
 const count=terraceCount(spire,seed);
 const labels=count===1?['Low']:count===2?['Low','High']:
   count===3?['Low','Middle','High']:['Low','Middle','High','Ridge'];
 return labels.map(label=>{
  const raw=lookup[label],p=cliffProfiles[spire][label];
  const variation=((seed*13+spire*17+label.length*7)%7)-3;
  const x=spires[spire-1].summit[1]+p[0]+variation*3;
  const w=p[2]+(raw?(raw[1]-raw[0]-140)*.09:0);
  const y=p[1]+variation*.55;
  return [x,x+w,y,raw?.[3]||'snow',label];
 });
}

function applyRoute(seed) {
 routeSeed=((seed%9)+9)%9;
 if(typeof invalidateTerrainCache==='function')invalidateTerrainCache();
 const group=ledgeLayouts[routeSeed];
 for(let i=1;i<=3;i++) {
  spires[i].ledges=selectTerraces(group[i-1],i,routeSeed);
 }
 // The fire is a new, HIGHER destination, embedded in the side of the final
 // massif. Both cave ceiling and floor must remain real collision surfaces.
 const original=caveLayouts[routeSeed];
 const floor=235+Math.round((original.floor-892)*.12);
 // The final chasm is deliberately longer than any easy lower-tier hop.
 const left=spires[3].summit[1]+560+Math.round((original.left-6850)*.15);
 spires[4].cave={left,right:left+(original.right-original.left),
  floor,ceiling:floor-150};

 if(typeof platforms!=='undefined' && Array.isArray(platforms)) {
  for(let k=platforms.length-1;k>=0;k--)
   if(platforms[k].kind==='ledge')platforms.splice(k,1);
  for(let i=1;i<=3;i++)for(let j=0;j<spires[i].ledges.length;j++){
   const t=spires[i].ledges[j];
   if(typeof platform==='function')
    platforms.push(platform('l'+i+'-'+j,t[0],t[1],t[2],
      t[3],{kind:'ledge',spire:i,tier:t[4]}));
  }
  const c=spires[4].cave,cp=platforms.find(p=>p.kind==='cave');
  if(cp)Object.assign(cp,{x:(c.left+c.right)/2,y:c.floor+60,
    width:c.right-c.left,height:120,left:c.left,right:c.right,top:c.floor});
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
