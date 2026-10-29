/* Phase 3B: new seam-compatible scenic foundation BLOCKS beneath elevated spires.
 * No old terrain assets, no collision or geometry changes to vault courses.
 * These blocks are explicitly BACKGROUND ONLY until their physical role is authored.
 */
(function(root){
'use strict';
const rand=(n)=>{let x=n>>>0||7;return ()=>((x=(Math.imul(x,1664525)+1013904223)>>>0)/4294967296)};
const round=Math.round;
function floorY(course){return Math.max(...course.peaks.map(p=>p.worldY+p.bounds.bottom))+165}
function build(course){
 if(!course?.peaks?.length)throw Error('A new modular course is required');
 const floor=floorY(course),foundations=[];
 course.peaks.forEach((peak,index)=>{
  const base=peak.pieces[0],edge=base.vertices.slice(0,2);
  const localFloor=floor-peak.worldY;
  const fromBottom=Math.max(...base.vertices.map(p=>p[1]));
  const drop=localFloor-fromBottom;
  // The original shape is completely unchanged; new foundations begin exactly
  // on the original base's lowest horizontal seam (y=0).
  const total=Math.max(0,Math.round(localFloor));
  if(total<=0)return;
  const r=rand(peak.seed*713+index*191+13);
  const blocks=[];
  let y=0,upperL=edge[0][0],upperR=edge[1][0];
  const minL=peak.bounds.left+5,maxR=peak.bounds.right-5;
  while(y<total){
   const remaining=total-y;
   const h=remaining<=210?remaining:Math.min(210,125+Math.floor(r()*75));
   if(h<=0)break;
   const t=(y+h)/Math.max(1,total);
   // Broaden downward but always within original spire's horizontal envelope.
   const driftL=12+r()*32,driftR=12+r()*32;
   const lowL=Math.max(minL,round(upperL-driftL*(.35+.65*t)));
   const lowR=Math.min(maxR,round(upperR+driftR*(.35+.65*t)));
   const waistL=round(Math.max(minL,Math.min(upperL,lowL)-(r()*15)));
   const waistR=round(Math.min(maxR,Math.max(upperR,lowR)+(r()*15)));
   // Polygon is strictly monotone in vertical direction; TOP is the exact
   // previous segment BOTTOM and has no seams/holes after assembly.
   const vertices=[[upperL,y],[upperR,y],
     [waistR,y+round(h*.31)],[round((waistR+lowR)*.5),y+round(h*.66)],
     [lowR,y+h],[lowL,y+h],[round((waistL+lowL)*.5),y+round(h*.68)],
     [waistL,y+round(h*.29)]];
   const seg={id:'foundation-'+index+'-'+blocks.length,owner:index,
     material:base.material,textureSeed:base.textureSeed+blocks.length*1801,
     role:'foundation',vertices,topY:y,bottomY:y+h,collision:'background-only'};
   blocks.push(seg);
   y+=h;upperL=lowL;upperR=lowR;
  }
  foundations.push({spire:index,worldX:peak.worldX,worldY:peak.worldY,
   blocks,floor:peak.worldY+y,baseEdge:edge,collision:'background-only'});
 });
 return {floor,foundations,collision:'background-only'};
}
function inspect(course,foundation){
 const errors=[];
 if(foundation.collision!=='background-only')errors.push('must remain decorative');
 for(const item of foundation.foundations){
  const sp=course.peaks[item.spire],lower=sp.pieces[0];
  let previous=lower.vertices.slice(0,2);
  for(const block of item.blocks){
   const v=block.vertices;
   if(v[0][0]!==previous[0][0]||v[1][0]!==previous[1][0])
    errors.push('broken foundation seam on '+block.id);
   const max=Math.max(...v.map(p=>p[0])),min=Math.min(...v.map(p=>p[0]));
   if(min<sp.bounds.left-1e-6||max>sp.bounds.right+1e-6)
    errors.push('rock extension breaches original horizontal envelope '+block.id);
   if(block.collision!=='background-only')errors.push('foundation incorrectly collidable');
   previous=[v[5],v[4]];
  }
  if(Math.abs(item.floor-foundation.floor)>1e-7)
   errors.push('foundation does not reach shared ground datum');
 }
 return {valid:errors.length===0,errors,count:foundation.foundations.reduce((sum,f)=>sum+f.blocks.length,0)};
}
function draw(ctx,foundation,renderer){
 for(const item of foundation.foundations){
  ctx.save();ctx.translate(item.worldX,item.worldY);
  for(const block of item.blocks)renderer.drawRock(ctx,block);
  // Keep the root boundary completely unmarked: the shared granite light
  // field now joins the foundation and climbable spire without a drawn seam.
  ctx.restore();
 }
}
const API=Object.freeze({build,inspect,draw,floorY});
if(typeof module==='object'&&module.exports)module.exports=API;else root.SpireFoundationsV12=API;
})(typeof globalThis!=='undefined'?globalThis:this);
