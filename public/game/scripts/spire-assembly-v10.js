/* Vertical bottom-up spire assembler v10 — independent of all earlier maps/assets.
 * Exactly one base, 1–5 interchangeable middle modules, one cap.
 * All joins are horizontally identical full boundary edges.
 */
(function(root){
'use strict';
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
  if(route.fromY<=route.toY||route.x!==route.finishX)errors.push('nonvertical climb route');
  if(route.target!=='departure'&&!platformIds.has(route.target))errors.push('invalid route target');
 }
 for(const plat of assembled.platforms){
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
function assemble(seed,options={}){
 const r=K.rand(seed+11),total=options.pieces??3+Math.floor(r()*5);
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
  if(yy<top+35||yy>-height*.48||!edge||edge.right-edge.left<85)continue;
  candidateDeck.push({y:yy,left:edge.left,right:edge.right,width:edge.right-edge.left,piece:piece.id});
 }
 if(!candidateDeck.length)throw Error('No usable departure deck');
 const best=candidateDeck.sort((a,b)=>a.y-b.y||b.width-a.width).slice(0,Math.min(4,candidateDeck.length));
 const deck=pick(r,best);
 // The orange deck follows only the actual rock width at its height.
 const departure={id:'departure',y:deck.y,left:deck.left+2,right:deck.right-2,width:deck.width-4,piece:deck.piece};
 const possible=[];
 for(const piece of pieces)for(const m of piece.mounts){
  if(m.y<=departure.y+25||m.y>=-25)continue;
  const variants=K.PLATFORMS.filter(p=>p.size===m.size);
  for(const pref of variants){
   const centre=m.side==='left'?m.x+pref.width*.38:m.side==='right'?m.x-pref.width*.38:m.x;
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
 for(let i=0;i<platforms.length;i++){
  const p=platforms[i],lo=Math.max(p.left+3,departure.left+3),hi=Math.min(p.right-3,departure.right-3);
  if(lo>hi)throw Error('Stranded platform');
  const x=(lo+hi)/2;
  // Stop at first higher platform encountered; climb through its onward route.
  let next='departure',endY=departure.y;
  for(let j=i-1;j>=0;j--){const higher=platforms[j];
   if(x>=higher.left+2&&x<=higher.right-2){next=higher.id;endY=higher.y;break}
  }
  const kind=(r()<.52?'ice':'ladder'),asset=pick(r,kind==='ice'?K.ICE:K.LADDERS);
  routes.push({id:'climb-'+i,kind,asset:asset.id,source:p.id,target:next,
   x,finishX:x,fromY:p.y,toY:endY,width:asset.width,straight:true,
   collider:{left:x-asset.width/2,right:x+asset.width/2,top:endY,bottom:p.y,climbable:true}});
 }
 const all=pieces.flatMap(p=>p.vertices);
 const bounds={left:Math.min(...all.map(p=>p[0])),right:Math.max(...all.map(p=>p[0])),
  top:Math.min(...all.map(p=>p[1])),bottom:Math.max(...all.map(p=>p[1]))};
 const result={schema:'summitbound.spire.v10',seed,source:'new-vertical-assets-only',
  pieces,joins,platforms,colliders,routes,departure,bounds,height,physicsCertified:false};
 const audit=inspect(result);if(!audit.valid)throw Error('Invalid spire: '+audit.errors.join('; '));
 return result;
}
const API=Object.freeze({assemble,inspect,edgeAt,strictOverlap});
if(typeof module==='object'&&module.exports)module.exports=API;else root.SpireAssemblyV10=API;
})(typeof globalThis!=='undefined'?globalThis:this);
