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
function drawRock(ctx,piece){
 const r=random(piece.textureSeed),poly=piece.vertices,b=bounds(poly),w=b.right-b.left,h=b.bottom-b.top;
 ctx.save();trace(ctx,poly);ctx.clip();
 const tones=COLORS[piece.material]||COLORS['charcoal-granite'];
 const base=ctx.createLinearGradient(b.left,b.top,b.right,b.bottom);
 base.addColorStop(0,tones[0]);base.addColorStop(.46,tones[1]);base.addColorStop(1,tones[2]);
 ctx.fillStyle=base;ctx.fillRect(b.left-1,b.top-1,w+2,h+2);
 // Local fractured strata; jittered segments are clipped to this module.
 for(let i=0;i<Math.min(160,Math.floor(w*h/280));i++){
  const x=b.left+r()*w,y=b.top+r()*h,dy=5+r()*28;
  ctx.beginPath();ctx.moveTo(x-7-r()*11,y-8);ctx.lineTo(x+r()*15,y+dy*.3);
  ctx.lineTo(x-4+r()*15,y+dy);ctx.closePath();
  ctx.fillStyle=i%4===0?'#e2eeee23':i%3===0?'#0a192c59':'#c4d7dc18';ctx.fill();
 }
 // A few sharper mineral cracks (no repeated downloaded image textures).
 for(let k=0;k<Math.min(48,Math.floor(w*h/1500));k++){
  let x=b.left+r()*w,y=b.top+r()*h;
  ctx.beginPath();ctx.moveTo(x,y);
  for(let s=0;s<4;s++){x+=(r()-.60)*15;y+=6+r()*14;ctx.lineTo(x,y)}
  ctx.strokeStyle=k%3===0?'#d9e5ea48':'#0a17245e';
  ctx.lineWidth=.8+r()*1.6;ctx.stroke();
 }
 for(let i=0;i<Math.min(350,Math.floor(w*h/170));i++){
  ctx.fillStyle=i%6===0?'#eaf0eb52':'#06131f46';
  ctx.fillRect(b.left+r()*w,b.top+r()*h,1+r()*1.7,1+r()*1.7);
 }
 ctx.restore();
 // Snow dust on exposed upper ridges, never across concealed connector seams.
 if(piece.role==='cap'){
  ctx.save();ctx.strokeStyle='#dfedefa8';ctx.lineWidth=4;
  const minY=b.top;const high=poly.filter(p=>p[1]<minY+28);
  if(high.length>1){ctx.beginPath();ctx.moveTo(...high[0]);for(const v of high.slice(1))ctx.lineTo(...v);ctx.stroke()}
  ctx.restore();
 }
}
function platform(ctx,p){
 ctx.save();trace(ctx,p.vertices);
 if(p.kind==='rock'){
  const g=ctx.createLinearGradient(p.left,p.y,p.right,p.y+20);
  g.addColorStop(0,'#c0cdd0');g.addColorStop(.5,'#748e97');g.addColorStop(1,'#263c4c');
  ctx.fillStyle=g;ctx.fill();ctx.strokeStyle='#d5e1e4a0';ctx.lineWidth=1.2;ctx.stroke();
  ctx.beginPath();ctx.moveTo(p.left,p.y);ctx.lineTo(p.right,p.y);
  ctx.strokeStyle='#e8f0ec';ctx.lineWidth=2;ctx.stroke();
 }else{
  ctx.fillStyle='#657c85';ctx.fill();ctx.strokeStyle='#e0b98e';ctx.lineWidth=2;ctx.stroke();
  ctx.strokeStyle='#9ab2b6';ctx.lineWidth=2.3;
  for(const q of p.braces){ctx.beginPath();ctx.moveTo(q[0],q[1]);ctx.lineTo(q[2],q[3]);ctx.stroke()}
  for(let x=p.left+5;x<p.right-2;x+=10){ctx.beginPath();ctx.moveTo(x,p.y);ctx.lineTo(x+2,p.y+6);ctx.stroke()}
 }
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
 for(const p of spire.pieces)drawRock(ctx,p);
 for(const r of spire.routes)climb(ctx,r);
 for(const p of spire.platforms)platform(ctx,p);
 const d=spire.departure;
 ctx.fillStyle='#c17d3f';ctx.fillRect(d.left,d.y-4,d.width,8);
 ctx.strokeStyle='#ffe2a8';ctx.lineWidth=2;ctx.strokeRect(d.left,d.y-4,d.width,8);
}
const API=Object.freeze({draw,drawRock,platform,climb,bounds});
if(typeof module==='object'&&module.exports)module.exports=API;else root.SpireRenderV10=API;
})(typeof globalThis!=='undefined'?globalThis:this);
