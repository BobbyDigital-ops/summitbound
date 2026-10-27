// Summitbound: authored, validated five-peak vertical slice.
// This is ONE playable course, not five separate levels. The full campaign
// target is 100 levels; older 997 route seeds are retained only as archived
// generator/reference data and must not be exposed as playable content.
const FEATURED_COURSE=Object.freeze({
 id:'five-peaks',version:1,levelNumber:1,campaignSize:100,peakCount:5,
 name:'The Five Peaks',
 checkpoints:Object.freeze([{peak:0,type:'start'},{peak:2,type:'campsite'},{peak:4,type:'cave'}]),
 // Deliberately different ledge gaps: safe recovery shelves can be
 // considerably farther out than the high, technical landing.
 peakShifts:Object.freeze([0,55,120,145,240]),
 ledgeOffsets:Object.freeze([
  Object.freeze([90,80,55]),
  Object.freeze([150,105,65]),
  Object.freeze([105,55,25])
 ]),
 motifs:Object.freeze(['launch ridge','toothed wall','exposed camp','knife-edge crux','tunnel summit'])
});
function isFeaturedCourse(){return true;}
function featuredCheckpointAtPeak(peak){
 return FEATURED_COURSE.checkpoints.find(cp=>cp.peak===peak)||null;
}
function installFeaturedCourseGeometry(spires){
 if(spires.length!==FEATURED_COURSE.peakCount)
  throw Error('The five-peak prototype requires exactly five peak records');
 for(let i=1;i<=3;i++){
  const shift=FEATURED_COURSE.peakShifts[i],
    prevShift=FEATURED_COURSE.peakShifts[i-1],
    offset=FEATURED_COURSE.ledgeOffsets[i-1];
  spires[i].summit=[spires[i].summit[0]+shift,
   spires[i].summit[1]+shift,...spires[i].summit.slice(2)];
  spires[i].ledges=spires[i].ledges.map((ledge,tier)=>[
   ledge[0]+prevShift+offset[tier],ledge[1]+prevShift+offset[tier],
   ...ledge.slice(2)]);
 }
 const cave=spires[4].cave,caveShift=FEATURED_COURSE.peakShifts[4];
 cave.left+=caveShift;cave.right+=caveShift;
 spires[4].summit=[spires[4].summit[0]+caveShift,
  spires[4].summit[1]+caveShift,...spires[4].summit.slice(2)];
}
function featuredCampPosition(){
 const s=spires[2].summit;
 return {x:s[0]+Math.min(176,(s[1]-s[0])*.36),y:s[2],peak:2};
}
// The actual five-peak slice receives every useful physical generator check.
// Other courses are authored manifests using the same validators, not a
// promise that a random numeric seed creates a high-quality level.
function auditPlayableCourse(spec=FEATURED_COURSE){
 const failures=[],summary=[];
 if(spec.peakCount!==spires.length)failures.push('wrong peak count');
 for(let i=1;i<spires.length;i++){
  const prev=spires[i-1],peak=spires[i];
  if(i<4){
   const profiles=shelfTimingProfiles(peak.ledges,prev.summit);
   const routes=iceRouteNetwork(i);
   peak.ledges.forEach((ledge,tier)=>{
    const p=profiles[tier],path=routes[tier]?.points;
    if(!p||p.safe<2||p.hits<2)failures.push('unreachable peak '+i+' ledge '+tier);
    if(!path?.length||path.at(-1).x<peak.summit[0]+3||
     path.at(-1).x>peak.summit[1]-3)
     failures.push('disconnected ice summit '+i+'/'+tier);
    if(path)for(let n=0;n<=12;n++){
     const y=path.at(-1).y+(path[0].y-path.at(-1).y)*n/12;
     const x=iceXOnPath(path,y),rock=mountainContourX(i,y);
     const flank=mountainFlankX(i,y);
     if(x-rock<26||flank-x<25)
      failures.push('unsupported ice '+i+'/'+tier+'/'+n);
    }
   });
   summary.push({peak:i,landings:profiles.map(x=>x.safe),
    minClearance:Math.min(...peak.ledges.map(l=>l[0]-prev.summit[1]))});
  } else {
   const cave=peak.cave;
   if(cave.left-prev.summit[1]<420)failures.push('final cave leap too short');
   if(caveGeometry().ladderX<peak.summit[0]+3||
    caveGeometry().ladderX>peak.summit[1]-3)
     failures.push('cave tunnel ladder cannot reach summit');
  }
 }
 return {valid:failures.length===0,failures,summary};
}

// Generic route-graph compiler for future authored manifests. Peak count,
// ledge count and optional shortcut edges are NOT hardcoded to five. Each
// candidate vault edge must be supported by the actual pole-flight sampler;
// climbing edges are traversable only along physical climb routes.
// This does not magically establish fun or visual quality: those require
// human signoff before any level is admitted into the 100-level campaign.
function compilePhysicalCourseGraph(peakSet=spires,spec=FEATURED_COURSE,routeResolver=null){
 const nodes=[],edges=[],issues=[];
 if(peakSet!==spires&&!routeResolver)
  issues.push('custom mountain geometry requires a physically authored climb route resolver');
 const addNode=(id,type,peak,surface)=>nodes.push({id,type,peak,
  left:surface[0],right:surface[1],top:surface[2]});
 const addEdge=(from,to,kind,safe)=>edges.push({from,to,kind,safe});
 peakSet.forEach((peak,i)=>{
  addNode('s'+i,'summit',i,peak.summit);
  peak.ledges.forEach((ledge,t)=>addNode('l'+i+'-'+t,'ledge',i,ledge));
  if(peak.cave)addNode('cave'+i,'cave',i,
   [peak.cave.left,peak.cave.right,peak.cave.floor]);
  if(peak.cave)addEdge('cave'+i,'s'+i,'tunnel-ladder',1);
  peak.ledges.forEach((ledge,t)=>{
   const points=routeResolver?routeResolver(peakSet,i,t):
    peakSet===spires&&i>=1&&i<=3?iceRouteNetwork(i)[t]?.points:null;
   if(!points||points.at(-1).x<peak.summit[0]+3||
    points.at(-1).x>peak.summit[1]-3)
    issues.push('climb route missing real summit exit: '+i+'/'+t);
   else addEdge('l'+i+'-'+t,'s'+i,'ice',1);
  });
 });
 for(let i=1;i<peakSet.length;i++){
  const target=peakSet[i],dest=target.cave?
   [[target.cave.left,target.cave.right,target.cave.floor,'rock','Cave']]:
   target.ledges;
  const sources=[{id:'s'+(i-1),surface:peakSet[i-1].summit}];
  // Launches from lower/middle/high real shelves become available only when
  // there is enough surface for a full run-up and a physics-verified arrival.
  if(i>=2){
   peakSet[i-1].ledges.forEach((p,t)=>{
    if(p[1]-p[0]>=165)sources.push({id:'l'+(i-1)+'-'+t,surface:p});
   });
  }
  for(const source of sources){
   const profiles=shelfTimingProfiles(dest,source.surface);
   for(let t=0;t<dest.length;t++){
    if(profiles[t].safe<2)continue;
    addEdge(source.id,target.cave?'cave'+i:'l'+i+'-'+t,
     source.id.startsWith('s')?'vault':'ledge-shortcut',profiles[t].safe);
   }
   if(source.id.startsWith('s')&&!profiles.some(p=>p.safe>=2))
    issues.push('no reachable vault across chasm '+i);
  }
 }
 const reachable=new Set(['s0']);
 let changed=true;
 while(changed){
  changed=false;
  for(const edge of edges){
   if(reachable.has(edge.from)&&!reachable.has(edge.to)){
    reachable.add(edge.to);changed=true;
   }
  }
 }
 if(!reachable.has('s'+(peakSet.length-1)))
  issues.push('the final summit cannot be reached');
 for(const cp of spec.checkpoints||[]){
  const id=cp.type==='cave'?'cave'+cp.peak:'s'+cp.peak;
  if(!reachable.has(id))issues.push('unreachable checkpoint '+id);
 }
 return {valid:issues.length===0,issues,
  peakCount:peakSet.length,nodes,edges,
  reachable:[...reachable],
  shortcutCount:edges.filter(e=>e.kind==='ledge-shortcut').length,
  checkpointCount:(spec.checkpoints||[]).length};
}
