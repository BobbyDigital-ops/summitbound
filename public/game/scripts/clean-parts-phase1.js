/* Summitbound Phase 1: standalone immutable modular asset catalogue.
 * Local XY coordinates; Y grows down. Pieces share canonical S/M/L sockets.
 * No dependency on any previous map, world-data, or physics implementation.
 */
(function(root){
'use strict';
const S=Object.freeze({S:72,M:144,L:240});
const widths=[48,96,168,290,480];
const finishes=['frost','windpack','granite','rime','broken-snow'];
const edges=['fractured','sloped','scalloped','sheared','stepped','weathered','chiselled','jagged','overhang','scree'];
function edge(x,y,size,side){
 const h=S[size];
 if(!h)throw Error('Unknown socket size '+size);
 return [0,.25,.5,.75,1].map(t=>[Math.round(x+Math.sin(Math.PI*t)*h*.12),Math.round(y+t*h)]);
}
function polygon(w,h,shape,seed){
 const a=seed%7,b=(seed*3)%9;
 if(shape==='base')return [[0,0],[w*.28,-b*4],[w*.61,15-a*3],[w,0],[w+45+a*5,h*.33],[w+95-b*7,h*.74],[w+50,h],[w*.57+18,h+25],[w*.26-60,h],[0-75-a*6,h*.61],[-25-b*5,h*.28]].map(p=>p.map(Math.round));
 if(shape==='summit')return [[0,h],[w*.09,h*.55],[w*.23,h*.42],[w*.33,0],[w*.41,h*.25],[w*.53,h*.13],[w*.63,h*.57],[w*.79,h*.34],[w,h]].map(p=>p.map(Math.round));
 return [[0,h*.1],[w*.23,0],[w*.47,h*.1],[w*.72,h*.02],[w,h*.19],[w*.88,h*.51],[w*.98,h*.79],[w*.58,h],[w*.24,h*.84],[0,h*.69]].map(p=>p.map(Math.round));
}
function socketsFor(w,h,seed,role){
 if(role==='summit')return [{id:'bottom',size:'M',side:'left',vertices:edge(w*.15,h*.62,'M','left')}];
 return [{id:'left',size:['S','M','L'][seed%3],side:'left',vertices:edge(0,h*.25,['S','M','L'][seed%3],'left')},
  {id:'right',size:['S','M','L'][(seed+1)%3],side:'right',vertices:edge(w,h*.28,['S','M','L'][(seed+1)%3],'right')},
  {id:'upper',size:'M',side:'right',vertices:edge(w*.58,h*.08,'M','right')}];
}
const baseNames=['granite-bastion','split-massif','northern-buttress','sheared-ridge','weathered-tower','dark-plateau','storm-wall','scree-foundation','riven-crag','double-spine','frozen-escarpment','western-face'];
const extensionNames=['shoulder','overhang','rock-rib','stepped-wall','broken-shelf','granite-fin','gully','hanging-scree','weathered-nose','ice-buttress','slate-wing','fractured-terrace'];
const summitNames=['horn','split-crown','knife-edge','flat-crown','broken-needle','saddle','black-tooth','wind-ridge'];
function define(names,role){
 return names.map((name,i)=>{
  const w=role==='base'?510+((i*83)%280):role==='summit'?180+((i*37)%130):190+((i*67)%190);
  const h=role==='base'?690+((i*109)%370):role==='summit'?180+((i*47)%170):250+((i*59)%210);
  const sockets=socketsFor(w,h,i,role);
  const mounts=role==='summit'?[{id:'crest',size:3,x:Math.round(w*.38),y:Math.round(h*.15)}]:
   [{id:'mount-1',size:1+(i%5),x:Math.round(w*.16),y:Math.round(h*.28)},
    {id:'mount-2',size:1+((i+2)%5),x:Math.round(w*.48),y:Math.round(h*.52)},
    {id:'mount-3',size:1+((i+4)%5),x:Math.round(w*.27),y:Math.round(h*.76)}];
  return Object.freeze({id:role+'-'+name,role,name,width:w,height:h,vertices:polygon(w,h,role,i),
   sockets,mounts,iceMounts:role==='base'?[{id:'ice-face',x:Math.round(w*.17),y:Math.round(h*.45),height:200+(i%3)*80}]:[]});
 });
}
const BASES=Object.freeze(define(baseNames,'base'));
const EXTENSIONS=Object.freeze(define(extensionNames,'extension'));
const SUMMITS=Object.freeze(define(summitNames,'summit'));
const PLATFORMS=Object.freeze(Array.from({length:50},(_,i)=>{
 const size=Math.floor(i/10)+1,variant=i%10,w=widths[size-1],step=variant%3;
 const surface=[[0,0],[w*.24,-step*2],[w*.58,variant%2?2:-3],[w,0]];
 const lower=[[w+5,12],[w*.86,23+step*5],[w*.56,30+step*5],[w*.18,23],[0,10]];
 return Object.freeze({id:'landing-'+size+'-'+(variant+1),size,variant,width:w,
  finish:finishes[variant%5],edge:edges[variant],surface:surface.map(p=>p.map(Math.round)),
  polygon:surface.concat(lower).map(p=>p.map(Math.round)),
  collision:{left:0,right:w,top:0},mount:{size,anchor:[0,0]}});
}));
const ICE=Object.freeze(['blue-fall','frozen-chute','ice-curtain','cracked-cascade','hanging-ice','rime-gully'].map((id,i)=>Object.freeze({id,width:48+i*8,length:150+i*55,entry:'ice-face',exit:'mount'})));
function random(seed){let n=seed>>>0||1;return ()=>((n=(Math.imul(1664525,n)+1013904223)>>>0)/4294967296);}
function mate(a,b){
 if(a.size!==b.size)throw Error('Connector size mismatch: '+a.size+'/'+b.size);
 // Translate child socket into same world coordinates, reverse the face
 // normal; all five profile vertices must coincide exactly.
 const dx=a.vertices[0][0]-b.vertices[0][0],dy=a.vertices[0][1]-b.vertices[0][1];
 return {dx,dy,vertices:b.vertices.map(p=>[p[0]+dx,p[1]+dy]),compatible:a.side!==b.side};
}
function mountPlatform(piece,mountId,platformId){
 const mount=piece.mounts.find(x=>x.id===mountId),platform=PLATFORMS.find(x=>x.id===platformId);
 if(!mount||!platform)throw Error('Unknown platform/mount');
 if(mount.size!==platform.size)throw Error('Platform mount size mismatch');
 return {piece:piece.id,mount:mount.id,platform:platform.id,
  collision:{left:mount.x,right:mount.x+platform.width,top:mount.y},
  position:[mount.x,mount.y]};
}
const lib=Object.freeze({version:'1.0',S,BASES,EXTENSIONS,SUMMITS,PLATFORMS,ICE,random,edge,mate,mountPlatform});
if(typeof module==='object'&&module.exports)module.exports=lib;else root.SummitParts=lib;
})(typeof globalThis!=='undefined'?globalThis:this);
