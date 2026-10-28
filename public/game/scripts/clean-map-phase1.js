/* Summitbound cleanroom modular assembler v2.
 * Uses ONLY SummitParts prefabs: no legacy map coordinates or level records.
 * Output is local-world polygons, connector transforms, occupied colliders.
 * Physical jump certification and final terrain welding are separate stages.
 */
(function(root){
'use strict';
const L=typeof module==='object'&&module.exports
 ?(function(){const fs=require('node:fs'),vm=require('node:vm'),ctx={module:{exports:{}}};vm.runInNewContext(fs.readFileSync('public/game/scripts/clean-parts-phase1.js','utf8'),ctx);return ctx.module.exports})()
 :root.SummitParts;
if(!L)throw Error('SummitParts must be loaded first');
const types=[...L.BASES,...L.EXTENSIONS,...L.SUMMITS];
const choose=(r,list)=>list[Math.floor(r()*list.length)];
function move(points,x,y){return points.map(p=>[p[0]+x,p[1]+y])}
function area(p){let v=0;for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];v+=a[0]*b[1]-b[0]*a[1]}return Math.abs(v/2)}
function place(prefab,x,y,id,parent,join){
 return {id,prefab:prefab.id,role:prefab.role,material:prefab.material,textureSeed:prefab.textureSeed,
  transform:{x,y},vertices:move(prefab.vertices,x,y),
  sockets:prefab.sockets.map(s=>({id:id+'/'+s.id,size:s.size,side:s.side,owner:id,occupied:false,vertices:move(s.vertices,x,y)})),
  mounts:prefab.mounts.map(m=>({id:id+'/'+m.id,owner:id,size:m.size,x:x+m.x,y:y+m.y,occupied:false})),
  parent:parent||null,join:join||null};
}
function assemble(seed,opts={}){
 const r=L.random(seed),total=opts.pieces??(3+Math.floor(r()*5));
 if(total<3||total>7)throw Error('3–7 pieces per spire');
 const baseCount=opts.bases??(r()<.43?2:1);
 if(baseCount<1||baseCount>2||baseCount>=total)throw Error('1–2 bases required');
 const pieces=[],joins=[],colliders=[],platforms=[],emptySlots=[],icefalls=[];
 const first=place(choose(r,L.BASES),0,0,'base-0');pieces.push(first);
 function attach(pool,filter,role){
  const available=pieces.flatMap(p=>p.sockets).filter(s=>!s.occupied&&(!filter||filter(s)));
  if(!available.length)return false;
  const target=choose(r,available);
  const candidates=pool.flatMap(p=>p.sockets.filter(s=>s.size===target.size&&s.side!==target.side).map(socket=>({p,socket})));
  if(!candidates.length)return false;
  const selected=choose(r,candidates),childId=role+'-'+pieces.length;
  const local=selected.socket,fit=L.mate(target,local);
  if(!fit.compatible||fit.vertices.some((p,i)=>p[0]!==target.vertices[i][0]||p[1]!==target.vertices[i][1]))throw Error('Connector failed alignment');
  const child=place(selected.p,fit.dx,fit.dy,childId,target.owner,{socket:target.id,childSocket:childId+'/'+local.id,size:target.size});
  const childJoin=child.sockets.find(s=>s.id===childId+'/'+local.id);
  childJoin.occupied=true;target.occupied=true;
  pieces.push(child);
  joins.push({parent:target.owner,child:childId,parentSocket:target.id,childSocket:childJoin.id,size:target.size,vertices:target.vertices.map(p=>p.slice())});
  return true;
 }
 for(let i=1;i<baseCount;i++)if(!attach(L.BASES,null,'base'))throw Error('Cannot join second base');
 while(pieces.length<total){
  const remaining=total-pieces.length;
  const useSummit=remaining===1||r()<.20;
  let done=useSummit?attach(L.SUMMITS,null,'summit'):attach(L.EXTENSIONS,null,'extension');
  if(!done)done=attach(L.EXTENSIONS,null,'extension');
  if(!done)throw Error('No compatible connector');
 }
 // Mounts are inherited directly from attached piece templates, never old ledges.
 for(const piece of pieces)for(const slot of piece.mounts){
  const variants=L.PLATFORMS.filter(p=>p.size===slot.size);
  if(!variants.length)throw Error('No size-compatible platform');
  if(r()<.32){emptySlots.push({id:slot.id,owner:piece.id,size:slot.size});continue}
  const prefab=choose(r,variants),fit=L.mountPlatform(types.find(p=>p.id===piece.prefab),slot.id.split('/').at(-1),prefab.id);
  const location={x:slot.x,y:slot.y};
  platforms.push({id:'platform-'+platforms.length,prefab:prefab.id,mount:slot.id,size:slot.size,position:location,
   polygon:move(prefab.polygon,location.x,location.y)});
  colliders.push({id:platforms.at(-1).id,owner:piece.id,left:location.x,right:location.x+prefab.width,top:location.y,kind:'ledge'});
  slot.occupied=true;
 }
 const rock=pieces.flatMap(p=>p.vertices),bounds={left:Math.min(...rock.map(p=>p[0])),right:Math.max(...rock.map(p=>p[0])),top:Math.min(...rock.map(p=>p[1])),bottom:Math.max(...rock.map(p=>p[1]))};
 const result={schema:'summitbound.cleanroom.assembly.v2',seed,source:'new-prefabs-only',pieces,joins,platforms,colliders,emptySlots,icefalls,bounds,physicsCertified:false};
 audit(result);return result;
}
function audit(a){
 const issues=[],byId=new Map(a.pieces.map(p=>[p.id,p]));
 if(a.pieces.length<3||a.pieces.length>7)issues.push('component count');
 const bases=a.pieces.filter(p=>p.role==='base').length;
 if(bases<1||bases>2)issues.push('base count');
 if(a.joins.length!==a.pieces.length-1)issues.push('disconnected graph');
 for(const j of a.joins){
  const p=byId.get(j.parent),c=byId.get(j.child);
  const ps=p?.sockets.find(s=>s.id===j.parentSocket),cs=c?.sockets.find(s=>s.id===j.childSocket);
  if(!ps||!cs||ps.size!==cs.size||ps.side===cs.side||JSON.stringify(ps.vertices)!==JSON.stringify(cs.vertices))issues.push('misaligned joint '+j.child);
 }
 for(const p of a.pieces)if(area(p.vertices)<400)issues.push('degenerate rock '+p.id);
 for(const x of a.platforms){
  if(!a.colliders.some(c=>c.id===x.id&&c.right>c.left))issues.push('ghost platform '+x.id);
  if(!byId.has(x.mount.split('/')[0]))issues.push('invalid mount owner '+x.id);
 }
 for(const s of a.emptySlots)if(a.platforms.some(p=>p.mount===s.id))issues.push('phantom empty mount');
 if(issues.length)throw Error('Assembly invalid: '+issues.join('; '));
 return {valid:true,pieces:a.pieces.length,joins:a.joins.length,platforms:a.platforms.length};
}
function buildCourse(seed,count=3){
 const peaks=[];let x=0,y=1200;
 for(let i=0;i<count;i++){
  const p=assemble(seed+i*107+1),shift={x:x-p.bounds.left,y:y-p.bounds.top};
  peaks.push({...p,worldOrigin:shift});
  x+=p.bounds.right-p.bounds.left+240+((seed*41+i*73)%230);
  y-=90+((seed*7+i*29)%170);
 }
 return {schema:'summitbound.cleanroom.course.v1',source:'new-prefabs-only',seed,peaks,physicsCertified:false};
}
const API=Object.freeze({assemble,build:assemble,buildCourse,audit,area});
if(typeof module==='object'&&module.exports)module.exports=API;else root.CleanMap=API;
})(typeof globalThis!=='undefined'?globalThis:this);
