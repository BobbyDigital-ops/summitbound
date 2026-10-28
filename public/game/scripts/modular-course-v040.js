/* SUMMITBOUND 0.40 — modular PHYSICAL peak composition.
 * Geometry is created before applyRoute builds gameplay platforms.
 * The physical rock silhouette, 1..5 sized landing modules and ice routes
 * are derived from the very same world coordinates, not a parallel visual map.
 * Reject candidates with failed real-physics route/collision certification.
 * Original and Challenge remain untouched and reversible.
 */
(function(root){
'use strict';
const CONNECTOR=Object.freeze({
 S:Object.freeze({span:72,lip:[[-1,0],[-.45,-.09],[0,-.19],[.45,-.09],[1,0]]}),
 M:Object.freeze({span:144,lip:[[-1,0],[-.5,-.12],[0,-.24],[.5,-.12],[1,0]]}),
 L:Object.freeze({span:240,lip:[[-1,0],[-.6,-.07],[0,-.12],[.6,-.07],[1,0]]})
});
const BASES=Object.freeze(['granite-bastion','shattered-shoulder','riven-massif','scree-crown',
 'tower-block','split-saddle','knife-ridge','storm-terrace','layered-crag','western-face','winter-plateau','fissured-rib']);
const SUMMITS=Object.freeze(['split-needle','broken-spur','wedge-crown','hanging-horn','snow-rib','three-prongs','slant-face','shattered-brow']);
const EXTENSIONS=Object.freeze(['snow-shelf','fractured-buttress','high-rib','stepped-rock','ice-stained-flank',
 'overhanging-shoulder','frosted-nose','granite-tooth','scree-collar','broken-terrace','dark-chute','split-rock']);
const PLATFORM_LIBRARY=Object.freeze(Array.from({length:50},(_,i)=>Object.freeze({
 id:'platform-'+(Math.floor(i/10)+1)+'-'+(i%10+1),
 size:Math.floor(i/10)+1,finish:['snow','granite','crust','frost','slate'][i%5],
 edge:['broken','scalloped','jagged','weathered','inclined'][Math.floor(i/5)%5]
})));
let currentSeed=11,lastReport=null;
function rngFor(seed){let x=(seed>>>0)||1;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function sizeFor(width){return width<=65?1:width<=125?2:width<=215?3:width<=370?4:5;}
function clonePeaks(){return spires.map(m=>({
  summit:[...m.summit],ledges:m.ledges.map(l=>[...l]),ridgeArrival:m.ridgeArrival?[...m.ridgeArrival]:null,
  rockShoulderLeft:m.rockShoulderLeft, ridgeCrux:m.ridgeCrux?{...m.ridgeCrux}:null,
  moduleAssembly:m.moduleAssembly
}));}
function restore(snapshot){
 for(let i=0;i<spires.length;i++){
  const m=spires[i],v=snapshot[i];
  m.summit=[...v.summit];m.ledges=v.ledges.map(l=>[...l]);
  if(v.ridgeArrival)m.ridgeArrival=[...v.ridgeArrival];else delete m.ridgeArrival;
  if(Number.isFinite(v.rockShoulderLeft))m.rockShoulderLeft=v.rockShoulderLeft;
  else delete m.rockShoulderLeft;
  if(v.ridgeCrux)m.ridgeCrux={...v.ridgeCrux};else delete m.ridgeCrux;
  if(v.moduleAssembly)m.moduleAssembly=v.moduleAssembly;else delete m.moduleAssembly;
 }
 if(typeof iceRouteCache!=='undefined')iceRouteCache.clear();
 if(typeof invalidateTerrainCache==='function')invalidateTerrainCache();
}
function generateAssembly(peak,index,seed){
 const r=rngFor(seed*1667+(index+3)*99173), base=BASES[(seed*3+index*7)%BASES.length];
 const upper=peak.ridgeArrival||peak.summit, main=peak.summit;
 const pieces=[];
 const add=(role,id,connector,anchor,extra={})=>{
  const piece={role,id,connector,join:connector==='ROOT'?0:CONNECTOR[connector].span,
   anchor:{x:Math.round(anchor.x),y:Math.round(anchor.y)},...extra};
  pieces.push(piece);return piece;
 };
 // Foundations use a separate root rule. Exposed sockets use exactly S/M/L.
 add('base',base,'ROOT',{x:main[0]+(main[1]-main[0])*.55,y:main[2]+230},
  {root:true,bodyDepth:720,facets:8+Math.floor(r()*5)});
 if(index%2===0||r()>.48){
  add('base',BASES[(index*3+seed+5)%BASES.length],'L',
    {x:upper[0]+(upper[1]-upper[0])*.4,y:upper[2]+325},{bodyDepth:440,facets:6});
 }
 add('summit',SUMMITS[(seed+index*5)%SUMMITS.length],'M',
  {x:main[0]+(main[1]-main[0])*.32,y:main[2]+55},
  {scenic:true,walkable:[main[0],main[1],main[2]]});
 // Each selected slot is assigned one of 50 interchangeable platform assets.
 // Slot is absent rather than invisible collision when not filled.
 const slots=[];
 for(let k=0;k<peak.ledges.length;k++){
  const ledge=peak.ledges[k],size=sizeFor(ledge[1]-ledge[0]);
  const options=PLATFORM_LIBRARY.filter(x=>x.size===size);
  const prefab=options[(seed*7+index*3+k*9)%options.length];
  const slot={id:'socket-'+index+'-'+k,size,occupied:true,platform:prefab.id,
   surfaceId:'l'+index+'-'+k,
   geometry:[ledge[0],ledge[1],ledge[2]],finish:prefab.finish};
  slots.push(slot);
  add('extension',EXTENSIONS[(seed+index*4+k*7)%EXTENSIONS.length],
   size<=2?'S':size===3?'M':'L',
   {x:(ledge[0]+ledge[1])/2,y:ledge[2]+64},{slotId:slot.id,solid:true});
 }
 const count=Math.max(0,Math.min(7-pieces.length,1+((seed+index)%2)));
 for(let j=0;j<count;j++){
  const connector=['S','M','L'][(j+seed+index)%3];
  const x=upper[0]+(upper[1]-upper[0])*(.15+.6*r());
  const y=upper[2]+115+125*r();
  add('extension',EXTENSIONS[(seed+j+index*5+7)%EXTENSIONS.length],
   connector,{x,y},{solid:true,scenic:true});
 }
 // Optional unfilled slots deliberately have NO gameplay collider and NO
 // visual marker in the normal game.
 const optionalSlots=[1,2,3,4,5].filter(s=>r()>.49)
  .map((size,j)=>({id:'unused-'+index+'-'+j,size,occupied:false}));
 return {schema:'summitbound.peak-modules.v1',seed,peak:index,
  root:base,pieces,slots:slots.concat(optionalSlots),upper:[...upper],
  rockBacking:true,iceAnchorSource:'iceRouteNetwork'};
}
function scoreChanges(reference){
 let changed=0,amount=0;
 for(let i=1;i<spires.length;i++){
  const orig=reference[i].ledges,now=spires[i].ledges;
  for(let j=0;j<now.length;j++){
   const delta=Math.abs(now[j][0]-orig[j][0])+Math.abs(now[j][1]-orig[j][1])+
    Math.abs(now[j][2]-orig[j][2]);
   if(delta>=10)changed++;amount+=delta;
  }
 }
 return {changed,amount};
}
function candidateEdit(i,k,seed,attempt){
 const l=spires[i].ledges[k],r=rngFor(seed*31337+i*383+k*719+attempt*101);
 const oldWidth=l[1]-l[0];
 // Authored platform socket widths are retained within their 1-5 family.
 // Move a complete rock-backed ledge, not just an overlaid white stripe.
 const xMove=Math.round((r()-.5)*[180,125,90,56,38,26][attempt]);
 const widthDelta=Math.round((r()-.28)*[105,75,53,34,25,16][attempt]);
 const rise=Math.round((r()-.5)*[72,52,36,20,12,8][attempt]);
 const width=Math.max(oldWidth>125?126:66,oldWidth+widthDelta);
 l[0]+=xMove;l[1]=l[0]+width;l[2]+=rise;
 l.platformSize=width<=52?'foothold':width<=115?'narrow':
  width<=215?'shelf':width<=370?'terrace':'summit';
}
function fullAudit(){
 if(typeof iceRouteCache!=='undefined')iceRouteCache.clear();
 const physics=auditPlayableCourse(),graph=compilePhysicalCourseGraph();
 return {valid:physics.valid&&graph.valid,physics,graph};
}
// Build full solid geometry BEFORE certification. The old algorithm audited
// the legacy cliff and only then replaced it with a different mesh, allowing
// a generated ice route to pass validation but fail during real gameplay.
function assembleCandidate(){
 for(let i=0;i<spires.length;i++){
  const peak=spires[i];
  peak.moduleAssembly=generateAssembly(peak,i,currentSeed);
  if(typeof SummitPeakMesh!=='undefined'){
   const mesh=SummitPeakMesh.meshFor(peak,i,currentSeed);
   const check=SummitPeakMesh.audit(mesh,i,peak);
   if(!check.valid)throw Error('Physical mountain assembly rejected: '+check.errors.join(', '));
   peak.moduleAssembly.mesh=mesh;
   // Polygon pieces, not the old "art anchors", are now authoritative.
   peak.moduleAssembly.pieces=mesh.parts.map(p=>({
    id:p.id,role:p.role,connector:p.connector,
    polygon:p.polygon,joinId:p.joinId||null,parent:p.parent||null
   }));
   peak.moduleAssembly.slots=mesh.slots;
  }
 }
}
function install(seed=currentSeed){
 currentSeed=Math.max(1,Math.floor(Number(seed)||1));
 for(const m of spires)delete m.moduleAssembly;
 const baseline=clonePeaks();let best=null,report=null;
 // Small independent modules are generated and then evaluated against the
 // real 120 Hz vault contact sampler, ice exits, crux, checkpoints and graph.
 // No invalid generation is allowed to become playable.
 for(let attempt=0;attempt<12;attempt++){
  restore(baseline);
  // Optional platform slots: alternate module combinations may expose
  // only two out of three landing shelves, with no phantom collision left.
  if(attempt<3)for(const index of [1,3]){
   if((currentSeed+index+attempt)%4===0&&spires[index].ledges.length>2)
    spires[index].ledges.splice(1,1);
  }
  for(let i=1;i<=4;i++){
   for(let k=0;k<spires[i].ledges.length;k++){
    // A small subset are left unmodified; the rest are real variant slots.
    if((currentSeed+i*3+k+attempt)%5===0)continue;
    candidateEdit(i,k,currentSeed,attempt);
   }
  }
  // Keep the starting ledge physical but decorative, and the checkpoints
  // unambiguously tied to their fixed campsite indices 2 and 4.
  const changes=scoreChanges(baseline);
  if(changes.changed<2)continue;
  assembleCandidate();
  const a=fullAudit();
  if(a.valid){best=clonePeaks();report={certified:true,seed:currentSeed,changes,
     checked:attempt+1,graphEdges:a.graph.edges.length};break;}
 }
 if(best)restore(best);
 else {
  restore(baseline);
  assembleCandidate();
  report={certified:false,seed:currentSeed,changes:{changed:0,amount:0},
   reason:'No fully certified assembled polygon course; retained physical baseline'};
 }
 // Snapshot the route as well as the piece catalog; the actual platform
 // objects are built by applyRoute immediately after this method returns.
 lastReport=report;return report;
}
function auditInstalled(){
 const issues=[],all=spires.map((p,i)=>p.moduleAssembly);
 for(let i=0;i<all.length;i++){
  const m=all[i];
  if(!m||m.pieces.length<3||m.pieces.length>7)issues.push('piece count '+i);
  if(m?.mesh){const checked=SummitPeakMesh.audit(m.mesh,i,spires[i]);
   if(!checked.valid)issues.push(...checked.errors.map(e=>'mesh '+i+': '+e));}
  for(const piece of m?.pieces||[])if(piece.connector!=='ROOT'&&!CONNECTOR[piece.connector])
   issues.push('connector '+i+'/'+piece.id);
  for(const slot of m?.slots||[]){
   if(!slot.occupied)continue;
   const collider=platforms.find(p=>p.id===slot.surfaceId);
   if(!collider||collider.left!==slot.geometry[0]||
    collider.right!==slot.geometry[1]||collider.top!==slot.geometry[2])
    issues.push('platform slot mismatch '+i+'/'+slot.id);
  }
  if(i>0){
   for(const route of iceRouteNetwork(i)){
    const from=platforms.find(p=>p.id==='l'+i+'-'+route.tier);
    const to=platforms.find(p=>p.id===(spires[i].ridgeArrival?'a':'s')+i);
    if(!from||!to||!route.points?.length)issues.push('ice route '+i+'/'+route.tier);
    else if(Math.abs(route.points[0].y-(from.top-22))>3||
       Math.abs(route.points.at(-1).y-(to.top-22))>3)
     issues.push('ice anchors '+i+'/'+route.tier);
   }
  }
 }
 return {valid:issues.length===0,issues,report:lastReport,modules:all};
}
root.SummitModularEngine=Object.freeze({
 version:'0.40',CONNECTOR,BASES,SUMMITS,EXTENSIONS,PLATFORM_LIBRARY,
 install,auditInstalled,assembly:(i)=>spires[i]?.moduleAssembly,
 seed:()=>currentSeed,report:()=>lastReport,
 nextSeed:()=>{currentSeed+=1;return currentSeed;}
});
})(typeof window==='undefined'?globalThis:window);
