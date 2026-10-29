/* Vertical bottom-up spire assembler v10 — independent of all earlier maps/assets.
 * Exactly one base, 1–5 interchangeable middle modules, one cap.
 * All joins are horizontally identical full boundary edges.
 */
(function(root){
'use strict';
const MIN_LAUNCH_DECK=300;
const MIN_LANDING_SPAN=240;
const K=typeof module==='object'&&module.exports?require('./spire-kit-v10.js'):root.SpireKitV10;
if(!K)throw Error('Missing new v10 spire prefab library');
const pick=(r,a)=>a[Math.floor(r()*a.length)];
const shift=(p,dx,dy)=>p.map(v=>[v[0]+dx,v[1]+dy]);
const eq=(a,b)=>a.length===b.length&&a.every((v,i)=>Math.abs(v[0]-b[i][0])<1e-8&&Math.abs(v[1]-b[i][1])<1e-8);
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
function properCross(a,b,c,d){
 const v=cross(a,b,c),w=cross(a,b,d),x=cross(c,d,a),y=cross(c,d,b);
 return v*w<0&&x*y<0;
}
function contains(p,poly){
 let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[i],b=poly[j];
  if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])hit=!hit;
 }return hit;
}
function strictOverlap(a,b){
 // Every piece's vertical interior must be disjoint. Boundary seams may touch.
 const ay=a.map(p=>p[1]),by=b.map(p=>p[1]);
 if(Math.max(...ay)<=Math.min(...by)||Math.max(...by)<=Math.min(...ay))return false;
 for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)
  if(properCross(a[i],a[(i+1)%a.length],b[j],b[(j+1)%b.length]))return true;
 return contains(a[0],b)||contains(b[0],a);
}
function makePiece(p,y,index){
 return {id:'piece-'+index,prefab:p.id,role:p.role,material:p.material,textureSeed:p.textureSeed,
  height:p.height,offsetY:y,bottomSocket:p.bottomSocket,topSocket:p.topSocket,
  vertices:shift(p.vertices,0,y),
  mounts:p.mounts.map(m=>({...m,id:'piece-'+index+'/'+m.id,y:m.y+y})),
  internalBottom:index>0};
}
function edgeAt(piece,y){
 const xs=[],poly=piece.vertices;
 for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length];
  if(a[1]===b[1]){if(a[1]===y)xs.push(a[0],b[0]);continue}
  if(y>=Math.min(a[1],b[1])&&y<=Math.max(a[1],b[1]))xs.push(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]));
 }return xs.length?{left:Math.min(...xs),right:Math.max(...xs)}:null;
}
// The rock outline is calculated from *assembled* polygons, never from the mount
// metadata or a bounding box (which would falsely allow protruding ledges/ice).
function rockSection(pieces,y){
 const slices=pieces.map(p=>{
  const ymin=p.offsetY-p.height,ymax=p.offsetY;
  return y>=ymin-1e-6&&y<=ymax+1e-6?edgeAt(p,y):null;
 }).filter(Boolean);
 if(!slices.length)return null;
 return {left:Math.min(...slices.map(s=>s.left)),right:Math.max(...slices.map(s=>s.right))};
}
function insideRockRect(pieces,left,right,top,bottom,margin=1){
 if(!(left<right&&top<=bottom))return false;
 const ys=[top,bottom];
 // Sample every profile vertex height and the midpoints between them.
 // Profiles are piecewise-linear, so extrema of each side are at vertices.
 for(const p of pieces)for(const v of p.vertices)
  if(v[1]>top&&v[1]<bottom)ys.push(v[1]);
 ys.sort((a,b)=>a-b);
 const checks=[...ys];
 for(let i=1;i<ys.length;i++)checks.push((ys[i]+ys[i-1])/2);
 for(const y of checks){
  const sec=rockSection(pieces,y);
  if(!sec||left<sec.left+margin-1e-7||right>sec.right-margin+1e-7)return false;
 }
 return true;
}
// A rock ledge must fit INSIDE the exact prefab block owning its mount.
// The neighbouring module or combined spire silhouette cannot excuse a
// protrusion through this block's own face or either connector seam.
function rockLedgeInsideOwner(assembled,ledge,margin=.5){
 const owner=assembled?.pieces?.find(piece=>piece.id===ledge?.owner);
 if(!owner||ledge?.kind!=='rock'||!Array.isArray(ledge.vertices)||ledge.vertices.length<3)return false;
 const xs=ledge.vertices.map(v=>v[0]),ys=ledge.vertices.map(v=>v[1]);
 if(xs.some(x=>!Number.isFinite(x))||ys.some(y=>!Number.isFinite(y)))return false;
 return insideRockRect([owner],Math.min(...xs),Math.max(...xs),Math.min(...ys),Math.max(...ys),margin);
}
function inspect(assembled){
 const errors=[],p=assembled.pieces;
 if(p.length<3||p.length>7)errors.push('requires 3–7 pieces');
 if(p[0]?.role!=='base'||p[p.length-1]?.role!=='cap'||p.slice(1,-1).some(x=>x.role!=='body'))
  errors.push('requires base → body modules → summit');
 if(assembled.joins.length!==p.length-1)errors.push('disconnected structure');
 for(let i=0;i<p.length;i++){
  const part=p[i],v=part.vertices;
  const ys=v.map(x=>x[1]),xs=v.map(x=>x[0]);
  if(Math.max(...xs)-Math.min(...xs)<35||Math.max(...ys)-Math.min(...ys)<70)errors.push('degenerate shape '+part.id);
  for(let j=0;j<v.length;j++)for(let k=j+2;k<v.length;k++){
   if(j===0&&k===v.length-1)continue;
   if(properCross(v[j],v[(j+1)%v.length],v[k],v[(k+1)%v.length]))errors.push('self intersection '+part.id);
  }
  if(i){
   const lower=p[i-1],joint=assembled.joins[i-1],w=K.WIDTH[joint.size],y=part.offsetY;
   if(lower.topSocket!==part.bottomSocket||joint.size!==part.bottomSocket)errors.push('connector mismatch');
   if(!eq(joint.vertices,[[-w/2,y],[w/2,y]]))errors.push('seam mismatch');
   if(lower.offsetY-lower.height!==part.offsetY)errors.push('vertical gap');
   if(strictOverlap(lower.vertices,part.vertices))errors.push('overlap at '+joint.id);
  }
  for(let j=0;j<i-1;j++)if(strictOverlap(p[j].vertices,part.vertices))errors.push('nonadjacent overlap');
 }
 const platformIds=new Set(assembled.platforms.map(x=>x.id));
 for(const c of assembled.colliders)if(!platformIds.has(c.id)||c.right<=c.left)errors.push('orphan platform collider');
 for(const route of assembled.routes){
  const from=assembled.platforms.find(q=>q.id===route.source);
  const receiving=route.target==='departure'?assembled.departure:assembled.platforms.find(q=>q.id===route.target);
  if(!from||!receiving||route.x<from.left+2||route.x>from.right-2||
     route.finishX<receiving.left+2||route.finishX>receiving.right-2)
   errors.push('climb route does not terminate on a genuine platform: '+route.id);
  if(route.kind==='ice'&&!insideRockRect(p,route.collider.left,route.collider.right,route.toY,route.fromY,1))
   errors.push('icefall breaches mountain outline: '+route.id);
  if(route.fromY<=route.toY||route.x!==route.finishX)errors.push('nonvertical climb route');
  if(route.target!=='departure'&&!platformIds.has(route.target))errors.push('invalid route target');
 }
 if(assembled.departure?.width<MIN_LAUNCH_DECK)errors.push('short takeoff');
 for(const plat of assembled.platforms){
  if(plat.width<MIN_LANDING_SPAN)errors.push('landing too narrow '+plat.id);
  if(plat.kind==='rock'&&!rockLedgeInsideOwner(assembled,plat))
   errors.push('rock ledge breaches parent mountain block: '+plat.id);
  let target=plat.id;const seen=new Set();
  while(target!=='departure'){
   if(seen.has(target)){errors.push('cyclic route from '+plat.id);break}
   seen.add(target);
   const route=assembled.routes.find(r=>r.source===target);
   if(!route){errors.push('no route from '+target);break}
   target=route.target;
  }
 }
 return {valid:errors.length===0,errors,pieces:p.length,platforms:assembled.platforms.length};
}
function assembleOnce(seed,options={}){
 const scrambled=Math.imul((seed^0x9e3779b9)>>>0,0x85ebca6b)>>>0;
 const r=K.rand(scrambled),total=options.pieces??3+Math.floor(r()*5);
 if(total<3||total>7)throw Error('3–7 pieces required');
 const pieces=[],joins=[];
 const base=options.baseId?K.BASES.find(x=>x.id===options.baseId):pick(r,K.BASES);
 if(!base)throw Error('Unknown base');
 pieces.push(makePiece(base,0,0));
 let previous=base,y=-base.height;
 for(let i=1;i<total;i++){
  const pool=(i===total-1?K.CAPS:K.BODIES).filter(x=>x.bottomSocket===previous.topSocket);
  if(!pool.length)throw Error('No compatible vertical prefab: '+previous.topSocket);
  const next=pick(r,pool);
  const jointWidth=K.WIDTH[previous.topSocket];
  joins.push({id:'joint-'+i,lower:pieces[i-1].id,upper:'piece-'+i,
   size:previous.topSocket,vertices:[[-jointWidth/2,y],[jointWidth/2,y]],internal:true});
  pieces.push(makePiece(next,y,i));
  y-=next.height;previous=next;
 }
 const bottom=0,top=y,height=-top;
 const candidateDeck=[];
 for(const piece of pieces.slice(1,-1))for(const t of [.25,.45,.65,.80]){
  const yy=Math.round(piece.offsetY-piece.height*t),edge=edgeAt(piece,yy);
  if(yy<top+35||yy>-height*.48||!edge||edge.right-edge.left<MIN_LAUNCH_DECK+4)continue;
  candidateDeck.push({y:yy,left:edge.left,right:edge.right,width:edge.right-edge.left,piece:piece.id});
 }
 if(!candidateDeck.length)throw Error('No usable departure deck');
 const best=candidateDeck.sort((a,b)=>a.y-b.y||b.width-a.width).slice(0,Math.min(4,candidateDeck.length));
 const deck=pick(r,best);
 // The orange deck follows only the actual rock width at its height.
 const departure={id:'departure',y:deck.y,left:deck.left+2,right:deck.right-2,width:deck.width-4,piece:deck.piece};
 if(departure.width<MIN_LAUNCH_DECK)throw Error('No usable departure deck');
 const possible=[];
 for(const piece of pieces)for(const m of piece.mounts){
  if(m.y<=departure.y+25||m.y>=-25)continue;
  const variants=K.PLATFORMS.filter(p=>p.size===m.size);
  for(const pref of variants){
   let centre=m.side==='left'?m.x+pref.width*.38:m.side==='right'?m.x-pref.width*.38:m.x;
   if(pref.kind==='rock'){
    // Account for the entire actual rock-ledge polygon, including its lip
    // and thickness, not just its walkable collider.
    const lipLeft=Math.min(...pref.vertices.map(v=>v[0]));
    const lipRight=Math.max(...pref.vertices.map(v=>v[0]));
    const depth=Math.max(...pref.vertices.map(v=>v[1]));
    const levels=[m.y,m.y+depth],allowed=[];
    // The original mount's own parent block is the ONLY allowable rock
    // footprint, including the slab thickness and its projecting lip.
    for(const v of piece.vertices)
     if(v[1]>m.y&&v[1]<m.y+depth)levels.push(v[1]);
    for(const yy of levels){
     const sec=edgeAt(piece,yy);
     if(!sec){allowed.length=0;break}
     allowed.push(sec);
    }
    if(!allowed.length)continue;
    const minCentre=Math.max(...allowed.map(a=>a.left))+2-lipLeft;
    const maxCentre=Math.min(...allowed.map(a=>a.right))-2-lipRight;
    if(maxCentre<minCentre)continue;
    centre=Math.max(minCentre,Math.min(maxCentre,centre));
   }
   const left=centre-pref.width/2,right=centre+pref.width/2;
   const overlap=Math.min(right,departure.right-3)-Math.max(left,departure.left+3);
   if(overlap<7)continue;
   possible.push({m,pref,centre,left,right,y:m.y});
  }
 }
 const picked=[],desired=2+Math.floor(r()*3);
 const candidates=possible.sort((a,b)=>a.y-b.y);
 for(let trial=0;trial<desired*20&&picked.length<desired;trial++){
  const option=pick(r,candidates);
  if(!option||picked.some(p=>p.m.id===option.m.id||Math.abs(p.y-option.y)<35))continue;
  picked.push(option);
 }
 if(picked.length<2)throw Error('Insufficient reachable platform mounts');
 picked.sort((a,b)=>a.y-b.y);
 const platforms=[],colliders=[],routes=[];
 picked.forEach((p,i)=>{
  const id='landing-'+i;
  platforms.push({id,owner:p.m.id.split('/')[0],mount:p.m.id,prefab:p.pref.id,
   kind:p.pref.kind,material:p.pref.material,textureSeed:p.pref.textureSeed,
   x:p.centre,y:p.y,left:p.left,right:p.right,width:p.pref.width,
   vertices:shift(p.pref.vertices,p.centre,p.y),
   braces:p.pref.braces.map(b=>[b[0]+p.centre,b[1]+p.y,b[2]+p.centre,b[3]+p.y])});
  colliders.push({id,left:p.left,right:p.right,top:p.y,kind:p.pref.kind});
 });
 // Draw a vertical corridor from each ledge towards the summit. Any higher
 // platform hit first becomes the stopping point; that platform owns the
 // continuation. Whole ladder/ice width, not merely its centre, must fit.
 const MAX_CLIMB_HALF=Math.max(...K.ICE.map(a=>a.width),...K.LADDERS.map(a=>a.width))/2;
 const ROUTE_MARGIN=MAX_CLIMB_HALF+5;
 for(let i=0;i<platforms.length;i++){
  const p=platforms[i];
  const low=Math.max(p.left,departure.left)+ROUTE_MARGIN;
  const high=Math.min(p.right,departure.right)-ROUTE_MARGIN;
  if(low>high)throw Error('No full-width shared climb column');
  const want=Math.max(low,Math.min(high,
   (p.left+p.right)/2+(r()-.5)*Math.min(80,high-low)));
  const candidates=[want,Math.max(low,Math.min(high,0)),(low+high)/2];
  for(let k=0;k<=16;k++)candidates.push(low+(high-low)*k/16);
  candidates.sort((x,y)=>Math.abs(x-want)-Math.abs(y-want));
  let selected=null;
  for(const x of candidates){
   let next='departure',endY=departure.y,blocked=false;
   for(let j=i-1;j>=0;j--){
    const higher=platforms[j];
    // A vertical route cannot silently pass THROUGH a real green shelf.
    if(x>=higher.left-1&&x<=higher.right+1){
     if(x<higher.left+ROUTE_MARGIN||x>higher.right-ROUTE_MARGIN){blocked=true;break}
     next=higher.id;endY=higher.y;break;
    }
   }
   if(blocked||x<low||x>high)continue;
   selected={x,next,endY};break;
  }
  if(!selected)throw Error('No unobstructed full-width climb corridor');
  const {x:climbX,next,endY}=selected;
  const iceAsset=pick(r,K.ICE);
  const useIce=r()<.60&&insideRockRect(
   pieces,climbX-iceAsset.width/2,climbX+iceAsset.width/2,endY,p.y,1);
  const kind=useIce?'ice':'ladder',asset=useIce?iceAsset:pick(r,K.LADDERS);
  routes.push({id:'climb-'+i,kind,asset:asset.id,source:p.id,target:next,
   x:climbX,finishX:climbX,fromY:p.y,toY:endY,width:asset.width,straight:true,
   collider:{left:climbX-asset.width/2,right:climbX+asset.width/2,
    top:endY,bottom:p.y,climbable:true}});
 }
 const all=pieces.flatMap(p=>p.vertices);
 const bounds={left:Math.min(...all.map(p=>p[0])),right:Math.max(...all.map(p=>p[0])),
  top:Math.min(...all.map(p=>p[1])),bottom:Math.max(...all.map(p=>p[1]))};
 const result={schema:'summitbound.spire.v10',seed,source:'new-vertical-assets-only',
  pieces,joins,platforms,colliders,routes,departure,bounds,height,physicsCertified:false};
 const audit=inspect(result);if(!audit.valid)throw Error('Invalid spire: '+audit.errors.join('; '));
 return result;
}
function assemble(seed,options={}){
 for(let attempt=0;attempt<20;attempt++){
  try{
   const assembled=assembleOnce(seed+attempt*2654435761,options);
   assembled.seed=seed;assembled.generationAttempts=attempt+1;
   return assembled;
  }catch(error){
   if(!/Insufficient reachable platform mounts|No usable departure deck|Invalid spire: rock ledge breaches parent mountain block/.test(String(error))||attempt===19)throw error;
  }
 }
 throw Error('No valid vertical spire could be produced');
}
const API=Object.freeze({assemble,inspect,edgeAt,strictOverlap,rockLedgeInsideOwner});
if(typeof module==='object'&&module.exports)module.exports=API;else root.SpireAssemblyV10=API;
})(typeof globalThis!=='undefined'?globalThis:this);
