/* Summitbound v0.31 — two independent seeded texture styles.
 * Loaded after alpine-art-v030.js. Only terrain rendering changes.
 */
(()=>{
'use strict';
const rnd=n=>{const x=Math.sin(n*91.117+32.71)*43758.5453;return x-Math.floor(x)};
const choose=(n,a,b)=>a+(b-a)*rnd(n),mix=(a,b,t)=>a+(b-a)*t;
let currentPack=localStorage.getItem('summitbound-art-pack')||'cinematic';
if(!['painterly','cinematic','modular'].includes(currentPack))currentPack='painterly';
window.getSummitboundArtPack=()=>currentPack;
window.setSummitboundArtPack=name=>{
 if(!['painterly','cinematic','modular'].includes(name)||name===currentPack)return;
 currentPack=name;localStorage.setItem('summitbound-art-pack',name);
 if(typeof invalidateTerrainCache==='function')invalidateTerrainCache();
 const button=document.getElementById('artPackToggle');
 if(button)button.textContent='Art: '+(name==='painterly'?'Painterly':name==='modular'?'Modular':'Cinematic');
};
function path(g,pts){g.beginPath();g.moveTo(pts[0][0],pts[0][1]);for(let k=1;k<pts.length;k++)g.lineTo(pts[k][0],pts[k][1])}
function fill(g,pts,c){path(g,pts);g.closePath();g.fillStyle=c;g.fill()}
function stroke(g,pts,c,w=1){path(g,pts);g.strokeStyle=c;g.lineWidth=w;g.stroke()}
function cap(g,l,r,t,seed){
 const pts=[[l-3,t+6]],count=Math.ceil((r-l)/12);
 for(let k=0;k<=count;k++){const x=Math.min(r,l+k*12);pts.push([x,t-2-choose(seed+k*5,-4,5)-Math.sin((x-l)/(r-l||1)*12+seed)*2])}
 pts.push([r+3,t+10],[l,t+9]);
 const grad=g.createLinearGradient(l,t-10,l,t+10);
 if(currentPack==='painterly'){grad.addColorStop(0,'#f2e7d1');grad.addColorStop(.6,'#c3d4cb');grad.addColorStop(1,'#6c9097')}
 else{grad.addColorStop(0,'#f3f6f7');grad.addColorStop(.36,'#a5b3ba');grad.addColorStop(1,'#465964')}
 fill(g,pts,grad);
}
function rock(g,L,R,T,leftAt,rightAt,seed){
 const boundary=[[L,T]];
 for(let y=T+15;y<=2100;y+=22)boundary.push([leftAt(y),y]);
 boundary.push([leftAt(2130),2130],[rightAt(2130),2130]);
 for(let y=2100;y>T+10;y-=22)boundary.push([rightAt(y),y]);
 boundary.push([R,T]);
 g.save();path(g,boundary);g.closePath();g.clip();
 const grad=g.createLinearGradient(L-80,T,R+130,T+1200);
 if(currentPack==='painterly'){
  grad.addColorStop(0,'#bbc2b5');grad.addColorStop(.24,'#789294');grad.addColorStop(.62,'#344f5b');grad.addColorStop(1,'#182e3e');
 }else{
  grad.addColorStop(0,'#71828a');grad.addColorStop(.22,'#364750');grad.addColorStop(.56,'#222b35');grad.addColorStop(1,'#0b1721');
 }
 g.fillStyle=grad;g.fillRect(L-500,T,R-L+1300,2450);
 if(currentPack==='painterly'){
  // Watercolour washes and organic brush marks; no repeated triangular tiles.
  for(let k=0;k<180;k++){
   const y=T+choose(seed+k*79,8,1850),l=leftAt(y),r=rightAt(y);
   if(r-l<12)continue;
   const x=mix(l,r,choose(seed+k*41,.05,.92)),w=choose(seed+k*17,20,180),h=choose(seed+k*67,25,240);
   fill(g,[[x-w*.28,y-h*.2],[x+w*.35,y-h*.5],[x+w,y+h*.12],[x+w*.25,y+h],[x-w*.7,y+h*.6]],k%3===0?'#e3e6d010':k%4===0?'#101e3224':'#adc7bb15');
  }
  for(let k=0;k<90;k++){
   const y=T+choose(seed+k*23,18,1650),l=leftAt(y),r=rightAt(y);
   if(r-l<15)continue;
   const x=mix(l,r,choose(seed+k*67,.08,.88));
   stroke(g,[[x,y],[x+choose(k+seed,-23,10),y+choose(k*4,40,82)],[x+choose(k*37,-38,20),y+choose(k*7,102,162)]],k%3===0?'#e5e3c126':'#0a203449',choose(seed+k*2,.7,2.1));
  }
 }else{
  // Angular mineral fractures, crystalline flecks and directional seams.
  for(let k=0;k<380;k++){
   const y=T+choose(seed+k*97,9,1910),l=leftAt(y),r=rightAt(y);
   if(r-l<17)continue;
   const x=mix(l,r,choose(seed+k*49,.04,.94)),w=choose(seed+k*73,8,115),h=choose(seed+k*57,10,150);
   fill(g,[[x,y],[x+w*.55,y-h*.25],[x+w,y+h*.23],[x+w*.2,y+h],[x-w*.32,y+h*.42]],k%7===0?'#b4bfbc26':k%4===0?'#52636b3a':k%2===0?'#080d169a':'#35445070');
   stroke(g,[[x,y],[x+w*.55,y-h*.25],[x+w,y+h*.23]],k%6===0?'#c4cccb39':'#0c141b9c',choose(seed+k*39,1,3.3));
  }
  for(let k=0;k<1400;k++){
   const y=T+choose(seed+k*53,5,1900),l=leftAt(y),r=rightAt(y);
   if(r-l<12)continue;
   const x=mix(l,r,choose(seed+k*109,.02,.97)),sz=choose(seed+k*23,.6,3.5);
   g.fillStyle=k%5===0?'#d9e1de4b':k%2===0?'#08172288':'#9aafb037';
   g.fillRect(x,y,sz,sz*.65);
  }
 }
 g.restore();cap(g,L,R,T,seed);
}
function renderMountain(i,g){
 const s=spires[i],m=s.summit,arrival=s.ridgeArrival;
 if(arrival){
  rock(g,arrival[0],arrival[1],arrival[2],y=>mountainContourX(i,y),y=>arrival[1]+Math.min(100,Math.max(0,y-arrival[2])*.19)+Math.sin(y*.032+i)*6,i*193+13);
  rock(g,m[0],m[1],m[2],y=>ridgeUpperWallX(i,y),y=>mountainFlankX(i,y),i*193+73);
 }else rock(g,m[0],m[1],m[2],y=>mountainContourX(i,y),y=>mountainFlankX(i,y),i*193+13);
 for(let k=0;k<s.ledges.length;k++){
  const ledge=s.ledges[k],a=ledge[0],b=ledge[1],t=ledge[2],seed=i*77+k*131,w=b-a;
  const root=mountainContourX(i,t+100);
  const pts=[[a-5,t+5],[b+5,t+8],[b-5,t+23],[b-w*.2,t+52],[root+30,t+112],[root-12,t+141],[a+w*.16,t+73]];
  const grad=g.createLinearGradient(a,t,b+25,t+120);
  if(currentPack==='painterly'){grad.addColorStop(0,'#a8b9b2');grad.addColorStop(.5,'#68858b');grad.addColorStop(1,'#243e4d')}
  else{grad.addColorStop(0,'#677a82');grad.addColorStop(.5,'#263843');grad.addColorStop(1,'#111d28')}
  fill(g,pts,grad);
  for(let j=0;j<11;j++){
   const x=a+w*choose(seed+j*17,.16,.85),y=t+choose(seed+j*53,15,80);
   stroke(g,[[x,y],[x+choose(j*9,-24,16),y+choose(j*5,13,39)]],currentPack==='painterly'?'#e4ded128':'#07131f92',currentPack==='painterly'?1.6:2.6);
  }
  cap(g,a,b,t,seed);
 }
}
function tree(g,x,y,height,seed){
 const lean=choose(seed,-.13,.11),branches=16;
 g.save();g.lineCap='round';
 stroke(g,[[x,y],[x+lean*height*.3,y-height*.55],[x+lean*height,y-height]],'#242e2e',Math.max(3,height*.055));
 for(let n=0;n<branches;n++){
  const u=(n+1)/(branches+1),bx=x+lean*height*u,by=y-height*u;
  const spread=height*.31*(1-u)*choose(seed+n*13,.62,1.2);
  for(const side of [-1,1]){
   const tx=bx+side*spread,ty=by+spread*.17;
   stroke(g,[[bx,by],[mix(bx,tx,.58),by-2],[tx,ty]],
    currentPack==='painterly'?(n%3===0?'#47605d':'#233e3e'):(n%4===0?'#374849':'#111e25'),
    Math.max(1.8,height*(currentPack==='painterly'?.042:.031)*(1-u*.5)));
   if(n%3===0)stroke(g,[[bx+side*spread*.45,by-4],[bx+side*spread*.8,by-3]],currentPack==='painterly'?'#e0dfcd99':'#bdc9c577',currentPack==='painterly'?2.2:1.2);
  }
 }
 g.restore();
}
function decorateMountain(i,g){
 const m=spires[i],tops=m.ridgeArrival?[m.ridgeArrival,m.summit]:[m.summit];
 for(let j=0;j<tops.length;j++){
  const t=tops[j],w=t[1]-t[0],n=w>650?7:w>300?4:2;
  for(let k=0;k<n;k++){
   const f=k%2===0?choose(i*17+j*93+k*7,.06,.29):choose(i*19+j*37+k*13,.73,.94);
   const h=choose(i*11+j*23+k*41,currentPack==='painterly'?83:55,currentPack==='painterly'?180:143);
   tree(g,t[0]+w*f,t[2]-5,h,i*91+j*11+k*7);
  }
 }
 for(let k=0;k<m.ledges.length;k++){
  const l=m.ledges[k],w=l[1]-l[0];
  if(w>175&&k%2===0)tree(g,l[0]+w*.2,l[2]-4,choose(i*37+k*89,39,88),i*91+k*7);
 }
 // Snow caps are composited last, after ice, to occlude all exit seams.
 for(const l of m.ledges)cap(g,l[0],l[1],l[2],i*77+81);
 for(const t of tops)cap(g,t[0],t[1],t[2],i*277+13);
}
function iceCrust(g,i){
 const routes=iceRouteNetwork(i);
 for(let r=0;r<routes.length;r++){
  const points=routes[r].points;
  if(!points||points.length<2)continue;
  const entry=points[0],exit=points[points.length-1];
  // Destination crest, NOT origin ledge. The old code cut away the entire
  // face between the starting ledge and summit, making the route invisible.
  const dest=spires[i].ridgeArrival||spires[i].summit;
  const yTop=Math.max(Math.min(exit.y,entry.y),dest[2]+10);
  const yBottom=Math.max(exit.y,entry.y);
  // Snow caps drawn in decorate() are allowed to mask just the final 10px.
  if(yBottom<=yTop+3)continue;
  const left=[],right=[];
  for(let k=0;k<=70;k++){
   const y=mix(yTop,yBottom,k/70),x=iceXOnPath(points,y);
   const jag=choose(i*19+r*53+k*29,-9,9),wide=25+Math.sin(k*1.12+r)*6;
   left.push([x-wide+jag,y]);right.push([x+wide+jag*.7,y]);
  }
  const grad=g.createLinearGradient(entry.x-30,yTop,entry.x+43,yBottom);
  if(currentPack==='painterly'){grad.addColorStop(0,'#d8e4d7');grad.addColorStop(.35,'#8eb6b5');grad.addColorStop(.7,'#4b8296');grad.addColorStop(1,'#335b68')}
  else{grad.addColorStop(0,'#d7e6e9');grad.addColorStop(.28,'#91abb8');grad.addColorStop(.63,'#456a7c');grad.addColorStop(1,'#192f3b')}
  g.save();g.beginPath();g.rect(Math.min(...left.map(p=>p[0]))-27,yTop,Math.max(...right.map(p=>p[0]))-Math.min(...left.map(p=>p[0]))+54,yBottom-yTop+1);g.clip();
  fill(g,left.concat(right.reverse()),grad);
  for(let k=0;k<100;k++){
   const y=mix(yTop+4,yBottom-3,rnd(i*13+r*127+k*43));
   const x=iceXOnPath(points,y)+choose(i*89+r*37+k*17,-23,23),len=choose(i*11+r*47+k*31,5,23);
   stroke(g,[[x,y],[x-choose(k*37,-2,5),y+len]],currentPack==='painterly'?(k%2?'#f4ede182':'#28495c64'):(k%2?'#d9f0f0a2':'#0f283e95'),currentPack==='painterly'?1.8:1.25);
  }
  g.restore();
 }
}
drawSpire=function packedMountain(i,g=ctx){renderMountain(i,g)};
drawIceClimb=function packedIce(i,g=ctx){iceCrust(g,i)};
decorate=function packedDecor(i,g=ctx){decorateMountain(i,g)};
})();