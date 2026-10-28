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
function audit(a){
 const errors=[],parts=new Map(a.pieces.map(p=>[p.id,p]));
 for(const j of a.joins){
  const parent=parts.get(j.parent),child=parts.get(j.child);
  if(!parent||!child){errors.push('missing joint member '+j.child);continue}
  const ps=parent.sockets.find(s=>s.id===j.parentSocket),cs=child.sockets.find(s=>s.id===j.childSocket);
  if(!ps||!cs){errors.push('missing joint socket '+j.child);continue}
  if(!socketBoundary(parent,ps).valid)errors.push('parent socket floating inside/outside polygon: '+j.parentSocket);
  if(!socketBoundary(child,cs).valid)errors.push('child socket floating inside/outside polygon: '+j.childSocket);
 }
 return {valid:errors.length===0,errors};
}
const api=Object.freeze({onSegment,onBoundary,socketBoundary,audit});
if(typeof module==='object'&&module.exports)module.exports=api;else root.CleanGeometryAudit=api;
})(typeof globalThis!=='undefined'?globalThis:this);
