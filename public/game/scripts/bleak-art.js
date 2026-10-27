// FIVE PEAKS — bleak, grounded alpine art direction.
// A single terrain painter owns EVERY rock face, ledge, snow rim and ice
// channel in the featured course; no separate cartoon terrace assets.
// Archived 997-seed renderers remain in rendering.js for reference.
const bleakHash=(n)=>{let x=Math.sin(n*127.1+91.7)*43758.5453;return x-Math.floor(x);};
function bleakRockMass(g,i,L,R,T,leftBoundary,rightBoundary,seed){
 const bottom=2125;
 g.save();g.beginPath();
 g.moveTo(L,T+1);
 const count=Math.max(8,Math.ceil((R-L)/13));
 for(let j=1;j<=count;j++){
  const f=j/count,x=L+(R-L)*f;
  // Broken shale rather than rounded/cartoon sawtooth teeth.
  const jag=(bleakHash(seed+j*2.17)-.5)*7;
  g.lineTo(x,T-3+jag);
 }
 for(let y=T+24;y<bottom;y+=23)g.lineTo(rightBoundary(y),y);
 g.lineTo(rightBoundary(bottom),bottom);
 for(let y=bottom;y>=T+10;y-=19)g.lineTo(leftBoundary(y),y);
 g.closePath();
 const base=g.createLinearGradient(L-30,T,R+80,T+900);
 base.addColorStop(0,'#677277');
 base.addColorStop(.22,'#414d56');
 base.addColorStop(.58,'#293741');
 base.addColorStop(1,'#121f2a');
 g.fillStyle=base;g.fill();
 g.clip();
 // Long geological faults and angular granite/scarps are clipped to the
 // exact rock mass. Same algorithm on all five peaks incl. starting ridge.
 for(let n=0;n<160;n++){
  const y=T+22+bleakHash(seed+n*9.21)*1620;
  const l=leftBoundary(y)+6,r=rightBoundary(y)-8;
  if(r<l+12)continue;
  const x=l+(r-l)*bleakHash(seed+n*8.31+4);
  const w=20+90*bleakHash(seed+n*1.31),h=75+280*bleakHash(seed+n*3.07);
  g.fillStyle=n%4===0?'#a2a9a717':n%4===1?'#090f182d':n%4===2?'#55636d26':'#2b343b34';
  g.beginPath();g.moveTo(x,y);
  g.lineTo(x+w*.62,y+h*.21);g.lineTo(x+w*.23,y+h);
  g.lineTo(x-w*.19,y+h*.63);g.closePath();g.fill();
  g.strokeStyle=n%3===0?'#a2adb43e':'#10192582';
  g.lineWidth=n%4===0?1.2:2.2;g.beginPath();
  g.moveTo(x,y);g.lineTo(x+w*.62,y+h*.21);g.lineTo(x+w*.23,y+h);
  g.stroke();
 }
 // Massive plunging joints. Individual rock chunks have shared lighting,
 // not bright random painterly polygon fill.
 for(let n=0;n<21;n++){
  const yy=T+76+n*69+bleakHash(seed+n)*28;
  const left=leftBoundary(yy),right=rightBoundary(yy),distance=right-left;
  if(distance<35)continue;
  const x=left+distance*(.18+.64*bleakHash(seed+n*11));
  g.strokeStyle=n%3?'#101b24a8':'#8a96944b';
  g.lineWidth=2+n%4;
  g.beginPath();g.moveTo(x,yy-40);g.lineTo(x-12,yy+10);
  g.lineTo(x+14,yy+64);g.lineTo(x-5,yy+128);g.stroke();
 }
 g.restore();
 // Restrained wind-crusted snow follows ONLY a physically walkable ridge.
 g.save();g.fillStyle='#a7afb0';g.beginPath();g.moveTo(L,T+2);
 for(let k=0;k<=count;k++){
  const x=L+(R-L)*k/count;
  const rough=(bleakHash(seed+k*3.8)-.5)*4;
  g.lineTo(x,T-3+rough);
 }
 g.lineTo(R,T+7);g.lineTo(L,T+6);g.closePath();g.fill();
 g.strokeStyle='#d1d6d2b0';g.lineWidth=1.4;g.beginPath();
 g.moveTo(L,T-3);g.lineTo(R,T-3);g.stroke();g.restore();
}
drawSpire=function bleakSpire(i,g=ctx){
 const m=spires[i],summit=m.summit;
 const arrive=m.ridgeArrival;
 if(arrive){
  // A genuine two-part rock formation. Its upper crevasse is EMPTY
  // space, not a painted crack over a walkable invisible platform.
  bleakRockMass(g,i,arrive[0],arrive[1],arrive[2],
   y=>mountainContourX(i,y),
   y=>arrive[1]+Math.min(100,Math.max(0,y-arrive[2])*.19)+
    Math.sin(y*.032+i)*6,
   i*917+11);
  bleakRockMass(g,i,summit[0],summit[1],summit[2],
   y=>summit[0]-Math.min(260,Math.max(0,y-summit[2])*.37)+
      Math.sin(y*.027+i*2)*6,
   y=>mountainFlankX(i,y),i*917+237);
  // Black void between the broken crowns: progressively pinches closed
  // in the rock below. Transparent above so the player can really fall.
 } else {
  bleakRockMass(g,i,summit[0],summit[1],summit[2],
   y=>mountainContourX(i,y),
   y=>mountainFlankX(i,y),i*917+11);
 }
 for(let j=0;j<m.ledges.length;j++){
  const ledge=m.ledges[j],L=ledge[0],R=ledge[1],T=ledge[2],w=R-L;
  const rockAt=mountainContourX(i,T+78);
  // Carved-out jut, physically joining the broad rock immediately behind.
  g.save();g.beginPath();g.moveTo(L,T+2);g.lineTo(R,T+2);
  g.lineTo(R-7,T+37);g.lineTo(R-w*.19,T+70);
  g.lineTo(Math.max(rockAt+26,L+w*.34),T+125);
  g.lineTo(L+w*.22,T+75);g.closePath();
  const shoulder=g.createLinearGradient(L,T,R,T+125);
  shoulder.addColorStop(0,'#606f74');shoulder.addColorStop(.38,'#354651');
  shoulder.addColorStop(1,'#192732');g.fillStyle=shoulder;g.fill();
  g.strokeStyle='#162632a8';g.lineWidth=4;g.beginPath();
  g.moveTo(L+12,T+12);g.lineTo(L+w*.28,T+50);
  g.lineTo(L+w*.37,T+99);g.stroke();
  g.strokeStyle='#aab6b563';g.lineWidth=2;g.beginPath();
  g.moveTo(L+w*.68,T+7);g.lineTo(L+w*.52,T+32);
  g.lineTo(L+w*.62,T+66);g.stroke();
  g.fillStyle='#a5b3b4';g.beginPath();g.moveTo(L,T+2);
  for(let k=0;k<=12;k++){
   const x=L+w*k/12;g.lineTo(x,T-2+(bleakHash(i*31+j*13+k)-.5)*3);
  }
  g.lineTo(R,T+5);g.lineTo(L,T+5);g.closePath();g.fill();
  g.restore();
 }
};
drawIceClimb=function bleakIceRoutes(i,g=ctx){
 const routes=iceRouteNetwork(i);
 for(const route of routes){
  // Shared climbs draw just the lower branching segment; the parent path
  // is already visible above the junction. No missing ice for low ledges.
  const points=route.points;
  if(!points.length)continue;
  const upperY=route.sharedWith===null||route.sharedWith===undefined?
   points.at(-1).y:route.joinY;
  const lowerY=points[0].y;
  g.save();g.lineCap='round';g.lineJoin='round';
  for(const [width,stroke] of [[69,'#0c1b2799'],[55,'#263f4c'],[43,'#48616a'],[25,'#70888d85']]){
   g.beginPath();
   for(let n=0;n<=45;n++){
    const y=upperY+(lowerY-upperY)*n/45,
          x=iceXOnPath(points,y);
    if(n===0)g.moveTo(x,y);else g.lineTo(x,y);
   }
   g.lineWidth=width;g.strokeStyle=stroke;g.stroke();
  }
  for(const shift of [-16,7,19]){
   g.beginPath();
   for(let n=0;n<=31;n++){
    const y=upperY+(lowerY-upperY)*n/31,
       x=iceXOnPath(points,y)+shift+Math.sin(y*.043+shift)*3;
    if(n===0)g.moveTo(x,y);else g.lineTo(x,y);
   }
   g.strokeStyle=shift===19?'#a9bfc078':'#bfd2ce83';g.lineWidth=1.7;g.stroke();
  }
  g.restore();
 }
};
drawIceShelfJoins=function(){};
drawIceCrestSnow=function(){};
decorate=function bleakDecorate(i,g=ctx){
 const summit=spires[i].summit;
 // Dead timber and sharp stones, very restrained. No stacked triangular
 // Christmas trees or candy-blue ice on this hostile upper mountain.
 for(let n=0;n<4;n++){
  const f=.22+n*.19,x=summit[0]+(summit[1]-summit[0])*f,y=summit[2];
  const h=9+(n*11+i*3)%23;
  g.fillStyle='#202d32';g.beginPath();g.moveTo(x-7,y);
  g.lineTo(x+1,y-h);g.lineTo(x+8,y);g.closePath();g.fill();
  g.strokeStyle='#7581838c';g.lineWidth=1;g.beginPath();
  g.moveTo(x-1,y-2);g.lineTo(x+1,y-h+3);g.stroke();
 }
};
drawFeaturedCampsite=function bleakCamp(peak=2){
 const location=featuredCampPosition(peak);
 if(!location)return;
 const x=location.x,y=location.y;
 ctx.save();
 // Small expedition shelter: weathered charcoal canvas, not a bright toy tent.
 ctx.fillStyle='#17252a';ctx.beginPath();ctx.moveTo(x-64,y+2);
 ctx.lineTo(x-30,y-32);ctx.lineTo(x+8,y+2);ctx.closePath();ctx.fill();
 ctx.fillStyle='#414d4b';ctx.beginPath();ctx.moveTo(x-62,y);
 ctx.lineTo(x-30,y-32);ctx.lineTo(x-20,y);ctx.closePath();ctx.fill();
 ctx.strokeStyle='#94a3a17e';ctx.lineWidth=1.5;ctx.beginPath();
 ctx.moveTo(x-30,y-32);ctx.lineTo(x+8,y+2);
 ctx.moveTo(x-64,y+2);ctx.lineTo(x+8,y+2);ctx.stroke();
 ctx.strokeStyle='#262322';ctx.lineWidth=4;ctx.beginPath();
 ctx.moveTo(x+35,y+1);ctx.lineTo(x+53,y+4);
 ctx.moveTo(x+52,y);ctx.lineTo(x+38,y+4);ctx.stroke();
 const pulse=.86+Math.sin(performance.now()*.013)*.09;
 const gl=ctx.createRadialGradient(x+44,y-13,1,x+44,y-13,58);
 gl.addColorStop(0,'#d0713c77');gl.addColorStop(1,'#ce5b2200');
 ctx.fillStyle=gl;ctx.fillRect(x-20,y-76,123,92);
 ctx.fillStyle='#d28c56';ctx.beginPath();ctx.moveTo(x+38,y);
 ctx.quadraticCurveTo(x+35,y-18*pulse,x+45,y-25*pulse);
 ctx.quadraticCurveTo(x+56,y-13*pulse,x+51,y);
 ctx.closePath();ctx.fill();
 ctx.restore();
};
