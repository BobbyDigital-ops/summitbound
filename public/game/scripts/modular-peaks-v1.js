/* Summitbound Peak Forge integration — modular rock skin over real Five Peaks physics.
   The original course, ledge colliders, vault forces, ice routes and checkpoints
   remain authoritative. Each art module is anchored to a real physical surface.
   This is deliberately a reversible PLAYABLE art/assembly experiment, not yet
   a new procedural collision-course generator. */
(()=>{
'use strict';
const SIZES=Object.freeze({S:72,M:132,L:190});
const BASES=[
 {id:'base-bastion',shade:0,crest:'fractured'},
 {id:'base-northwall',shade:1,crest:'saddle'},
 {id:'base-granite',shade:2,crest:'broken'},
 {id:'base-ridge',shade:3,crest:'swept'},
 {id:'base-buttress',shade:4,crest:'stepped'},
 {id:'base-crown',shade:5,crest:'notched'}
];
const TOPPERS=['splintered','serrated','wedge','double','scree','needle'];
const FLANKS=['buttress','fracture','shelf','outcrop','step','fissure','cornice','rib'];
const PALETTE=[
 ['#7d949f','#3c586c','#1b3243'],['#81929c','#445c69','#203240'],
 ['#8b9da4','#4a5d6b','#243949'],['#879ba7','#425969','#203849'],
 ['#7a91a1','#365367','#1a3548'],['#94a3a9','#4d6470','#233b4a']
];
const originalPainter=drawSpire;
function number(n){return Number.isFinite(n);}
function widthTag(w){return w<=115?'S':w<=215?'M':'L';}
function manifest(index){
 const s=spires[index];
 if(!s||!Array.isArray(s.summit))throw Error('Peak Forge: missing physical peak '+index);
 const main=s.summit,upper=s.ridgeArrival||main;
 const base=BASES[(index*5+Math.round(main[0]/99))%BASES.length];
 const ledges=(s.ledges||[]).map((l,j)=>({
  id:'ledge-'+index+'-'+j,role:'landing-extension',variant:FLANKS[(index*3+j*5)%FLANKS.length],
  socket:widthTag(l[1]-l[0]),x:l[0],right:l[1],y:l[2],
  collisionId:'l'+index+'-'+j,required:true
 }));
 const pieces=[
  {id:base.id,role:'base',socket:'L',bounds:main},
  {id:'summit-'+TOPPERS[(index*7+Math.round(main[2]/50))%TOPPERS.length],role:'summit',socket:'M',bounds:upper},
  ...ledges
 ];
 if(s.ridgeArrival)pieces.push({id:'ridge-'+index,role:'base-extension',socket:'L',bounds:s.ridgeArrival});
 if(pieces.length<3)pieces.push({id:'flank-'+index,role:'flank',socket:'S',bounds:main});
 const sockets=pieces.map((p,k)=>({piece:p.id,connector:p.socket,length:SIZES[p.socket],attached:k===0?'foundation':base.id}));
 const ice=index===0?[]:iceRouteNetwork(index).map((r,k)=>({
  id:'ice-'+index+'-'+k,from:'l'+index+'-'+r.tier,
  to:s.ridgeArrival?'a'+index:'s'+index,
  points:r.points.map(p=>({x:p.x,y:p.y}))
 }));
 return {index,base:base.id,pieces,sockets,ice,upper,
  slots:ledges.map(p=>({size:p.socket,occupied:true,collisionId:p.collisionId})),
  optionalSlots:[{size:'S',occupied:false},{size:'M',occupied:false},{size:'L',occupied:false}]};
}
function audit(index){
 const m=manifest(index);
 const problems=[];
 for(const p of m.pieces){
  if(!SIZES[p.socket])problems.push('invalid connection '+p.id);
  if(p.role==='landing-extension'&&!platforms.some(q=>q.id===p.collisionId))
   problems.push('orphan landing '+p.collisionId);
 }
 for(const ice of m.ice){
  const from=platforms.find(p=>p.id===ice.from),to=platforms.find(p=>p.id===ice.to);
  if(!from||!to||ice.points.length<2)problems.push('disconnected ice '+ice.id);
  else if(Math.abs(ice.points[0].y-(from.top-22))>85 ||
     Math.abs(ice.points.at(-1).y-(to.top-22))>85)
   problems.push('misaligned ice '+ice.id);
 }
 return {valid:!problems.length,problems,modules:m.pieces.length,ice:m.ice.length};
}
function polygon(g,pts,color){if(!pts.length)return;g.beginPath();g.moveTo(pts[0][0],pts[0][1]);for(let j=1;j<pts.length;j++)g.lineTo(pts[j][0],pts[j][1]);g.closePath();g.fillStyle=color;g.fill();}
function stroke(g,pts,color,w=1){if(pts.length<2)return;g.beginPath();g.moveTo(pts[0][0],pts[0][1]);for(let j=1;j<pts.length;j++)g.lineTo(pts[j][0],pts[j][1]);g.strokeStyle=color;g.lineWidth=w;g.stroke();}
function random(seed){let x=seed>>>0;return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function relief(g,left,right,top,index,kind){
 // Each module uses its own deterministic facet arrangement, but the rock
 // stays on the actual collision massif rather than adding phantom ledges.
 const rng=random((index+1)*43817+(Math.floor(left)*71>>>0)+kind*461);
 const w=Math.max(40,right-left),depth=kind===1?170:280;
 const grad=g.createLinearGradient(left,top,right,top+depth);
 const c=PALETTE[(index+kind*2)%PALETTE.length];
 grad.addColorStop(0,c[0]);grad.addColorStop(.58,c[1]);grad.addColorStop(1,c[2]);
 polygon(g,[[left,top+9],[right,top+8],[right+38,top+depth],[left-43,top+depth+47]],grad);
 for(let j=0;j<23;j++){
  const x=left+w*rng(),y=top+16+depth*rng(),dx=(rng()-.5)*85,dy=30+130*rng();
  polygon(g,[[x,y],[x+dx*.6,y+dy*.13],[x+dx,y+dy],[x-14,y+dy*.75]],
   j%3===0?'#d6e4eb14':j%3===1?'#081b2f34':'#b5c9d016');
 }
 for(let j=0;j<16;j++){
  const x=left+w*rng(),y=top+25+depth*rng();
  stroke(g,[[x,y],[x+(rng()-.5)*18,y+35+80*rng()]],j%3?'#142b3c88':'#d7e6e56a',.8+rng()*1.5);
 }
}
function mountainShape(g,index){
 const m=spires[index],a=m.ridgeArrival,main=m.summit;
 // All solid modules are painted within the same world-space rock silhouette
 // used by the legacy collision contour. Surface lips are drawn precisely.
 g.beginPath();
 const l=Math.min(main[0],a?.[0]??main[0]),top=Math.min(main[2],a?.[2]??main[2]);
 g.moveTo(mountainContourX(index,top+2),top+2);
 if(a){
  g.lineTo(a[0],a[2]);g.lineTo(a[1],a[2]);
  g.lineTo(main[0],main[2]);
 }
 g.lineTo(main[0],main[2]);g.lineTo(main[1],main[2]);
 for(let y=main[2]+25;y<=2130;y+=20)g.lineTo(mountainFlankX(index,y),y);
 g.lineTo(mountainFlankX(index,2130),2130);
 g.lineTo(mountainContourX(index,2130),2130);
 for(let y=2110;y>top;y-=16)g.lineTo(mountainContourX(index,y),y);
 g.closePath();
}
function render(index,g){
 if(window.getSummitboundArtPack?.()!=='modular'){originalPainter(index,g);return;}
 const m=manifest(index),s=spires[index],r=random(index*17317+831),cliff=s.summit;
 g.save();
 // Original painter supplies the proven cliff/ledge silhouette beneath.
 // Skin does not alter solids or erase any collision-bearing surface.
 originalPainter(index,g);
 g.save();mountainShape(g,index);g.clip();
 relief(g,cliff[0],cliff[1],cliff[2],index,0);
 if(s.ridgeArrival)relief(g,s.ridgeArrival[0],s.ridgeArrival[1],s.ridgeArrival[2],index,1);
 for(const p of m.pieces.filter(p=>p.role==='landing-extension')){
  relief(g,p.x-34,p.right+25,p.y,index,2);
 }
 // Interlocking granite strata: all pieces share one material, suppressing
 // distracting hard borders and giving a continuous mountain mass.
 for(let j=0;j<110;j++){
  const x=cliff[0]-320+r()*(cliff[1]-cliff[0]+620);
  const y=cliff[2]-80+r()*1030;
  stroke(g,[[x,y],[x+(r()-.5)*50,y+25+r()*110]],
   j%4?'#c1d1d128':'#0a203c5c',1+r()*2);
 }
 g.restore();
 // Real gameplay ledges always take visual priority over decorative rock.
 // Every populated slot corresponds to an actual collision platform.
 for(const p of m.pieces.filter(p=>p.role==='landing-extension')){
  const w=p.right-p.x,base=p.y;
  const pts=typeof terraceButtressProfile==='function'
   ?terraceButtressProfile(index,p.x,p.right,base)
   :[[p.x,base+4],[p.right,base+4],[p.right+18,base+78],[p.x+25,base+80]];
  polygon(g,pts,'#344d5cee');
  stroke(g,[[p.x-2,base-1],[p.x+w*.35,base-3],[p.right+2,base-1]],'#dfe9e6',4.8);
  stroke(g,[[p.x+8,base+20],[p.x+w*.48,base+65],[p.right+8,base+75]],'#9eafbd5e',1.5);
 }
 // Collision-accurate run-up and ice-exit edges; sharp scenic caps never
 // replace the broad, real takeoff surface.
 const tops=s.ridgeArrival?[s.ridgeArrival,cliff]:[cliff];
 for(const t of tops){
  stroke(g,[[t[0],t[2]-1],[t[0]+(t[1]-t[0])*.48,t[2]-2],[t[1],t[2]-1]],'#e6efea',4);
  for(let j=0;j<6;j++){
   const x=t[0]+(t[1]-t[0])*(j+.2)/6;
   stroke(g,[[x,t[2]+8],[x+11+(j%3)*7,t[2]+55+(j%2)*36]],'#aec3cf46',1.2);
  }
 }
 g.restore();
}
drawSpire=function summitModularSpire(i,g=ctx){render(i,g);};
window.SummitPeakForge=Object.freeze({version:'0.39-playtest',connectors:SIZES,
 catalog:{bases:BASES.length,toppers:TOPPERS.length,flanks:FLANKS.length},
 manifest,audit,
 allAudits:()=>spires.map((_,i)=>audit(i))});
})();
