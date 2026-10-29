/* Fresh v10 procedural texture + prop renderer, not built from old art packs.
 * All rock, scaffold, ice and ladder artwork is derived from current kit data.
 */
(function(root){
'use strict';
const COLORS={
 'charcoal-granite':['#a5b4bc','#536675','#1b2c3a'],
 'blue-schist':['#9dafb4','#516d80','#1b3346'],
 'frosted-slate':['#c3ced0','#647e8c','#213644'],
 'weathered-basalt':['#96a8a7','#51636c','#20303c'],
 'pale-quartzite':['#d4d9d5','#81939c','#334655'],
 'dark-gneiss':['#a1aab2','#4c6170','#162c3b'],
 'weathered-steel':['#adb8ba','#62737b','#26313b']
};
function random(seed){let s=seed>>>0||1;return ()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296)}
function bounds(poly){return {left:Math.min(...poly.map(p=>p[0])),right:Math.max(...poly.map(p=>p[0])),
 top:Math.min(...poly.map(p=>p[1])),bottom:Math.max(...poly.map(p=>p[1]))}}
function trace(ctx,poly){ctx.beginPath();poly.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath()}
function drawRock(ctx,piece,opt={}){
 const r=random(piece.textureSeed),poly=piece.vertices,b=bounds(poly),w=b.right-b.left,h=b.bottom-b.top;
 const tones=COLORS[opt.material||piece.material]||COLORS['charcoal-granite'];
 ctx.save();trace(ctx,poly);ctx.clip();
 // One WORLD-LOCAL light field over every physical rock module: connector
 // seams do not create striped gradients or mismatched geological layers.
 const base=ctx.createLinearGradient(-850,-1850,1050,1350);
 base.addColorStop(0,tones[0]);base.addColorStop(.34,tones[1]);base.addColorStop(1,tones[2]);
 ctx.fillStyle=base;ctx.fillRect(b.left-1,b.top-1,w+2,h+2);
 // Faceted split granite: broad diagonal plates underneath mineral fissures.
 for(let i=0;i<Math.min(85,Math.floor(w*h/4100));i++){
  const x=b.left+r()*w,y=b.top+r()*h,span=25+r()*90,depth=26+r()*150;
  ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+span*(.3+r()*.4),y-depth*.13);
  ctx.lineTo(x+span*(.1+r()*.3),y+depth);
  ctx.lineTo(x-span*.45,y+depth*.67);ctx.closePath();
  ctx.fillStyle=i%5===0?'#d8e6e31a':i%3===0?'#030c163b':'#a9c0c013';ctx.fill();
 }
 // Mineral fractures follow fault lines, not a regular brick pattern.
 for(let k=0;k<Math.min(95,Math.floor(w*h/2100));k++){
  let x=b.left+r()*w,y=b.top+r()*h;
  ctx.beginPath();ctx.moveTo(x,y);
  for(let t=0;t<4;t++){x+=(r()-.62)*31;y+=10+r()*27;ctx.lineTo(x,y)}
  ctx.strokeStyle=k%4===0?'#d8e8e83e':'#0b192979';
  ctx.lineWidth=.65+r()*2;ctx.stroke();
 }
 // Fine slate grain, all rendered ONCE into each spire's cached bitmap.
 for(let i=0;i<Math.min(420,Math.floor(w*h/420));i++){
  ctx.fillStyle=i%9===0?'#e5ece738':'#08182736';
  ctx.fillRect(b.left+r()*w,b.top+r()*h,.8+r()*1.4,.8+r()*2.7);
 }
 ctx.restore();
 // Wind-driven snow on the TRUE exposed crest, not on interior join seams.
 if(piece.role==='cap'){
  const peak=poly.reduce((v,p)=>p[1]<v[1]?p:v,poly[0]);
  ctx.save();ctx.strokeStyle='#e5eef0b0';ctx.lineWidth=3.3;
  ctx.beginPath();ctx.moveTo(peak[0]-17,peak[1]+6);ctx.lineTo(peak[0],peak[1]);
  ctx.lineTo(peak[0]+20,peak[1]+8);ctx.stroke();ctx.restore();
 }
}
function drawStrata(ctx,spire){
 const r=random((spire.seed+9371)>>>0),b=spire.bounds;
 ctx.save();ctx.beginPath();
 for(const piece of spire.pieces){
  const v=piece.vertices;
  v.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));
  ctx.closePath();
 }
 ctx.clip();
 // Continuous ancient strata cross prefab boundaries without visible seams.
 for(let k=0;k<45;k++){
  const y=b.top+r()*(b.bottom-b.top),x=b.left+r()*(b.right-b.left);
  ctx.beginPath();ctx.moveTo(x-120,y+42);
  ctx.bezierCurveTo(x-40,y+15,x+45,y-22,x+175,y-38-r()*18);
  ctx.strokeStyle=k%4===0?'#d1dbd524':'#091a2851';
  ctx.lineWidth=1+r()*3.2;ctx.stroke();
 }
 // Soft weathered bloom in the lee of the mountain.
 const haze=ctx.createLinearGradient(b.left,b.top,b.right,b.bottom);
 haze.addColorStop(0,'#d6e2e00b');haze.addColorStop(.65,'#92a9b00a');haze.addColorStop(1,'#0815221f');
 ctx.fillStyle=haze;ctx.fillRect(b.left,b.top,b.right-b.left,b.bottom-b.top);
 ctx.restore();
}
function platform(ctx,p){
 ctx.save();
 if(p.kind==='rock'){
  // The visible slab is backed by the same rock mass; a jagged apron and
  // shadow anchor it into the face instead of creating a floating rectangle.
  const g=ctx.createLinearGradient(p.left,p.y,p.right,p.y+23);
  g.addColorStop(0,'#8c9ea5');g.addColorStop(.48,'#435a68');g.addColorStop(1,'#1a2e3e');
  trace(ctx,p.vertices);ctx.fillStyle=g;ctx.fill();
  ctx.strokeStyle='#1a2a38';ctx.lineWidth=2;ctx.stroke();
 }else{
  // The arrival ledge remains a REAL scaffold collider, but now uses
  // snow-caked timbers and low contrast stone-braced structure.
  trace(ctx,p.vertices);ctx.fillStyle='#394853';ctx.fill();
  ctx.strokeStyle='#71818a';ctx.lineWidth=1.6;ctx.stroke();
  ctx.strokeStyle='#263743';ctx.lineWidth=3;
  for(const v of p.braces){ctx.beginPath();ctx.moveTo(v[0],v[1]);ctx.lineTo(v[2],v[3]);ctx.stroke()}
  ctx.strokeStyle='#8d9c9c';ctx.lineWidth=1;
  for(let x=p.left+12;x<p.right-4;x+=22){
   ctx.beginPath();ctx.moveTo(x,p.y+1);ctx.lineTo(x+1,p.y+6);ctx.stroke()
  }
 }
 // Windswept, thin broken snow cap. Actual top line is identical to
 // landing collider, including on broad newly doubled platforms.
 const r=random((p.textureSeed+83)>>>0);
 ctx.beginPath();ctx.moveTo(p.left,p.y-1);
 for(let x=p.left+12;x<p.right;x+=12)
  ctx.lineTo(x,p.y-(1+r()*2.8));
 ctx.lineTo(p.right,p.y-1);
 ctx.strokeStyle='#e0eeedc9';ctx.lineWidth=2.7;ctx.stroke();
 ctx.restore();
}
function climb(ctx,r){
 const y0=r.toY,y1=r.fromY,x=r.x;
 if(r.kind==='ice'){
  const grad=ctx.createLinearGradient(x-r.width/2,0,x+r.width/2,0);
  grad.addColorStop(0,'#85adbb86');grad.addColorStop(.3,'#b6e5edcb');
  grad.addColorStop(.70,'#d1eff2b3');grad.addColorStop(1,'#567f9a94');
  ctx.fillStyle=grad;ctx.fillRect(x-r.width/2,y0,r.width,y1-y0);
  ctx.strokeStyle='#e9fcffcf';ctx.lineWidth=1.4;
  // Ice facets are straight and vertical, with no sinusoidal path.
  for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(x+i*r.width/4,y0);
   ctx.lineTo(x+i*r.width/4,y1);ctx.stroke()}
 }else{
  ctx.strokeStyle='#222b32';ctx.lineWidth=4;
  for(const v of [-r.width/2,r.width/2]){ctx.beginPath();ctx.moveTo(x+v,y0);ctx.lineTo(x+v,y1);ctx.stroke()}
  ctx.strokeStyle='#dfc39c';ctx.lineWidth=2;
  for(let y=y0+7;y<y1;y+=14){ctx.beginPath();ctx.moveTo(x-r.width/2,y);ctx.lineTo(x+r.width/2,y);ctx.stroke()}
 }
}
function draw(ctx,spire,opt={}){
 const clear=opt.clear!==false;
 if(clear){const b=spire.bounds;ctx.clearRect(b.left-80,b.top-80,b.right-b.left+160,b.bottom-b.top+160)}
 for(const p of spire.pieces)drawRock(ctx,p,{material:spire.pieces[0].material});
 drawStrata(ctx,spire);
 for(const r of spire.routes)climb(ctx,r);
 for(const p of spire.platforms)platform(ctx,p);
 const d=spire.departure;
 ctx.fillStyle='#c17d3f';ctx.fillRect(d.left,d.y-4,d.width,8);
 ctx.strokeStyle='#ffe2a8';ctx.lineWidth=2;ctx.strokeRect(d.left,d.y-4,d.width,8);
}
const API=Object.freeze({draw,drawRock,platform,climb,bounds});
if(typeof module==='object'&&module.exports)module.exports=API;else root.SpireRenderV10=API;
})(typeof globalThis!=='undefined'?globalThis:this);
