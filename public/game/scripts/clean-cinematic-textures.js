/* Deterministic Cinematic-style procedural rock textures for cleanroom assets.
   Canvas renderer can be used with pre-render/offscreen caching. */
(function(root){
'use strict';
function rng(seed){let s=seed>>>0||1;return ()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);}
const palette={
 'dark-granite':['#788b92','#41535e','#182b3a'],
 'slate':['#849399','#3b4d59','#142638'],
 'frosted-granite':['#a5b9bc','#566e78','#1c3240'],
 'weathered-rock':['#899a9b','#4a636c','#20333c']
};
function render(ctx,piece,options={}){
 const polygon=piece.vertices||piece.polygon;
 if(!polygon||polygon.length<3)throw Error('Missing rock polygon');
 const xs=polygon.map(p=>p[0]),ys=polygon.map(p=>p[1]);
 const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 const rand=rng(piece.textureSeed||piece.variant+17||11), colors=palette[piece.material]||palette['frosted-granite'];
 ctx.save();ctx.beginPath();polygon.forEach((v,i)=>i?ctx.lineTo(...v):ctx.moveTo(...v));ctx.closePath();ctx.clip();
 const g=ctx.createLinearGradient(minX,minY,maxX,maxY);g.addColorStop(0,colors[0]);g.addColorStop(.43,colors[1]);g.addColorStop(1,colors[2]);
 ctx.fillStyle=g;ctx.fillRect(minX-2,minY-2,maxX-minX+4,maxY-minY+4);
 const w=maxX-minX,h=maxY-minY,n=Math.max(18,Math.min(150,Math.round(w*h/2800)));
 for(let i=0;i<n;i++){
  const x=minX+rand()*w,y=minY+rand()*h,dx=(rand()-.45)*w*.17,dy=12+rand()*h*.16;
  ctx.beginPath();ctx.moveTo(x-14,y-8);ctx.lineTo(x+dx*.4,y-dy*.25);
  ctx.lineTo(x+dx,y+dy*.38);ctx.lineTo(x-5,y+dy);ctx.closePath();
  ctx.fillStyle=i%3===0?'#dce7df1b':i%3===1?'#09172850':'#acc0c129';ctx.fill();
  if(i%4===0){ctx.strokeStyle='#d5e3e238';ctx.lineWidth=1.4;ctx.stroke();}
 }
 const grains=Math.min(440,Math.round(w*h/500));
 for(let j=0;j<grains;j++){ctx.fillStyle=j%5?'#0815225b':'#c5d2d14d';ctx.fillRect(minX+rand()*w,minY+rand()*h,1+rand()*2,1+rand()*2);}
 ctx.restore();
 if(options.snow!==false&&(piece.role==='summit'||piece.size)){
  ctx.save();ctx.beginPath();
  const top=polygon.slice().sort((a,b)=>a[1]-b[1]).slice(0,Math.min(4,polygon.length)).sort((a,b)=>a[0]-b[0]);
  if(top.length>1){ctx.moveTo(...top[0]);for(const p of top.slice(1))ctx.lineTo(...p);
   ctx.strokeStyle='#e1ebeb';ctx.lineWidth=3;ctx.stroke();}
  ctx.restore();
 }
 return {bounds:[minX,minY,maxX,maxY],facets:n,grains};
}
const api=Object.freeze({render,palette});
if(typeof module==='object'&&module.exports)module.exports=api;else root.SummitCinematicTexture=api;
})(typeof globalThis!=='undefined'?globalThis:this);
