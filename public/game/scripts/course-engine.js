// Summitbound: authored, validated five-peak vertical slice.
// This is ONE playable course, not five separate levels. The full campaign
// target is 100 levels; older 997 route seeds are retained only as archived
// generator/reference data and must not be exposed as playable content.
const FEATURED_COURSE=Object.freeze({
 id:'five-peaks',version:2,levelNumber:1,campaignSize:100,peakCount:5,
 name:'The Five Peaks',
 checkpoints:Object.freeze([{peak:0,type:'start'},
   {peak:2,type:'campsite',ledge:0},{peak:4,type:'campsite',ledge:0}]),
 peakShifts:Object.freeze([0,55,120,145,240]),
 ledgeOffsets:Object.freeze([
  Object.freeze([90,80,55]),
  Object.freeze([150,105,65]),
  Object.freeze([105,55,25])
 ]),
 motifs:Object.freeze(['launch ridge','toothed wall','exposed camp',
  'knife-edge crux','final campsite'])
});
function isFeaturedCourse(){return true;}
function featuredCheckpointAtPeak(peak){
 return FEATURED_COURSE.checkpoints.find(cp=>cp.peak===peak)||null;
}
function installFeaturedCourseGeometry(spires){
 if(spires.length!==FEATURED_COURSE.peakCount)
  throw Error('The vertical slice requires exactly five mountain records');
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
 // The intermediate camp is ONE narrow, high-precision landing. Players
 // cannot bypass the checkpoint via a broad, easy lower platform.
 spires[2].ledges=[spires[2].ledges.at(-1)];
 spires[2].ledges[0][4]='Checkpoint';
 spires[2].name='Windward Camp';
 spires[4].name='Firespine Camp';
 const cave=spires[4].cave,shift=FEATURED_COURSE.peakShifts[4];
 const campLeft=cave.left+shift,campWidth=177;
 spires[4].ledges=[[campLeft,campLeft+campWidth,cave.floor,'snow','Checkpoint']];
 spires[4].cave=null;
 spires[4].summit=[campLeft-72,campLeft+550,
   Math.min(-55,cave.floor-260),'snow'];
 // Widen the entire physical bedrock shoulder around EVERY retained
 // ledge and its ice path. The right-hand takeoff edge is preserved so
 // tested chasm distances do not become accidentally shorter.
 for(let i=1;i<spires.length;i++){
  const peak=spires[i],leftmost=Math.min(...peak.ledges.map(l=>l[0]));
  peak.summit=[Math.min(peak.summit[0],leftmost-70),
   peak.summit[1],peak.summit[2],peak.summit[3]];
 }
}
function featuredCampPosition(peak=2){
 const s=spires[peak],landing=s?.ledges?.[0];
 if(!landing||![2,4].includes(peak))return null;
 return {x:landing[0]+76,y:landing[2],peak};
}
function featuredCheckpointLanding(peak){
 if(!featuredCheckpointAtPeak(peak)||peak===0)return null;
 const l=spires[peak]?.ledges?.[0];
 return l?{id:'l'+peak+'-0',x:l[0]+Math.min(45,(l[1]-l[0])*.28),
  y:l[2]-22,peak}:null;
}

// The actual five-peak slice receives every useful physical generator check.
// Other courses are authored manifests using the same validators, not a
// promise that a random numeric seed creates a high-quality level.
function auditPlayableCourse(spec=FEATURED_COURSE){
 const failures=[],summary=[];
 if(spec.peakCount!==spires.length)failures.push('wrong peak count');
 for(let i=1;i<spires.length;i++){
  const previous=spires[i-1],peak=spires[i];
  const profiles=shelfTimingProfiles(peak.ledges,previous.summit);
  const routes=iceRouteNetwork(i);
  peak.ledges.forEach((ledge,tier)=>{
   const p=profiles[tier],path=routes[tier]?.points;
   if(!p||p.safe<2||p.hits<2)failures.push('unreachable peak '+i+' ledge '+tier);
   if(!path?.length||path.at(-1).x<peak.summit[0]+3||
      path.at(-1).x>peak.summit[1]-3)
    failures.push('disconnected ice summit '+i+'/'+tier);
   if(path)for(let n=0;n<=16;n++){
    const y=path.at(-1).y+(path[0].y-path.at(-1).y)*n/16;
    const x=iceXOnPath(path,y),rock=mountainContourX(i,y),flank=mountainFlankX(i,y);
    if(x-rock<26||flank-x<25)
     failures.push('unsupported ice '+i+'/'+tier+'/'+n);
   }
  });
  const checkpoint=featuredCheckpointAtPeak(i);
  if(checkpoint?.type==='campsite'&&peak.ledges.length!==1)
   failures.push('checkpoint mountain needs exactly one real landing ledge '+i);
  const minGap=Math.min(...peak.ledges.map(l=>l[0]-previous.summit[1]));
  if(minGap<400)failures.push('crossing not sufficiently wide '+i);
  summary.push({peak:i,landings:profiles.map(x=>x.safe),minClearance:minGap});
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
    peakSet===spires&&i>=1&&i<=4?iceRouteNetwork(i)[t]?.points:null;
   if(!points||points.at(-1).x<peak.summit[0]+3||
    points.at(-1).x>peak.summit[1]-3)
    issues.push('climb route missing real summit exit: '+i+'/'+t);
   else addEdge('l'+i+'-'+t,'s'+i,'ice',1);
  });
 });
 for(let i=1;i<peakSet.length;i++){
  const target=peakSet[i],dest=target.ledges;
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
    addEdge(source.id,'l'+i+'-'+t,
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
  const id=cp.type==='campsite'?'l'+cp.peak+'-'+(cp.ledge??0):'s'+cp.peak;
  if(!reachable.has(id))issues.push('unreachable checkpoint '+id);
 }
 return {valid:issues.length===0,issues,
  peakCount:peakSet.length,nodes,edges,
  reachable:[...reachable],
  shortcutCount:edges.filter(e=>e.kind==='ledge-shortcut').length,
  checkpointCount:(spec.checkpoints||[]).length};
}
