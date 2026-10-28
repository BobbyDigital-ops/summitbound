/* Fail-closed boundary integrity checks for independent modular terrain. */
(function(root){
'use strict';
const EPS=1e-5;
function onSegment(p,a,b){
 const cross=(p[0]-a[0])*(b[1]-a[1])-(p[1]-a[1])*(b[0]-a[0]);
 const scale=Math.max(1,Math.hypot(b[0]-a[0],b[1]-a[1]));
 if(Math.abs(cross)>EPS*scale)return false;
 return p[0]>=Math.min(a[0],b[0])-EPS&&p[0]<=Math.max(a[0],b[0])+EPS&&p[1]>=Math.min(a[1],b[1])-EPS&&p[1]<=Math.max(a[1],b[1])+EPS;
}
function onBoundary(p,poly){return poly.some((v,i)=>onSegment(p,v,poly[(i+1)%poly.length]));}
function socketBoundary(piece,socket){
 const failures=socket.vertices.filter(v=>!onBoundary(v,piece.vertices));
 return {valid:failures.length===0,offBoundary:failures};
}
function pointInside(p,poly){
 if(onBoundary(p,poly))return false;
 let inside=false;
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[i],b=poly[j];
  if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }
 return inside;
}
function crossing(a,b,c,d){
 const orient=(p,q,r)=>(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]);
 const x=orient(a,b,c),y=orient(a,b,d),z=orient(c,d,a),w=orient(c,d,b);
 return x*y< -EPS&&z*w< -EPS;
}
function polygonOverlap(a,b){
 // Proper edge crossings and strict interior points. Boundary contact is permitted.
 for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)
  if(crossing(a[i],a[(i+1)%a.length],b[j],b[(j+1)%b.length]))return true;
 for(const p of a)if(pointInside(p,b))return true;
 for(const p of b)if(pointInside(p,a))return true;
 return false;
}
function selfCrosses(poly){
 for(let i=0;i<poly.length;i++)for(let j=i+2;j<poly.length;j++){
  if(i===0&&j===poly.length-1)continue;
  if(crossing(poly[i],poly[(i+1)%poly.length],poly[j],poly[(j+1)%poly.length]))return true;
 }
 return false;
}
function audit(a){
 const errors=[],parts=new Map(a.pieces.map(p=>[p.id,p]));
 for(const p of a.pieces){
  if(selfCrosses(p.vertices))errors.push('self-crossing polygon: '+p.id);
 }
 for(const j of a.joins){
  const parent=parts.get(j.parent),child=parts.get(j.child);
  if(!parent||!child){errors.push('missing joint member '+j.child);continue}
  const ps=parent.sockets.find(s=>s.id===j.parentSocket),cs=child.sockets.find(s=>s.id===j.childSocket);
  if(!ps||!cs){errors.push('missing joint socket '+j.child);continue}
  if(!socketBoundary(parent,ps).valid)errors.push('parent socket floating: '+j.parentSocket);
  if(!socketBoundary(child,cs).valid)errors.push('child socket floating: '+j.childSocket);
  if(ps.vertices.some((p,i)=>Math.hypot(p[0]-cs.vertices[i][0],p[1]-cs.vertices[i][1])>EPS))errors.push('seam gap: '+j.child);
 }
 for(let i=0;i<a.pieces.length;i++)for(let j=i+1;j<a.pieces.length;j++)
  if(polygonOverlap(a.pieces[i].vertices,a.pieces[j].vertices))errors.push('rock overlap: '+a.pieces[i].id+' vs '+a.pieces[j].id);
 return {valid:errors.length===0,errors};
}
const api=Object.freeze({onSegment,onBoundary,pointInside,polygonOverlap,selfCrosses,socketBoundary,audit});
if(typeof module==='object'&&module.exports)module.exports=api;else root.CleanGeometryAudit=api;
})(typeof globalThis!=='undefined'?globalThis:this);
