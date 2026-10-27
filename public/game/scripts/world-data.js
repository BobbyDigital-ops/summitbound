// Summit Leap v0.8.3 — extracted unchanged from v0.8.1.
const mountainBackdrop = new Image(); mountainBackdrop.src='/game/mountain-background.jpg';
const cliffTexture = new Image(); cliffTexture.src='/game/cliff-texture.png';
const climberSheet = new Image(); climberSheet.src='/game/mountaineer-red-puffer.png';
const slateTexture = new Image(); slateTexture.src='/game/rock-slate-seamless.png';
// Replaced the inverted vector fir and pasted-on shrub sprites with the
// established native painted cliff and tree pass. Art files remain for archival reference.

const cfg = {gravity:800,arcadeLift:1.18,arcadeRange:.84,arcadeFlightTempo:.88,runAcceleration:850,maxRunSpeed:360,brakingDecel:2000,poleLength:195,poleStiffness:120,poleDamping:4.5,bendingStiffness:40,maxDeformation:.52,energyRetention:.96,playerMass:70,airborneSteerForce:225,rockFriction:.88,snowFriction:.48,iceFriction:.05,simSpeed:1};

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
    near:385,mid:470,far:545,baseAltitude:800},
 2:{name:'Windward Spire',difficulty:'range / high-near inversions',
    near:385,mid:475,far:550,baseAltitude:555},
 3:{name:'Lantern Crag',difficulty:'verticality / narrow high shelves',
    near:383,mid:468,far:545,baseAltitude:305}
};
// Most layouts must SHOW three distinct options in the same camera view.
// No one-shelf route is allowed; the rare alternatives contain 2 or 4.
function terraceCount(spire,seed){
 const n=((seed*5+spire*4)%19);
 return n===1||n===16?2:n===6||n===14?4:3;
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
   // Include real descents to alternative lower shelves; previous 40-unit
   // cut-off artificially compressed the entire mountain layout.
   if(vy>=0&&y+22>580)break;
  }
  paths.push({descending,releaseFeet:r.nextPy+22,releaseTick:tick,
   braking:kick.vx*kick.vx/(2*cfg.brakingDecel)});
 }
 cachedFlightPhysics=signature;cachedFlights=paths;
 return paths;
}
function shelfTimingProfiles(ledges,previous){
 const stats=ledges.map(()=>({hits:0,safe:0,ticks:new Set()}));
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
  if(t[1]-contact>=path.braking+12){
   stats[first].safe++;stats[first].ticks.add(path.releaseTick);
  }
 }
 return stats.map(s=>({hits:s.hits,safe:s.safe,releaseWindows:s.ticks.size}));
}
function viableShelves(ledges,previous){
 return shelfTimingProfiles(ledges,previous).every(s=>s.hits>=3&&s.safe>=2);
}
function routeHasMeaningfulRiskReward(profiles){
 if(profiles.length<2)return false;
 const low=profiles[0],high=profiles.at(-1);
 // High is the physically highest authored shelf (Ridge for four-way layouts).
 // A narrower landing means fewer safe first-contact, brakeable releases.
 return high.safe<=low.safe*.85 && high.releaseWindows<=low.releaseWindows;
}
const PRESERVED_LEVEL_SEEDS=new Set([0,1,2,7,42,250,996]);

// Physically validated alternatives for ONE receiving mountain.
// Each tuple: distance from takeoff, rise (negative=below takeoff), width.
// The choices are not stairs: one landing leads via ice to the NEXT summit.
const MOUNTAIN_ARCHETYPES={
 2:[[[750,-220,215],[410,130,145]],
    [[590,-240,225],[390,135,130]]],
 3:[[[740,-240,210],[480,-35,165],[395,133,130]],
    [[510,-240,240],[690,-95,185],[580,121,175]],
    [[720,-210,195],[430,25,170],[590,105,150]],
    [[555,-220,245],[690,-70,178],[415,145,118]],
    [[575,-250,225],[420,15,130],[620,105,155]],
    [[680,-320,260],[460,-50,160],[600,115,135]]],
 4:[[[530,-220,240],[700,-155,160],[470,-30,170],[588,120,140]],
    [[710,-280,205],[520,-140,155],[645,5,135],[395,130,120]],
    [[600,-280,220],[730,-165,185],[510,-10,145],[400,134,120]]]
};
const MOUNTAIN_TIER_NAMES={2:['Low','High'],
 3:['Low','Middle','High'],4:['Low','Middle','High','Ridge']};
let generatorFallbacks=0;
function selectTerraces(spire,seed){
 const rand=seededRandom(seed,spire),previous=spires[spire-1].summit;
 const design=MOUNTAIN_DESIGNS[spire],count=terraceCount(spire,seed);
 const variants=MOUNTAIN_ARCHETYPES[count];
 const first=(seed*7+spire*5)%variants.length;
 const labels=MOUNTAIN_TIER_NAMES[count];
 let fallbackLayout=null,preferredLayout=null,preferredScore=Infinity,checkedCandidates=0;
 // Hand-shaped route families, followed by only small seeded variations.
 // Do not optimize toward the same three short uphill shelves every time.
 for(let family=0;family<variants.length;family++){
  const template=variants[(first+family)%variants.length];
  for(let attempt=0;attempt<=20;attempt++){
   const authored=attempt===20;
   const ledges=template.map(([distance,rise,width],i)=>{
    const dx=authored?0:Math.floor(rand()*35)-17;
    const dy=authored?0:Math.floor(rand()*17)-8;
    const dw=authored?0:Math.floor(rand()*35)-17;
    const x=previous[1]+distance+dx;
    return [x,x+width+dw,previous[2]-(rise+dy),
      ['rock','snow','ice'][(i+Math.floor(rand()*3))%3],labels[i]];
   });
   const xs=ledges.map(t=>t[0]),ys=ledges.map(t=>t[2]);
   const widths=ledges.map(t=>t[1]-t[0]);
   const byHeight=[...ledges].sort((a,b)=>a[2]-b[2]);
   if(Math.max(...ys)-Math.min(...ys)<310)continue;
   if(Math.max(...xs)-Math.min(...xs)<165)continue;
   if(Math.min(...xs)-previous[1]<385)continue; // no trivial takeoff hop
   if(byHeight.some((t,i)=>i>0&&t[2]-byHeight[i-1][2]<65))continue;
   if(Math.max(...widths)-Math.min(...widths)<42)continue;
   const timingProfiles=shelfTimingProfiles(ledges,previous);
   if(!timingProfiles.every(s=>s.hits>=3&&s.safe>=2))continue;
   // Rising left face with a crest farther right; retain a real horizontal
   // pole-planting runup on top without changing the physics or controls.
   const left=previous[1]+690+Math.floor(rand()*65);
   const right=Math.max(left+390,
     Math.max(...ledges.map(t=>t[1]))+235+Math.floor(rand()*96));
   const highest=Math.min(...ys);
   const top=Math.min(design.baseAltitude+60,highest-90)
    -Math.floor(rand()*70);
   if(ledges.some(t=>t[2]<=top+68))continue;
   const layout={ledges,summit:[left,right,top,'snow'],
    ridge:{character:rand(),roughness:.70+rand()*.7}};
   // Stage-based difficulty curve: the opening leap permits a broader
   // high landing, while later peaks preferentially select tighter safe
   // first-contact AND pole-release windows. Lower shelves remain forgiving.
   // Fallback keeps EVERY procedural route physically possible.
   const high=timingProfiles.at(-1),low=timingProfiles[0];
   const precisionCap=spire===1?20:spire===2?13:9;
   const windowCap=spire===1?9:spire===2?7:5;
   const graded=high.safe<=precisionCap&&
     high.releaseWindows<=windowCap&&low.safe>=Math.max(18,high.safe*1.6);
   if(PRESERVED_LEVEL_SEEDS.has(seed)||
      (routeHasMeaningfulRiskReward(timingProfiles)&&graded)){
    if(authored)generatorFallbacks++;
    return layout;
   }
   // A playable level is preferable to no level if all families fail to
   // produce a meaningfully tighter high-landing window.
   if(!fallbackLayout)fallbackLayout=layout;
   // Bound expensive first-contact simulations. Four playable candidates
   // are enough to prefer harder upper routes without making mobile route
   // generation stall while cycling hundreds of rejected alternatives.
   if(routeHasMeaningfulRiskReward(timingProfiles)){
    const score=high.safe+high.releaseWindows*3-low.safe*.05;
    if(score<preferredScore){preferredScore=score;preferredLayout=layout;}
   }
   if(++checkedCandidates>=4)return preferredLayout||fallbackLayout;
  }
 }
 if(preferredLayout)return preferredLayout;
 if(fallbackLayout)return fallbackLayout;
 throw Error('No playable mountain composition for route '+seed+', stage '+spire);
}

function applyRoute(seed){
 // The player sees one reviewed five-peak course. Historical seeds remain
 // in source for design benchmarks but cannot become playable by accident.
 if(typeof isFeaturedCourse==='function'&&isFeaturedCourse())seed=0;
 routeSeed=((Math.trunc(seed)%997)+997)%997;
 if(typeof invalidateTerrainCache==='function')invalidateTerrainCache();
 if(typeof iceRouteCache!=='undefined')iceRouteCache.clear();
 for(let i=1;i<=3;i++){
  const generated=selectTerraces(i,routeSeed);
  spires[i].summit=generated.summit;
  spires[i].ledges=generated.ledges;
  spires[i].ridge=generated.ridge;
 }
 const original=caveLayouts[routeSeed%9];
 // Keep the last cave uphill even when an unusually high third summit was generated.
 const floor=Math.min(235,spires[3].summit[2]-50)+Math.round((original.floor-892)*.04);
 const left=spires[3].summit[1]+560+Math.round((original.left-6850)*.15);
 spires[4].cave={left,right:left+original.right-original.left,
  floor,ceiling:floor-150};
 spires[4].summit=[left+150,left+1070,Math.min(-55,floor-260),'snow'];
 if(typeof installFeaturedCourseGeometry==='function')
  installFeaturedCourseGeometry(spires);
 if(typeof platforms!=='undefined'&&Array.isArray(platforms)){
  for(let k=platforms.length-1;k>=0;k--)if(platforms[k].kind==='ledge')platforms.splice(k,1);
  for(let i=1;i<=4;i++){
   const t=spires[i].summit,pl=platforms.find(p=>p.id==='s'+i);
   if(pl)Object.assign(pl,{x:(t[0]+t[1])/2,y:t[2]+60,
    width:t[1]-t[0],height:120,left:t[0],right:t[1],top:t[2]});
  }
  for(let i=1;i<=4;i++)for(let j=0;j<spires[i].ledges.length;j++){
   const t=spires[i].ledges[j];
   if(typeof platform==='function')
    platforms.push(platform('l'+i+'-'+j,t[0],t[1],t[2],
     t[3],{kind:'ledge',spire:i,tier:t[4]}));
  }
  const cave=spires[4].cave,pl=platforms.find(p=>p.kind==='cave');
  if(pl&&cave)Object.assign(pl,{x:(cave.left+cave.right)/2,y:cave.floor+60,
   width:cave.right-cave.left,height:120,
   left:cave.left,right:cave.right,top:cave.floor});
  if(pl&&!cave)platforms.splice(platforms.indexOf(pl),1);
 }
 const label=document.getElementById('routeLabel');
 if(label)label.textContent=
  typeof FEATURED_COURSE!=='undefined'?
  'FIVE PEAKS · VERTICAL SLICE':
  'Route '+(routeSeed+1);
}


/**
 * Phase 3: a small directed ice-route graph, keyed to the actual accepted
 * landing shelves. Only merge a lower ascent if its ORIGINAL, independent
 * route already passes within a physical ice-face width of a higher shelf's
 * climb entrance. Otherwise that shelf retains its own independent exit.
 *
 * A shared route has the EXACT same vertices above the join, avoiding
 * teleporting between graphical routes. This never modifies mountain
 * colliders, movement speed, or pole physics.
 */
const iceRouteCache=new Map();
function iceExitX(spireIndex,fromTier){
 const s=spires[spireIndex],min=s.summit[0]+52,max=s.summit[1]-90;
 const ordered=s.ledges.map((ledge,i)=>({
  i,wanted:Math.min(max,Math.max(min,ledge[1]-4))
 })).sort((a,b)=>a.wanted-b.wanted);
 const exits=[];let last=min-54;
 for(let n=0;n<ordered.length;n++){
  const remain=ordered.length-n-1;
  const x=Math.max(min+n*54,
   Math.min(max-remain*54,Math.max(last+54,ordered[n].wanted)));
  exits[ordered[n].i]=x;last=x;
 }
 return exits[fromTier];
}
function independentIcePoints(spireIndex,tierIndex){
 const s=spires[spireIndex],ledge=s?.ledges?.[tierIndex];
 if(!ledge)return [];
 const startX=ledge[1]-30,startY=ledge[2]-22;
 const endX=iceExitX(spireIndex,tierIndex),endY=s.summit[2]-22;
 const rise=startY-endY,spread=endX-startX;
 if(typeof FEATURED_COURSE!=='undefined'){
  // Establish a vertical, visibly anchored upper ice segment. Traversal
  // on the cliff face is a real path, never a horizontal crest-slide.
  const settle=Math.min(96,Math.max(38,rise*.36));
  return [
   {x:startX,y:startY,tierIndex},
   {x:startX+spread*.36,y:startY-rise*.48,tierIndex},
   {x:endX,y:endY+settle,tierIndex},
   {x:endX,y:endY,tierIndex}
  ];
 }
 return [
  {x:startX,y:startY,tierIndex},
  {x:startX+spread*.28,y:startY-rise*.64,tierIndex},
  {x:endX,y:endY,tierIndex}
 ];
}
function iceXOnPath(points,y){
 if(!points?.length)return null;
 if(y>=points[0].y)return points[0].x;
 for(let k=0;k<points.length-1;k++){
  const a=points[k],b=points[k+1];
  if(y>=b.y){
   const t=Math.max(0,Math.min(1,(a.y-y)/(a.y-b.y)));
   const eased=t*t*(3-2*t);
   return a.x+(b.x-a.x)*eased;
  }
 }
 return points.at(-1).x;
}
function iceRouteNetwork(spireIndex){
 if(spireIndex<1||spireIndex>(typeof FEATURED_COURSE!=='undefined'?4:3)||!spires[spireIndex])return [];
 if(iceRouteCache.has(spireIndex))return iceRouteCache.get(spireIndex);
 const ledges=spires[spireIndex].ledges;
 const base=ledges.map((_,tier)=>independentIcePoints(spireIndex,tier));
 const routes=Array(ledges.length);
 const order=ledges.map((_,tier)=>tier)
  .sort((a,b)=>ledges[a][2]-ledges[b][2]);
 // Build from highest to lowest: a lower route may reuse a fully-built
 // higher path, but never the other way around (no loops).
 for(const tier of order){
  const initial=base[tier],start=initial[0];
  let parent=-1,best=Infinity;
  for(const other of order){
   if(other===tier||!routes[other])continue;
   const upper=base[other][0];
   const vertical=start.y-upper.y;
   if(vertical<115)continue;
   // Require actual proximity at the higher shelf, not simply aligned
   // far-off summit exits. 35 world units is roughly half an ice face.
   const crossing=iceXOnPath(initial,upper.y);
   if(crossing<ledges[other][0]+10||
      crossing>ledges[other][1]-12)continue;
   const offset=Math.abs(crossing-upper.x);
   if(offset>80)continue;
   const cost=offset+vertical*.065;
   if(cost<best){best=cost;parent=other;}
  }
  if(parent<0){
   routes[tier]={tier,points:initial,sharedWith:null,joinY:null};
   continue;
  }
  const higher=routes[parent],join=higher.points[0];
  const transitionY=join.y+Math.min(125,(start.y-join.y)*.37);
  const lead={
   x:iceXOnPath(initial,transitionY),y:transitionY,tierIndex:tier
  };
  const bridge={x:join.x+(lead.x-join.x)*.48,
   y:join.y+(transitionY-join.y)*.50,tierIndex:tier};
  routes[tier]={tier,points:[start,lead,bridge,...higher.points],
   sharedWith:parent,joinY:join.y};
 }
 iceRouteCache.set(spireIndex,routes);
 return routes;
}
function iceClimbPoints(spireIndex,fromTier=null){
 const routes=iceRouteNetwork(spireIndex);
 return routes[fromTier===null?0:fromTier]?.points||[];
}
function icePositionAt(spireIndex,y,fromTier=0){
 const path=iceClimbPoints(spireIndex,fromTier);
 const x=iceXOnPath(path,y);
 return x===null?null:{x,y};
}
function independentIceRoutes(i){
 return iceRouteNetwork(i);
}

// Shared cave geometry for real collision, entrance, art and interaction.
// The left side is an open approach; the far-right wall is solid.
function caveGeometry(){
 const c=spires[4].cave;if(!c)return null;
 const w=c.right-c.left;
 return {
  left:c.left,right:c.right,ceiling:c.ceiling,floor:c.floor,
  wallX:c.right-18,ladderX:c.right-32,
  fireX:c.left+Math.round(w*.44),
  openingLeft:c.left-5,headroomY:c.ceiling+26
 };
}
function climbEntryX(platform) {
 if (!platform) return -999;
 return platform.kind === 'cave' ? caveGeometry().ladderX : platform.right - 30;
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
   nodes.push({x:tier[0]+Math.min(65,(tier[1]-tier[0])*.45),y:tier[2]+3});
  }
 } else if(mountain.cave) {
  nodes.push({x:mountain.cave.left+72,y:top[2]+48});
  nodes.push({x:mountain.cave.left-115,y:mountain.cave.ceiling-12});
  nodes.push({x:mountain.cave.left-123,y:mountain.cave.floor+82});
 } else {
  nodes.push({x:top[0]-55,y:top[2]+240});
 }
 const lowest=mountain.ledges.length ? Math.min(...mountain.ledges.map(v=>v[0])) : (mountain.cave ? mountain.cave.left : top[0]);
 nodes.push({x:lowest-145,y:2100});
 return nodes;
}
function rockBackingForIce(index,y,baseX){
 if(index<1||index>4||typeof FEATURED_COURSE==='undefined')return baseX;
 // A real solid bedrock buttress exists behind *every* drawable ice route.
 // A 64-unit inset keeps the rendered ice face from hanging in empty sky.
 // Transition zones outside the climb use a tapered rock shoulder.
 let face=baseX;
 for(const route of iceRouteNetwork(index)){
  const points=route.points,top=points.at(-1).y,bottom=points[0].y;
  if(y<top-36||y>bottom+45)continue;
  const fade=Math.min(1,(y-(top-36))/36,(bottom+45-y)/45);
  const x=iceXOnPath(points,y);
  face=Math.min(face,x-64*Math.max(0,fade));
 }
 return face;
}
// Source of truth for the opposite cliff boundary. Ice backing and
// rendering must use this same physical silhouette or floating ice returns.
function mountainFlankX(index,y){
 const s=spires[index],R=s.summit[1],T=s.summit[2];
 const depth=y-T,character=s.ridge?.character??.5;
 const recede=Math.min(index===4?95:175+character*85,
  depth*(index===4?.075:.12+character*.12));
 const stratified=Math.sin(depth*.0068+index)*
  Math.sin(depth*.0029+index*1.5)*22;
 return R+14-recede+Math.sin(depth*.014+index)*18+
  Math.sin(depth*.047+index*2)*7+stratified;
}
function mountainContourX(index,y){
 const nodes=mountainContourNodes(index);
 if(y<=nodes[0].y) return rockBackingForIce(index,y,nodes[0].x);
 for(let i=0;i<nodes.length-1;i++){
  const a=nodes[i],b=nodes[i+1];
  if(y<=b.y){
   const t=Math.max(0,Math.min(1,(y-a.y)/(b.y-a.y)));
   const jag=Math.sin(Math.PI*t)*(Math.sin(y*.071+index*2.2)*4-7);
   return rockBackingForIce(index,y,a.x+(b.x-a.x)*t+jag);
  }
 }
 return rockBackingForIce(index,y,nodes[nodes.length-1].x);
}
