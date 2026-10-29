/* Summitbound vertical spire kit v10 — authored anew from the v9 design brief.
 * No imports, references, imagery or geometry from earlier Summitbound assets.
 * World coordinates: x right, y down. Each join is a literal horizontal edge.
 */
(function(root){
'use strict';
// Exactly 2x physical rock geometry and jigsaw connectors. The independent
// prefab platform spans also have a 2x floor and a usable 180-unit minimum.
const HORIZONTAL_SCALE=2;
const SOURCE_WIDTH=Object.freeze({S:104,M:160,L:224});
const WIDTH=Object.freeze({S:208,M:320,L:448});
const MATERIALS=Object.freeze(['charcoal-granite','blue-schist','frosted-slate','weathered-basalt','pale-quartzite','dark-gneiss']);
const pick=(seed,n)=>{let x=(Math.imul((seed+1)|0,1664525)+1013904223)>>>0;return x%n};
const round=x=>Math.round(x);
function rand(seed){let s=seed>>>0||1;return ()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296)}
function makeRock(role,index){
 const r=rand((index+13)*7193+(role==='base'?43:role==='body'?71:97));
 const bottom=role==='base'?null:['S','M','L'][index%3];
 const top=role==='cap'?null:['S','M','L'][(index+Math.floor(index/3)+1)%3];
 const bw=role==='base'?260+(index%3)*66:SOURCE_WIDTH[bottom];
 const tw=role==='cap'?0:SOURCE_WIDTH[top];
 const h=role==='base'?250+(index%5)*27:role==='body'?145+(index%7)*18:180+(index%6)*31;
 // Left and right sides are strictly monotone in Y, so adjacent pieces
 // cannot overlap except at the exact shared top/bottom edge.
 const sidePoint=(side,t)=>{
  const basic=(bw*(1-t)+tw*t)/2;
  const bulge=(role==='cap'?32:role==='base'?80:68)*(r()*.9+.2);
  const x=side*(basic+bulge*Math.sin(Math.PI*t));
  return [round(x),round(-h*t)];
 };
 const right=[],left=[];
 for(const t of [.2,.4,.6,.8])right.push(sidePoint(1,t));
 for(const t of [.8,.6,.4,.2])left.push(sidePoint(-1,t));
 const verts=role==='cap'
  ?[[-bw/2,0],[bw/2,0],...right,[round((r()-.5)*18),-h],...left]
  :[[-bw/2,0],[bw/2,0],...right,[tw/2,-h],[-tw/2,-h],...left];
 const mounts=[];
 const mountCount=role==='cap'?1:3;
 for(let j=0;j<mountCount;j++){
  const t=role==='cap'?.42:(.22+j*.26);
  const side=(index+j)%3===0?'left':(index+j)%3===1?'right':'centre';
  const at=section(verts,-h*t);
  const x=side==='left'?at.left:side==='right'?at.right:round((at.left+at.right)/2);
  mounts.push({id:'platform-'+j,x,y:round(-h*t),size:1+((index+j*2)%5),side,
   accepted:['rock','scaffold'],anchor:'exposed-face'});
 }
 return Object.freeze({id:role+'-'+String(index+1).padStart(2,'0'),role,index,
  height:h,bottomSocket:bottom,topSocket:top,
  vertices:verts.map(([x,y])=>[x*HORIZONTAL_SCALE,y]),
  mounts:mounts.map(m=>({...m,x:m.x*HORIZONTAL_SCALE})),
  material:MATERIALS[(index+(role==='cap'?2:role==='body'?1:0))%MATERIALS.length],
  textureSeed:(index+1)*1039+(role==='base'?11:role==='body'?29:53)});
}
function section(poly,y){
 const xs=[];
 for(let j=0;j<poly.length;j++){const a=poly[j],b=poly[(j+1)%poly.length];
  if(a[1]===b[1]){if(Math.abs(y-a[1])<1e-7)xs.push(a[0],b[0]);continue}
  if(y>=Math.min(a[1],b[1])&&y<=Math.max(a[1],b[1]))
   xs.push(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]));
 }
 return {left:Math.min(...xs),right:Math.max(...xs)};
}
const BASES=Object.freeze(Array.from({length:24},(_,i)=>makeRock('base',i)));
const BODIES=Object.freeze(Array.from({length:24},(_,i)=>makeRock('body',i)));
const CAPS=Object.freeze(Array.from({length:16},(_,i)=>makeRock('cap',i)));
// Former spans were [36,52,74,108,154]. Every new surface is >=2x
// its predecessor and the smallest platform is wide enough to stand/run.
const SIZES=Object.freeze([180,180,180,216,308]);
const FINISHES=Object.freeze(['ice-rim','wind-packed','fractured','snowy','bare-stone']);
const PLATFORMS=Object.freeze(Array.from({length:50},(_,i)=>{
 const size=1+Math.floor(i/10),variant=i%10,kind=variant<5?'rock':'scaffold',width=SIZES[size-1];
 const depth=kind==='scaffold'?8:12+variant%4*2;
 const poly=kind==='rock'?[[-width/2,0],[width/2,0],[width/2+4,depth],[-width/2-5,depth]]
  :[[-width/2,0],[width/2,0],[width/2,8],[-width/2,8]];
 return Object.freeze({id:'platform-'+size+'-'+(variant+1),kind,size,variant,width,
  vertices:poly,material:kind==='rock'?MATERIALS[i%MATERIALS.length]:'weathered-steel',
  textureSeed:4000+i*79,collision:{left:-width/2,right:width/2,top:0},
  braces:kind==='scaffold'?[[-width*.40,8,-width*.27,35],[width*.40,8,width*.27,35],[-width*.27,35,width*.27,35]]:[]});
}));
const ICE=Object.freeze(Array.from({length:8},(_,i)=>Object.freeze({id:'ice-vertical-'+(i+1),kind:'ice',width:13+i*3,straight:true,material:'blue-white-ice'})));
const LADDERS=Object.freeze(Array.from({length:6},(_,i)=>Object.freeze({id:'ladder-'+(i+1),kind:'ladder',width:16+i*2,straight:true,rungSpacing:12+i,material:i%2?'aged-steel':'weathered-wood'})));
function joinLowerToUpper(lower,upper){
 if(!lower.topSocket||lower.topSocket!==upper.bottomSocket)throw Error('Incompatible vertical sockets');
 const width=WIDTH[lower.topSocket];
 return {size:lower.topSocket,lowerEdge:[[-width/2,-lower.height],[width/2,-lower.height]],
  upperEdge:[[-width/2,-lower.height],[width/2,-lower.height]],dy:-lower.height};
}
const API=Object.freeze({version:'10.0',HORIZONTAL_SCALE,WIDTH,MATERIALS,BASES,BODIES,CAPS,PLATFORMS,ICE,LADDERS,rand,section,joinLowerToUpper});
if(typeof module==='object'&&module.exports)module.exports=API;else root.SpireKitV10=API;
})(typeof globalThis!=='undefined'?globalThis:this);
