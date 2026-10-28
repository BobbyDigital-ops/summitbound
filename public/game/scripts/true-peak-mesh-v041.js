/* Summitbound TRUE PEAK MESH v0.41.
   The mountains below are NOT old cliff sprites with labels. Each visible
   massif is assembled from world-space polygon pieces joined along the exact
   same socket vertices. Filled 1..5 slots are the real platform colliders.
   Empty slots generate no ledge and no paint. No game-physics changes. */
(()=>{
'use strict';
const SIZE={S:72,M:144,L:240};
const BASE_LIBRARY=[
 'storm-wall','split-ridge','crumpled-slate','double-buttress',
 'slanted-spine','overturned-strata','sheared-face','northern-spur',
 'ice-bitten-rock','loose-crown','weathered-tower','black-massif'
];
const EXT_LIBRARY=[
 'ledge-buttress','ribbed-overhang','wind-carved-nose','scree-shelf',
 'fractured-mantle','granite-wing','broken-shoulder','shadow-rib',
 'deep-gully','slate-bastion','frosted-spur','folded-rock'
];
const SUMMIT_LIBRARY=[
 'canted-horn','split-spire','broken-wedge','dark-needle',
 'sawtooth','rock-fin','blunt-crag','split-crown'
];
const PROFILE=[0,.08,-.13,.11,0];
const clamp=(x,l,h)=>Math.max(l,Math.min(h,x));
const rng=seed=>{let x=seed>>>0;return ()=>((x=(Math.imul(x,1664525)+1013904223)>>>0)/4294967296)};
const lerp=(a,b,t)=>a+(b-a)*t;
function at(nodes,y){
 if(y<=nodes[0][1])return nodes[0][0];
 for(let i=1;i<nodes.length;i++)if(y<=nodes[i][1]){
  const a=nodes[i-1],b=nodes[i],t=(y-a[1])/(b[1]-a[1]||1);
  return lerp(a[0],b[0],t);
 }
 return nodes.at(-1)[0];
}
function segmentSocket(guide,center,size,side,id,parent){
 const span=SIZE[size],first=center-span/2,last=center+span/2;
 const ax=at(guide,first),bx=at(guide,last);
 const vertices=PROFILE.map((k,j)=>[
  Math.round((lerp(ax,bx,j/4)+(side==='left'?1:-1)*k*span*.43)*100)/100,
  Math.round((first+j*span/4)*100)/100
 ]);
 return {id,parent,size,span,side,center,vertices};
}
function sideAt(guide,sockets,y){
 for(const socket of sockets){
  const first=socket.vertices[0][1],last=socket.vertices.at(-1)[1];
  if(y<first||y>last)continue;
  const t=(y-first)/(last-first);
  const index=Math.min(3,Math.floor(t*4)),f=t*4-index;
  return lerp(socket.vertices[index][0],socket.vertices[index+1][0],f);
 }
 return at(guide,y);
}
function outline(leftGuide,rightGuide,leftSockets,rightSockets,top,bottom){
 const knots=new Set([top,bottom]);
 for(let y=top+18;y<bottom;y+=18)knots.add(y);
 for(const s of leftSockets.concat(rightSockets))
  for(const v of s.vertices)knots.add(v[1]);
 const ys=[...knots].filter(y=>y>=top&&y<=bottom).sort((a,b)=>a-b);
 const left=ys.map(y=>[sideAt(leftGuide,leftSockets,y),y]);
 const right=ys.map(y=>[sideAt(rightGuide,rightSockets,y),y]);
 return {polygon:left.concat(right.reverse()),left,right};
}
function polygonArea(points){
 let sum=0;for(let j=0;j<points.length;j++){
  const a=points[j],b=points[(j+1)%points.length];
  sum+=a[0]*b[1]-b[0]*a[1];
 }return Math.abs(sum/2);
}
function connectorOfWidth(w){return w<112?'S':w<220?'M':'L';}
function platformSize(w){return w<=65?1:w<=125?2:w<=215?3:w<=370?4:5;}
function makeRoot(peak,index,surface,tag,seed,ledgeIndices,rootNo){
 const r=rng(seed*19171+index*3847+rootNo*7153+13);
 const l=surface[0],rt=surface[1],t=surface[2],bottom=2070+Math.floor(r()*110);
 const m=rt-l,kind=BASE_LIBRARY[(seed*5+index*7+rootNo*3)%BASE_LIBRARY.length];
 const ledges=ledgeIndices.map(k=>({k,ledge:peak.ledges[k]}));
 const ordered=ledges.map(({ledge})=>[
   ledge[0]+Math.min(55,(ledge[1]-ledge[0])*.23),ledge[2]+3
 ]).sort((a,b)=>a[1]-b[1]);
 const lo=ordered.length?Math.min(...ordered.map(p=>p[0])):l;
 // The authored base has a flat *walkable* upper terrace. Rock shoulders
 // and deep asymmetrical planes are real component geometry, not decals.
 const leftGuide=[
  [l-9,t],[l-80-r()*155,t+95+r()*70],
  ...ordered,
  [lo-90-r()*120,Math.max(t+740,ordered.at(-1)?.[1]+300||0)],
  [lo-260-r()*460,bottom]
 ].sort((a,b)=>a[1]-b[1]);
 // De-duplicate control heights to keep interpolation deterministic.
 const left=[];
 for(const point of leftGuide){
  if(left.length&&point[1]<=left.at(-1)[1])continue;
  left.push(point);
 }
 const right=[
  [rt+9,t],
  [rt+75+r()*210,t+150],
  [rt+115+r()*360,t+390],
  [rt+130+r()*410,t+790],
  [rt+180+r()*570,bottom]
 ];
 // One physically connecting socket for every occupied landing shelf,
 // plus an additional right-flank rock attachment where space permits.
 // The rock backing for every icefall is cut into the actual
 // foundation outline. This is not a virtual render-only ice buttress.
 if(ledgeIndices.length&&typeof iceRouteNetwork==='function'){
  const ice=iceRouteNetwork(index);
  const original=left.slice();
  const nodes=[];
  const levels=new Set(original.map(p=>p[1]));
  for(let y=t+9;y<=bottom;y+=14)levels.add(y);
  for(const l of ledges)levels.add(l.ledge[2]+3);
  for(const y of [...levels].sort((a,b)=>a-b)){
   let edge=at(original,y);
   for(const route of ice){
    const low=route.points[0].y,high=route.points.at(-1).y;
    if(y<high+3||y>low+8)continue;
    const fade=Math.min(1,(y-high-3)/35,(low+8-y)/35);
    if(fade<=0)continue;
    edge=Math.min(edge,lerp(edge,iceXOnPath(route.points,y)-72,fade));
   }
   // Actual occupied ledge lips must remain bedrock-supported even if
   // another ice route crosses behind them at this height.
   for(const {ledge} of ledges){
    const distance=Math.abs(y-(ledge[2]+3));
    if(distance>=44)continue;
    const strength=distance<=10?1:(44-distance)/34;
    const eased=strength*strength*(3-2*strength);
    const target=ledge[0]+Math.min(42,(ledge[1]-ledge[0])*.24);
    edge+=Math.max(0,target-edge)*eased;
   }
   nodes.push([edge,y]);
  }
  left.length=0;left.push(...nodes);
 }
 const sockets=[];
 for(const {k,ledge} of ledges){
  // A connector is only as long as its free face allows. Platform size
  // (1..5) is independent of jigsaw connection size (S/M/L).
  let span=connectorOfWidth(ledge[1]-ledge[0]);
  const next=ledges.filter(z=>z.ledge[2]>ledge[2])
    .sort((a,b)=>a.ledge[2]-b.ledge[2])[0];
  const clearance=next?next.ledge[2]-ledge[2]:Infinity;
  while((SIZE[span]+48)>=clearance&&span!=='S')
   span=span==='L'?'M':'S';
  const center=ledge[2]+24+SIZE[span]*.5;
  const id='join-'+index+'-'+tag+'-ledge-'+k;
  sockets.push(segmentSocket(left,center,span,'left',id,'root-'+index+'-'+tag));
 }
 const rightHeight=t+285+90*r(),rightSize=['S','M','L'][(seed+index+rootNo)%3];
 const sideSocket=segmentSocket(right,rightHeight,rightSize,'right','join-'+index+'-'+tag+'-flank','root-'+index+'-'+tag);
 sockets.push(sideSocket);
 const leftSock=sockets.filter(s=>s.side==='left'),rightSock=sockets.filter(s=>s.side==='right');
 const outlineData=outline(left,right,leftSock,rightSock,t,bottom);
 return {kind:'base',id:'root-'+index+'-'+tag,name:kind,role:'base',
  connector:'ROOT',surface:[...surface],polygon:outlineData.polygon,
  left:outlineData.left,right:outlineData.right,guideLeft:left,guideRight:right,
  sockets,ledgeIndices:ledgeIndices.slice(),bodyBottom:bottom,meshRoot:true};
}
function ledgeExtension(peak,index,root,slot,seed){
 const l=peak.ledges[slot],w=l[1]-l[0],size=connectorOfWidth(w);
 const join=root.sockets.find(s=>s.id.endsWith('-ledge-'+slot));
 if(!join)throw Error('Missing mating connector '+index+'/'+slot);
 const top=l[2],span=SIZE[size],r=rng(seed*6551+index*117+slot*29);
 const jag=48+r()*70,outer=l[0]-18-r()*60;
 // Exact parent edge shared by this child; no offset, no open seam.
 const seam=join.vertices.map(v=>[...v]);
 // Build a non-self-intersecting outcrop outward from the common
 // vertical connector. The separate populated platform art sits over its
 // solid buttress, with exactly the same collider coordinates.
 const outX=Math.min(outer-jag,Math.min(...seam.map(p=>p[0]))-105);
 const topY=seam[0][1],lowY=seam.at(-1)[1];
 const poly=seam.concat([
  [outX+32,lowY+42],[outX-18,lowY+12],
  [outX-39,lerp(topY,lowY,.58)],
  [outX+9,topY-42],[seam[0][0]-64,topY-28]
 ]);
 return {kind:'ledge',role:'extension',id:'ledge-module-'+index+'-'+slot,
  name:EXT_LIBRARY[(seed+slot*7+index*3)%EXT_LIBRARY.length],
  connector:size,parent:root.id,joinId:join.id,seam,
  platformSlot:'l'+index+'-'+slot,platform:[...l],
  polygon:poly,filled:true};
}
function flankExtension(index,root,seed,variant){
 const join=root.sockets.find(s=>s.side==='right');
 if(!join)return null;
 const r=rng(seed*4201+index*7181+variant*371),seam=join.vertices.map(v=>[...v]);
 const center=join.center,h=SIZE[join.size],x=Math.max(...seam.map(p=>p[0]));
 const outer=x+140+r()*250,up=center-h*.57-r()*70,low=center+h*.72+r()*90;
 const poly=seam.concat([
  [outer-45,low],[outer+35,center+h*.32],
  [outer,center+h*.06],[outer-45,up+54],
  [x+46,up],[x+10,center-h*.35]
 ]);
 return {kind:'flank',role:'extension',id:'flank-'+index+'-'+root.id,
  name:EXT_LIBRARY[(seed*2+index*3+variant*7)%EXT_LIBRARY.length],
  parent:root.id,joinId:join.id,connector:join.size,seam,
  polygon:poly,filled:false};
}
function crownExtension(index,root,seed){
 const r=rng(seed*2903+index*7147),surface=root.surface;
 const top=surface[2],l=surface[0],w=surface[1]-surface[0];
 // The apex sits outside the usable run-up and ice-exit surface.
 // A finite vertical rock socket is engraved in the parent left shoulder.
 const join=segmentSocket(root.guideLeft,top+46,'S','left',
  'join-'+index+'-'+root.id+'-crown',root.id);
 root.sockets.push(join);
 const seam=join.vertices.map(v=>[...v]);
 const left=Math.min(...seam.map(p=>p[0])),far=left-150-r()*150,tipY=top-115-r()*180;
 const poly=[
  ...seam,[far+40,top+265],[far-35,top+132],
  [far-58,top+28],[far-22,top-34],
  [far+11,tipY+82],[far+90,tipY],
  [left-30,top+12],[left+15,top+24]
 ];
 // A newly added socket must affect the base's actual polygon, not just
 // metadata; recompute base seam vertices including the crown socket.
 const leftSockets=root.sockets.filter(s=>s.side==='left');
 const rightSockets=root.sockets.filter(s=>s.side==='right');
 const changed=outline(root.guideLeft,root.guideRight,leftSockets,rightSockets,top,root.bodyBottom);
 root.polygon=changed.polygon;root.left=changed.left;root.right=changed.right;
 return {kind:'crown',role:'summit',id:'crown-'+index+'-'+root.id,
  name:SUMMIT_LIBRARY[(seed+index*3)%SUMMIT_LIBRARY.length],
  connector:'S',parent:root.id,joinId:join.id,seam,polygon:poly,filled:false};
}
function meshFor(peak,index,seed){
 const roots=[],parts=[],sockets=[],slots=[];
 if(peak.ridgeArrival){
  roots.push(makeRoot(peak,index,peak.ridgeArrival,'arrival',seed,peak.ledges.map((_,k)=>k),0));
  roots.push(makeRoot(peak,index,peak.summit,'takeoff',seed+6,[],1));
 }else roots.push(makeRoot(peak,index,peak.summit,'main',seed,
  peak.ledges.map((_,k)=>k),0));
 parts.push(...roots);
 // An actual additional summit rock component is connected to a foundation.
 // Climbing faces must remain uninterrupted: only the starting peak
 // receives a tall scenic crown. Other peaks derive their silhouettes
 // from the real connected buttresses and flank extensions.
 if(index===0){const crown=crownExtension(index,roots[0],seed);parts.push(crown);}
 for(let k=0;k<peak.ledges.length;k++){
  const root=roots[0],module=ledgeExtension(peak,index,root,k,seed);
  parts.push(module);
  const w=peak.ledges[k][1]-peak.ledges[k][0];
  slots.push({id:'slot-'+index+'-'+k,occupied:true,size:platformSize(w),
   surfaceId:'l'+index+'-'+k,geometry:peak.ledges[k].slice(0,3),
   piece:module.id});
 }
 const maxParts=7;
 for(const root of roots){
  if(parts.length>=maxParts)break;
  const extension=flankExtension(index,root,seed,parts.length);
  if(extension)parts.push(extension);
 }
 // Unfilled slots are not rendered and have no corresponding physics object.
 for(let k=0;k<3;k++)if((seed+index*2+k)%3!==0)
  slots.push({id:'empty-'+index+'-'+k,occupied:false,size:(k+seed)%5+1});
 for(const root of roots)sockets.push(...root.sockets);
 const byId=new Map(parts.map(p=>[p.id,p]));
 const seams=[];
 for(const p of parts.filter(p=>p.parent)){
  const join=sockets.find(s=>s.id===p.joinId);
  if(!join||join.parent!==p.parent)throw Error('Unmatched jigsaw side '+p.id);
  if(JSON.stringify(join.vertices)!==JSON.stringify(p.seam))
   throw Error('Non-flush mountain connection '+p.id);
  seams.push({parent:join.parent,child:p.id,profile:join.size,vertices:join.vertices});
 }
 if(parts.length<3||parts.length>7)throw Error('Peak piece count invalid '+index+': '+parts.length);
 const fingerprint=parts.map(p=>p.polygon.map(v=>v.map(k=>Math.round(k/5)).join(',')).join(';')).join('|');
 return {version:1,seed,index,parts,roots:roots.map(r=>r.id),sockets,seams,
  slots, fingerprint, geometrySource:'assembled-polygons',iceSource:'physical-route-network'};
}
function meshContour(mesh,y,rootTag='entry'){
 const root=mesh.parts.find(p=>p.meshRoot&&
  (rootTag==='exit'?p.id.endsWith('takeoff'):!p.id.endsWith('takeoff')))||
  mesh.parts.find(p=>p.meshRoot);
 if(!root)return null;
 const guide=root.left;
 return at(guide,y);
}
function meshFlank(mesh,y){
 const root=mesh.parts.find(p=>p.meshRoot&&
  (p.id.endsWith('takeoff')||!mesh.parts.some(q=>q.id.endsWith('takeoff'))));
 return root?at(root.right,y):null;
}
function audit(mesh,index,peak){
 const errors=[];
 if(mesh.parts.length<3||mesh.parts.length>7)errors.push('piece count');
 const roots=mesh.parts.filter(p=>p.meshRoot);
 if(roots.length<1||roots.length>2)errors.push('base count');
 const profileIds=new Set(mesh.sockets.map(s=>s.id));
 for(const p of mesh.parts){
  if(p.polygon.length<6||polygonArea(p.polygon)<600)errors.push('degenerate '+p.id);
  if(p.parent&&!profileIds.has(p.joinId))errors.push('dangling '+p.id);
  if(p.connector!=='ROOT'&&!SIZE[p.connector])errors.push('socket size '+p.id);
 }
 if(mesh.seams.length!==mesh.parts.length-roots.length)errors.push('unjoined piece');
 for(const slot of mesh.slots.filter(s=>s.occupied)){
  const ledge=peak.ledges[Number(slot.surfaceId.split('-').at(-1))];
  if(!ledge||slot.geometry.some((x,k)=>x!==ledge[k]))
   errors.push('false ledge '+slot.id);
 }
 return {valid:errors.length===0,errors,pieces:mesh.parts.length,
  silhouettes:mesh.parts.map(p=>p.id)};
}
globalThis.SummitPeakMesh=Object.freeze({version:'0.41',size:SIZE,BASE_LIBRARY,EXT_LIBRARY,
 SUMMIT_LIBRARY,meshFor,audit,meshContour,meshFlank,polygonArea});
})();
