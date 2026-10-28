/* Phase 3A: genuine two-spire playtest adapter.
 * Extends the independent Phase-2 player; no new pole physics.
 * All world landings/climbs reference original generated local geometry.
 */
(function(root){
'use strict';
const Base=typeof module==='object'&&module.exports?require('./spire-phase2-playtest.js').SpirePhase2Playtest:root.SpirePhase2.SpirePhase2Playtest;
function translatedPoints(points,x,y){return points.map(p=>[p[0]+x,p[1]+y])}
function translate(p,dx,dy,index){
 return {...p,id:'s'+index+'/'+p.id,x:p.x+dx,y:p.y+dy,left:p.left+dx,right:p.right+dx,
  vertices:translatedPoints(p.vertices,dx,dy),
  braces:p.braces?.map(q=>[q[0]+dx,q[1]+dy,q[2]+dx,q[3]+dy])||[]};
}
function buildWorld(course){
 const pieces=[],platforms=[],routes=[],surfaces=[],decks=[];
 for(let i=0;i<course.peaks.length;i++){
  const spire=course.peaks[i],dx=spire.worldX,dy=spire.worldY;
  for(const piece of spire.pieces)pieces.push({...piece,id:'s'+i+'/'+piece.id,vertices:translatedPoints(piece.vertices,dx,dy)});
  for(const p of spire.platforms){
   const platform=translate(p,dx,dy,i);
   platforms.push(platform);
   surfaces.push({id:platform.id,kind:platform.kind,top:platform.y,left:platform.left,right:platform.right,spire:i});
  }
  const departure={id:'s'+i+'/departure',left:spire.departure.left+dx,right:spire.departure.right+dx,
   y:spire.departure.y+dy,width:spire.departure.width,spire:i};
  decks.push(departure);
  surfaces.push({id:departure.id,kind:'departure',top:departure.y,left:departure.left,right:departure.right,spire:i});
  for(const r of spire.routes)routes.push({...r,id:'s'+i+'/'+r.id,source:'s'+i+'/'+r.source,
   target:'s'+i+'/'+r.target,x:r.x+dx,finishX:r.finishX+dx,fromY:r.fromY+dy,toY:r.toY+dy,
   collider:{...r.collider,left:r.collider.left+dx,right:r.collider.right+dx,top:r.collider.top+dy,bottom:r.collider.bottom+dy}});
 }
 const all=pieces.flatMap(p=>p.vertices);
 return {pieces,platforms,routes,decks,surfaces,
  bounds:{left:Math.min(...all.map(p=>p[0])),right:Math.max(...all.map(p=>p[0])),
   top:Math.min(...all.map(p=>p[1])),bottom:Math.max(...all.map(p=>p[1]))}};
}
class TwoSpirePlaytest extends Base{
 constructor({assemble,physics,iceStep,buildCourse,config}){
  super({assemble,physics,iceStep});
  this.buildCourse=buildCourse;
  this.courseConfig=config||this.cfg;
  this.loadCourse(42,1);
 }
 loadCourse(seed=42,preset=1){
  this.course=this.buildCourse(seed,{preset,count:2},{assemble:this.assemble,physics:this.physics,config:this.courseConfig});
  const world=buildWorld(this.course);
  this.spire=world;this.surfaces=world.surfaces;
  const start=this.surfaces.filter(p=>p.spire===0&&p.kind!=='departure').sort((a,b)=>b.top-a.top)[0];
  if(!start)throw Error('No starting platform');
  this.player={x:0,y:0,vx:0,vy:0,state:'GROUNDED',standingOn:start.id,climb:null,vault:null,facingDir:1};
  this.keys={left:false,right:false,up:false,down:false};
  this.timer=0;this.completed=false;this.crossed=false;
  const startRoute=world.routes.find(r=>r.source===start.id);
  this.player.x=startRoute?.x??(start.left+start.right)/2;
  this.player.y=start.top-22;
  this.message='Climb to orange, then use the existing pole mechanics to cross';
  return this.course;
 }
 tick(dt){
  super.tick(dt);
  if(this.player.standingOn==='s1/departure'){this.completed=true;this.message='Second departure reached — two-spire route complete'}
  if(this.player.standingOn?.startsWith('s1/'))this.crossed=true;
 }
 reset(){if(this.course&&this.buildCourse)this.loadCourse(this.course.seed,this.course.gapPreset);else super.reset()}
}
const API=Object.freeze({TwoSpirePlaytest,buildWorld});
if(typeof module==='object'&&module.exports)module.exports=API;else root.SpirePhase3A=API;
})(typeof globalThis!=='undefined'?globalThis:this);
