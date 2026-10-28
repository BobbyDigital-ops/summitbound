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
 const h=S[size];x=Math.round(x);y=Math.round(y);
 if(!h)throw Error('Unknown socket size '+size);
 return [0,.25,.5,.75,1].map(t=>[Math.round(x+Math.sin(Math.PI*t)*h*.12),Math.round(y+t*h)]);
}
function geometry(w,h,seed,role){
 // Each prefab occupies its own strict horizontal footprint [0,w].
 // Only the THREE canonical S/M/L seam profiles form its left/right walls.
 // These are literal polygon edges, rather than offset metadata.
 const leftSize=['S','M','L'][seed%3],rightSize=['S','M','L'][(seed+1)%3];
 const left=edge(0,0,leftSize,'left'),right=edge(w,0,rightSize,'right');
 const crest=role==='summit'?Math.round(Math.min(h*.45,120)):role==='base'?28:48;
 const top=[[0,0],[Math.round(w*.20),-Math.round(crest*(.45+(seed%3)*.18))],
  [Math.round(w*.43),-Math.round(crest*(.8+(seed%4)*.12))],
  [Math.round(w*.68),-Math.round(crest*(.35+(seed%5)*.11))],[w,0]];
 // Five intermediate lower flank vertices remain INSIDE the footprint.
 const lower=[[Math.round(w*.82),Math.round(S[rightSize]+42+(seed%4)*11)],
  [Math.round(w*.58),Math.round(Math.max(S[leftSize],S[rightSize])+88+(seed%5)*14)],
  [Math.round(w*.34),Math.round(Math.max(S[leftSize],S[rightSize])+82+(seed%3)*19)],
  [Math.round(w*.13),Math.round(S[leftSize]+36+(seed%6)*7)]];
 const vertices=[...top,...right.slice(1),...lower,[0,S[leftSize]],...left.slice(1,-1).reverse()];
 const sockets=[{id:'left',size:leftSize,side:'left',vertices:left},
  {id:'right',size:rightSize,side:'right',vertices:right}];
 return {vertices,sockets,height:Math.max(h,...vertices.map(p=>p[1]))};
}
const baseNames=['granite-bastion','split-massif','northern-buttress','sheared-ridge','weathered-tower','dark-plateau','storm-wall','scree-foundation','riven-crag','double-spine','frozen-escarpment','western-face','twin-pillar','cloven-plateau','angular-keep','snowbound-column','needle-foundation','south-cliff','layered-bulwark','deep-cut-massif','rubble-keep','hollow-scar','broken-arch','storm-rampart'];
const extensionNames=['shoulder','overhang','rock-rib','stepped-wall','broken-shelf','granite-fin','gully','hanging-scree','weathered-nose','ice-buttress','slate-wing','fractured-terrace','cliff-hook','sheer-rib','splintered-nose','scree-bridge','ice-carved-collar','granite-scar','rock-hinge','shattered-column','snow-shoulder','broken-spur','high-shelf','shadow-terrace'];
const summitNames=['horn','split-crown','knife-edge','flat-crown','broken-needle','saddle','black-tooth','wind-ridge','hanging-horn','sawtooth-crown','flat-saddle','razor-back','storm-needle','split-horn','sugarloaf','sharp-crest'];
function define(names,role){
 return names.map((name,i)=>{
  const w=role==='base'?510+((i*83)%280):role==='summit'?180+((i*37)%130):190+((i*67)%190);
  const h=role==='base'?690+((i*109)%370):role==='summit'?180+((i*47)%170):250+((i*59)%210);
  const geom=geometry(w,h,i,role);
  const vertices=geom.vertices,sockets=geom.sockets;
  const mounts=role==='summit'?[{id:'crest',size:3,x:Math.round(w*.38),y:20}]:
   [{id:'mount-1',size:1+(i%5),x:Math.round(w*.30),y:25},
    {id:'mount-2',size:1+((i+2)%5),x:Math.round(w*.52),y:43},
    {id:'mount-3',size:1+((i+4)%5),x:Math.round(w*.70),y:60}];
  return Object.freeze({id:role+'-'+name,role,name,width:w,height:geom.height,vertices,textureSeed:i*7919+(role==='base'?101:role==='summit'?303:202),material:['dark-granite','slate','frosted-granite','weathered-rock'][i%4],
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
const lib=Object.freeze({version:'1.1',S,BASES,EXTENSIONS,SUMMITS,PLATFORMS,ICE,random,edge,mate,mountPlatform});
if(typeof module==='object'&&module.exports)module.exports=lib;else root.SummitParts=lib;
})(typeof globalThis!=='undefined'?globalThis:this);
