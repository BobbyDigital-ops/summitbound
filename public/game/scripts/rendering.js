// Summit Leap v0.8.3 — extracted unchanged from v0.8.1.
// Irregular, wind-sculpted conifers: branching silhouettes with broken snow
// deposits instead of stacked symmetric triangle/Christmas-tree sprites.
function pine(cx,ground,s,paintCtx=ctx){
 paintCtx.save();paintCtx.translate(cx,ground);paintCtx.scale(s,s);
 // Restored asymmetric snow-laden conifer silhouette (the SVG had an inverted taper).
 const seed=Math.sin(cx*.093+ground*.025)*31;
 const lean=Math.sin(cx*.033)*7;
 paintCtx.strokeStyle='#292b30';paintCtx.lineWidth=3.5;paintCtx.lineCap='round';
 paintCtx.beginPath();paintCtx.moveTo(0,7);paintCtx.quadraticCurveTo(-lean*.2,-48,lean,-116);paintCtx.stroke();
 for(let j=0;j<14;j++){
  const h=-14-j*7.25;
  const fraction=j/14, half=31*(1-fraction*.86);
  for(const side of [-1,1]){
   const variation=.75+.25*Math.sin(seed+j*1.71+side*4);
   const reach=half*variation;
   const x0=lean*(j/14), x1=x0+side*reach;
   const droop=4+5*(1-fraction)+3*Math.sin(seed+j*2.9);
   paintCtx.strokeStyle='#323638';paintCtx.lineWidth=2.6;
   paintCtx.beginPath();paintCtx.moveTo(x0,h-5);
   paintCtx.quadraticCurveTo(x0+side*reach*.53,h-9,x1,h+droop);paintCtx.stroke();
   const foliage=paintCtx.createLinearGradient(x0-side*15,h-12,x1,h+11);
   foliage.addColorStop(0,j%3?'#152c30':'#294245');
   foliage.addColorStop(.6,j%2?'#1c3938':'#253b3e');
   foliage.addColorStop(1,'#10282d');
   paintCtx.fillStyle=foliage;paintCtx.beginPath();
   paintCtx.moveTo(x0,h-10);
   paintCtx.lineTo(x0+side*reach*.38,h-11-(j%3));
   paintCtx.lineTo(x1,h+droop);
   paintCtx.lineTo(x0+side*reach*.58,h+droop-1);
   paintCtx.lineTo(x0+side*reach*.27,h+2);
   paintCtx.lineTo(x0,h);paintCtx.closePath();paintCtx.fill();
   if((j+Math.round(seed))%4!==0){
    paintCtx.strokeStyle='#deebec';paintCtx.lineWidth=1.7+(1-fraction)*.7;
    paintCtx.beginPath();paintCtx.moveTo(x0+side*3,h-9);
    paintCtx.quadraticCurveTo(x0+side*reach*.45,h-10,x0+side*reach*.84,h+droop*.36);
    paintCtx.stroke();
    paintCtx.fillStyle='#f2f7f6cc';paintCtx.beginPath();
    paintCtx.ellipse(x0+side*reach*.52,h-7,reach*.19,1.9,.12*side,0,PI*2);paintCtx.fill();
   }
  }
 }
 paintCtx.fillStyle='#edf6f1';paintCtx.beginPath();
 paintCtx.moveTo(lean-4,-118);paintCtx.lineTo(lean,-127);paintCtx.lineTo(lean+4,-119);
 paintCtx.closePath();paintCtx.fill();
 paintCtx.restore();
}

// 2. Natural mountain-integrated ledges
// Subtle crags, dwarf spruce, snow hummocks and frozen drip-lines are
// decorative geology only. Small enough to not look like reachable platforms.
function cliffMicroTerrain(i, L, R, T,paintCtx=ctx) {
 const w=R-L;
 paintCtx.save();
 for(let n=0;n<7;n++){
  const h=T+90+n*79+(n%3)*17;
  const frac=.30+(.50*((n*37+i*19)%17)/16);
  const x=L+frac*w;
  const rw=16+((n*13+i*17)%18);
  paintCtx.fillStyle=n%3?'#526d7c99':'#3d5c6bba';
  paintCtx.beginPath();paintCtx.moveTo(x-rw*.45,h+13);
  paintCtx.lineTo(x-rw*.32,h-7);paintCtx.lineTo(x-4,h-15-(n%3)*5);
  paintCtx.lineTo(x+rw*.37,h-9);paintCtx.lineTo(x+rw*.58,h+16);
  paintCtx.closePath();paintCtx.fill();
  paintCtx.fillStyle='#dbeef1cc';paintCtx.beginPath();
  paintCtx.moveTo(x-rw*.34,h-8);paintCtx.lineTo(x-5,h-18-(n%3)*5);
  paintCtx.lineTo(x+rw*.27,h-12);paintCtx.lineTo(x-1,h-11);paintCtx.closePath();paintCtx.fill();
  // Frosted windswept brush and exposed grass on some isolated pockets.
  if(n%3!==1){
   paintCtx.strokeStyle='#879f94a8';paintCtx.lineWidth=1.4;
   for(let g=0;g<4;g++){
    const gx=x+(g-1.5)*4;
    paintCtx.beginPath();paintCtx.moveTo(gx,h-11);
    paintCtx.quadraticCurveTo(gx+(g%2?4:-5),h-24,gx+(g%2?8:-7),h-28-(n%3)*2);
    paintCtx.stroke();
   }
   paintCtx.fillStyle='#c0d1d0c2';paintCtx.beginPath();
   paintCtx.ellipse(x,h-12,12,3,0,0,PI*2);paintCtx.fill();
  }
  if(n%4===0 && i!==0) pine(x+rw*.13,h-13,.22+((i+n)%3)*.045,paintCtx);
  if(n%5===2){
   paintCtx.strokeStyle='#b3e0e7a7';paintCtx.lineWidth=2.4;
   paintCtx.beginPath();paintCtx.moveTo(x+5,h+11);
   paintCtx.bezierCurveTo(x+3,h+25,x+11,h+47,x+7,h+57);
   paintCtx.stroke();
  }
 }
 paintCtx.restore();
}

// Rock buttress projected from the SAME cliff contour as the playable ledge.
// All geometry here is visual only; no surface/landing/collision edits.
function terraceButtressProfile(i,a,b,y){
 const width=b-a;
 // Shelf snow stays on the ACTUAL collision lip. Rock underneath runs
 // diagonally into the continuous mountain contour at several depths.
 const tip=a-5,depth=93+Math.min(29,width*.12);
 const face=mountainContourX(i,y+68);
 const rootFace=mountainContourX(i,y+depth+19);
 const rootDeep=mountainContourX(i,y+depth+54);
 const anchor=Math.max(face+32,rootFace+30,a+width*.57);
 return [
  [tip,y+7],[a+width*.13,y+3],[a+width*.37,y+8],
  [b-15,y+5],[b+6,y+13],[b+5,y+27],
  [anchor+32,y+59],[anchor+22,y+depth],
  [rootDeep+30,y+depth+54],[rootDeep-11,y+depth+57],
  [rootFace-17,y+depth+19],[face-12,y+70],
  [a+width*.34,y+57],[a+width*.12,y+40],[tip-7,y+20]
 ];
}

function drawSpire(i,paintCtx=ctx){
 const s = spires[i], L = s.summit[0], R = s.summit[1], T = s.summit[2], tiers = s.ledges;
 const bottom = 2100;
 paintCtx.save();
 // One continuous canyon-side contour, sampled from upper summit through
 // high / middle / low shelves. The face never detaches from a landing lip.
 paintCtx.beginPath();
 paintCtx.moveTo(mountainContourX(i,T+2),T+2);
 const crestSteps=Math.max(24,Math.round((R-L)/12));
 const ridgeCharacter=s.ridge?.character??.5;
 const ridgeRoughness=s.ridge?.roughness??1;
 // The fifth destination is a *towering* peak, not a flat platform with a
 // cave painted onto its side. The ice-cave entrance is far below its summit.
 const finalRidge=[[0,0],[.08,-1],[.13,-45],[.20,-105],[.24,-218],
  [.28,-310],[.315,-455],[.355,-600],[.38,-635],
  [.405,-524],[.44,-575],[.49,-405],[.54,-358],[.58,-230],
  [.64,-205],[.71,-85],[.78,-35],[.87,-9],[1,0]];
 const ridgeAt=(f)=>{
  for(let k=0;k<finalRidge.length-1;k++){
   const a=finalRidge[k],b=finalRidge[k+1];
   if(f<=b[0])return a[1]+(b[1]-a[1])*(f-a[0])/(b[0]-a[0]);
  }
  return 0;
 };
 for(let n=1;n<=crestSteps;n++){
  const f=n/crestSteps,x=L+(R-L)*f;
  const crag=(i===4 ? ridgeAt(f) :
   -(4+17*ridgeRoughness*Math.pow(Math.max(0,
     Math.sin(f*(14+ridgeCharacter*15)+i*3.7)),4))
   *(f>.21&&f<.86?1:0));
  // Broken wind-scoured crown rather than an unvaried ruler-straight top.
  // Keep the silhouette close to the actual flat, playable takeoff surface.
  const rough=4.1*Math.sin(f*71+i*3.7)+3.2*Math.sin(f*151+i);
  paintCtx.lineTo(x,T-2+crag+rough);
 }
 // Wind-cut outer flank recedes beneath its sheer summit lip. The lower
 // rock face is tapered and fractured rather than a rectangular vertical
 // wall; overshooting the crest still leaves clear open-air space.
 for(let y=T+23;y<bottom;y+=27){
  const depth=y-T;
  const recede=Math.min(i===4?95:175+ridgeCharacter*85,
   depth*(i===4?.075:.12+ridgeCharacter*.12));
  const stratified=Math.sin(depth*.0068+i)*Math.sin(depth*.0029+i*1.5)*22;
  const flank=R+14-recede+Math.sin(depth*.014+i)*18+
   Math.sin(depth*.047+i*2)*7+stratified;
  paintCtx.lineTo(flank,y);
 }
 paintCtx.lineTo(R-(i===4?80:188),bottom);
 paintCtx.lineTo(mountainContourX(i,bottom),bottom);
 for(let y=bottom-16;y>T+2;y-=14)paintCtx.lineTo(mountainContourX(i,y),y);
 paintCtx.closePath();
 paintCtx.clip();

 let rock = paintCtx.createLinearGradient(L - 100, T, R + 100, T + 500);
 rock.addColorStop(0, '#8499a6'); rock.addColorStop(.16, '#657b89'); rock.addColorStop(.44, '#485e70'); rock.addColorStop(.72, '#31495d'); rock.addColorStop(1, '#1a3145');
 paintCtx.fillStyle = rock; paintCtx.fillRect(L - 230, T - 30, R - L + 420, 2200);

 if(slateTexture.complete && slateTexture.naturalWidth){
  const pat = paintCtx.createPattern(slateTexture, 'repeat');
  paintCtx.save(); paintCtx.globalAlpha = .27;
  paintCtx.fillStyle = pat; paintCtx.fillRect(L - 290, T - 50, R - L + 500, 2200); paintCtx.restore();
 }

 // Fractured rock face detail
 let seed = i * 37 + 9;
 const rnd = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
 for(let k = 0; k < 105; k++){
  const x = L - 170 + rnd() * (R - L + 240), y = T + 20 + rnd() * 1280, d = 24 + rnd() * 110;
  paintCtx.beginPath(); paintCtx.moveTo(x, y); paintCtx.lineTo(x + d * .3, y - d * .2); paintCtx.lineTo(x + d * .4, y + d * .9); paintCtx.lineTo(x - d * .1, y + d * 1.45); paintCtx.closePath();
  paintCtx.fillStyle = k % 3 === 0 ? '#c3d1d810' : k % 3 === 1 ? '#081b2c26' : '#d2deea12'; paintCtx.fill();
 }
 for(let k = 0; k < 75; k++){
  const x = L - 40 + rnd() * (R - L + 50), y = T + rnd() * 1300;
  paintCtx.strokeStyle = rnd() > .4 ? '#091d2c66' : '#b2c5d031'; paintCtx.lineWidth = 1 + rnd() * 2;
  paintCtx.beginPath(); paintCtx.moveTo(x, y); paintCtx.lineTo(x - 7 + rnd() * 22, y + 18 + rnd() * 45); paintCtx.lineTo(x - 16 + rnd() * 24, y + 48 + rnd() * 40); paintCtx.stroke();
 }

 // Diagonal strata and exposed, snow-filled fissures connect ledges to the
 // single underlying rock face rather than making separate rectangular slabs.
 paintCtx.save();
 for(let band=0;band<14;band++){
  const by=T+64+band*80, bx=L+50+((band*137+i*79)%(R-L-110));
  paintCtx.strokeStyle=band%3===0?'#aec7d05c':'#102b3f65';
  paintCtx.lineWidth=5+band%4*3;paintCtx.lineCap='round';
  paintCtx.beginPath();paintCtx.moveTo(bx,by);
  paintCtx.bezierCurveTo(bx-32,by+35,bx+18,by+57,bx-16,by+95);paintCtx.stroke();
  if(band%3===0){
   paintCtx.strokeStyle='#dbeef180';paintCtx.lineWidth=3;paintCtx.beginPath();
   paintCtx.moveTo(bx-4,by+12);paintCtx.lineTo(bx-11,by+56);paintCtx.stroke();
  }
 }
 paintCtx.restore();

 // The final rock tower has angular facets and streaky snow on its long faces.
 if(i===4){
  paintCtx.fillStyle='#192f4485';paintCtx.beginPath();
  paintCtx.moveTo(L+308,T-575);paintCtx.lineTo(L+347,T-245);
  paintCtx.lineTo(L+580,T+410);paintCtx.lineTo(L+466,T+950);
  paintCtx.lineTo(L+375,T+180);paintCtx.closePath();paintCtx.fill();
  paintCtx.fillStyle='#acc1c560';paintCtx.beginPath();
  paintCtx.moveTo(L+310,T-575);paintCtx.lineTo(L+395,T-370);
  paintCtx.lineTo(L+414,T-168);paintCtx.lineTo(L+364,T-290);paintCtx.closePath();paintCtx.fill();
  // Diffuse rock cracks instead of large, floating white vertical streaks.
  for(const [dx,dy] of [[342,-432],[431,-248],[509,-100]]){
   paintCtx.strokeStyle='#95acb64d';paintCtx.lineWidth=2;
   paintCtx.beginPath();paintCtx.moveTo(L+dx,T+dy);
   paintCtx.lineTo(L+dx+13,T+dy+19);
   paintCtx.lineTo(L+dx+6,T+dy+38);paintCtx.stroke();
  }
 }
 // Snow tongues descend from real terrain shelves into broken cliff channels.
 for(const ledge of tiers){
  const x=ledge[0]+Math.min(30,(ledge[1]-ledge[0])*.30),y=ledge[2]+5;
  const len=86+(i*17+Math.floor(x))%88;
  const drape=paintCtx.createLinearGradient(x-16,y,x+26,y+len);
  drape.addColorStop(0,'#f1f8f7d9');drape.addColorStop(.5,'#a9d1db9f');
  drape.addColorStop(1,'#6b9ebc00');
  paintCtx.fillStyle=drape;paintCtx.beginPath();
  paintCtx.moveTo(x-10,y);paintCtx.quadraticCurveTo(x+19,y+34,x+3,y+len);
  paintCtx.quadraticCurveTo(x+27,y+len*.58,x+19,y+8);
  paintCtx.closePath();paintCtx.fill();
 }
 // Broad rock buttresses and fracture bands follow the continuous cliff mass.
 paintCtx.save();
 for(let n=0;n<6;n++){
  const y0=T+85+n*169, x0=mountainContourX(i,y0)+32;
  paintCtx.strokeStyle=n%2===0?'#132c3b44':'#b6c7ca25';
  paintCtx.lineWidth=8+n%3*4;paintCtx.lineCap='round';
  paintCtx.beginPath();paintCtx.moveTo(x0,y0);
  paintCtx.bezierCurveTo(x0+34,y0+50,x0+12,y0+105,x0+53,y0+145);
  paintCtx.stroke();
 }

 // All ice-coloured features here are climbable routes; don't paint
 // decorative frozen falls that masquerade as a second ice wall.
 paintCtx.restore();
 // Small crags remain clipped to the mountain rock face, never in the chasm.
 cliffMicroTerrain(i,L,R,T,paintCtx);
 paintCtx.restore();

 // Snow is adhered to real landing surfaces, not perched on detached slabs.
 const all = [[L, R, T], ...tiers.map(t=>[t[0],t[1],t[2]])];
 for(const [a,b,y] of all){
  const isSummit=Math.abs(y-T)<.01;
  const width=b-a;
  paintCtx.save();
  // Each natural terrace has thick, uneven bedrock *continuous with* the
  // cliff below. Snow covers the lip, rather than outlining a Mario shelf.
  // A stepped, irregular buttress grows back into the ACTUAL mountain face,
  // not a stand-alone trapezoid or a triangular slab with an empty underside.
  const rockPoints=terraceButtressProfile(i,a,b,y);
  const baseGrad=paintCtx.createLinearGradient(a,y,b,y+110);
  baseGrad.addColorStop(0,'#708895');
  baseGrad.addColorStop(.26,'#516c7d');
  baseGrad.addColorStop(.64,'#3d5767');
  baseGrad.addColorStop(1,'#304959');
  paintCtx.beginPath();
  rockPoints.forEach(([x,py],j)=>{
   if(j===0)paintCtx.moveTo(x,py);else paintCtx.lineTo(x,py);
  });
  paintCtx.closePath();paintCtx.fillStyle=baseGrad;paintCtx.fill();
  // Short inset facets and frost in fissures: the underside remains broken
  // rock, and joins the same underlying stratified mountain mass.
  paintCtx.save();paintCtx.clip();
  const w=width;
  paintCtx.fillStyle='#182f3b48';paintCtx.beginPath();
  paintCtx.moveTo(a+w*.40,y+16);
  paintCtx.lineTo(a+w*.69,y+33);
  paintCtx.lineTo(rockPoints[7][0]+2,rockPoints[7][1]+9);
  paintCtx.lineTo(a+w*.44,y+60);
  paintCtx.closePath();paintCtx.fill();
  paintCtx.fillStyle='#a8bdc326';paintCtx.beginPath();
  paintCtx.moveTo(a+w*.17,y+20);
  paintCtx.lineTo(a+w*.31,y+31);
  paintCtx.lineTo(a+w*.21,y+75);
  paintCtx.lineTo(a+w*.07,y+46);
  paintCtx.closePath();paintCtx.fill();
  paintCtx.strokeStyle='#9eb5bc73';paintCtx.lineWidth=2;
  paintCtx.beginPath();
  paintCtx.moveTo(a+w*.09,y+24);
  paintCtx.lineTo(a+w*.23,y+36);
  paintCtx.lineTo(a+w*.29,y+59);paintCtx.stroke();
  paintCtx.strokeStyle='#142c3c88';paintCtx.lineWidth=3;
  paintCtx.beginPath();
  paintCtx.moveTo(b-w*.18,y+15);
  paintCtx.lineTo(b-w*.30,y+51);
  paintCtx.lineTo(b-w*.34,y+66);paintCtx.stroke();
  // Fracture bands link the terrace underside to the same cliff, not a
  // separate shadow cutout or detached triangular 'platform' asset.
  const contourAt=mountainContourX(i,y+100);
  paintCtx.strokeStyle='#a4b6bb48';paintCtx.lineWidth=4.5;
  paintCtx.beginPath();paintCtx.moveTo(a+width*.37,y+24);
  paintCtx.bezierCurveTo(a+width*.43,y+58,contourAt-10,y+78,
   contourAt+29,y+121);paintCtx.stroke();
  paintCtx.restore();

  const cap=paintCtx.createLinearGradient(a,y-12,a,y+13);
  cap.addColorStop(0,'#ffffff');cap.addColorStop(.55,'#eaf5f9');
  cap.addColorStop(1,'#a1c5d2');
  paintCtx.fillStyle=cap;paintCtx.beginPath();
  paintCtx.moveTo(a-3,y-2);
  const steps=Math.max(6,Math.ceil(width/18));
  for(let q=0;q<=steps;q++){
   const f=q/steps, x=a+f*width;
   const drift=(isSummit?-6:-3)+ (Math.sin(f*18+i*2.6)+Math.sin(f*37+i*3.1))*(isSummit?2:1.3);
   paintCtx.lineTo(x,y+drift);
  }
  paintCtx.lineTo(b+2,y+2);
  for(let q=steps;q>=0;q--){
   const f=q/steps, x=a+f*width;
   const base=(isSummit?5:3.5)+Math.sin(f*13+i)*1.4;
   paintCtx.lineTo(x,y+base);
  }
  paintCtx.closePath();paintCtx.fill();
  paintCtx.strokeStyle='#faffffcc';paintCtx.lineWidth=1.5;
  paintCtx.beginPath();paintCtx.moveTo(a+4,y-6);paintCtx.quadraticCurveTo((a+b)/2,y-9,b-6,y-5);paintCtx.stroke();
  // Isolated naturally spaced icicles rather than an even picket fence.
  const icicles=Math.max(1,Math.floor(width/68));
  for(let q=0;q<icicles;q++){
   const f=(q+.29+Math.sin(q*2.7+i)*.16)/icicles;
   const x=a+f*width;
   const length=5+(q*7+i*3)%12;
   paintCtx.fillStyle='#bedee5b7';paintCtx.beginPath();
   paintCtx.moveTo(x-2,y+5);paintCtx.lineTo(x+2,y+5);
   paintCtx.lineTo(x,y+5+length);paintCtx.closePath();paintCtx.fill();
  }
  paintCtx.restore();
 }
 // Exposed far edge drop-off fissure
 if(tiers.length) for(const t of tiers){
  paintCtx.fillStyle = '#0d223577'; paintCtx.beginPath(); paintCtx.moveTo(t[1] + 2, t[2] + 9); paintCtx.lineTo(t[1] + 24, t[2] + 32); paintCtx.lineTo(t[1] + 9, t[2] + 86); paintCtx.lineTo(t[1] + 2, t[2] + 98); paintCtx.closePath(); paintCtx.fill();
 }
}

function drawCave(){
 const c=spires[4].cave,l=c.left,r=c.right,t=c.ceiling,b=c.floor,w=r-l;
 const geom=caveGeometry();
 ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
 // Raw split mountain stone, with an irregular dark opening in its side.
 ctx.fillStyle='#2b4555';ctx.beginPath();
 ctx.moveTo(l-80,b+80);ctx.lineTo(l-93,t+42);
 ctx.lineTo(l-55,t-30);ctx.lineTo(l-9,t-60);
 ctx.lineTo(l+w*.52,t-69);ctx.lineTo(r+42,t-39);
 ctx.lineTo(r+83,t+19);ctx.lineTo(r+75,b+82);ctx.closePath();ctx.fill();
 const mouth=()=>{
  ctx.beginPath();ctx.moveTo(l-23,b+13);
  ctx.lineTo(l-44,b-27);ctx.lineTo(l-35,b-72);
  ctx.lineTo(l-43,t+53);ctx.lineTo(l-25,t+25);
  ctx.lineTo(l+6,t+12);ctx.lineTo(l+29,t-8);
  ctx.lineTo(l+w*.35,t+5);ctx.lineTo(l+w*.48,t-22);
  ctx.lineTo(l+w*.69,t+5);ctx.lineTo(r-16,t-9);
  ctx.lineTo(r+8,t+14);ctx.lineTo(r+27,t+49);
  ctx.lineTo(r-4,b-37);ctx.lineTo(r-10,b+5);
  ctx.lineTo(r-12,b+14);ctx.lineTo(l+w*.67,b-5);
  ctx.lineTo(l+w*.45,b+7);ctx.lineTo(l+10,b+16);ctx.closePath();
 };
 mouth();ctx.fillStyle='#091c29';ctx.fill();
 ctx.save();mouth();ctx.clip();
 const stone=ctx.createLinearGradient(l-40,t+20,r+50,b+20);
 stone.addColorStop(0,'#254856');stone.addColorStop(.39,'#102b3b');
 stone.addColorStop(.75,'#091a2a');stone.addColorStop(1,'#091723');
 ctx.fillStyle=stone;ctx.fillRect(l-55,t-45,w+140,b-t+130);
 for(let k=0;k<18;k++){
  const x=l+((k*89+22)%Math.max(100,w));
  ctx.strokeStyle=k%3===0?'#aac5c04a':'#31506382';
  ctx.lineWidth=2+k%4;ctx.beginPath();
  ctx.moveTo(x,t+13+(k%3)*7);
  ctx.bezierCurveTo(x-21,t+40,x+17,b-80,x-8,b+17);ctx.stroke();
 }
 const glow=ctx.createRadialGradient(geom.fireX,b-20,1,geom.fireX,b-20,175);
 glow.addColorStop(0,'#ffdd9fb1');glow.addColorStop(.37,'#ed923c6d');
 glow.addColorStop(.8,'#bd5a1a1c');glow.addColorStop(1,'#bd5a1a00');
 ctx.fillStyle=glow;ctx.fillRect(l-40,t-28,w+130,b-t+110);
 ctx.restore();
 // Jagged broken bedrock projects above and below the natural mouth.
 for(let k=0;k<12;k++){
  const f=k/11,x=l-36+w*f+Math.sin(k*3.12)*11;
  const y=t-9+Math.sin(k*2.13)*12;
  ctx.fillStyle=k%2?'#4b6471':'#3d5969';
  ctx.beginPath();ctx.moveTo(x-21,y-13);
  ctx.lineTo(x-7,y+11);ctx.lineTo(x+4,y+30+k%4*5);
  ctx.lineTo(x+23,y+8);ctx.lineTo(x+15,y-20);ctx.closePath();ctx.fill();
 }
 ctx.fillStyle='#e6f2f2';ctx.beginPath();
 ctx.moveTo(l-72,t-28);ctx.lineTo(l-35,t-45);ctx.lineTo(l+9,t-41);
 ctx.lineTo(l+43,t-51);ctx.lineTo(l+w*.5,t-57);
 ctx.lineTo(r-22,t-44);ctx.lineTo(r+40,t-23);
 ctx.lineTo(r+17,t-20);ctx.lineTo(r-20,t-30);
 ctx.lineTo(l+w*.52,t-38);ctx.lineTo(l+6,t-28);
 ctx.lineTo(l-42,t-24);ctx.closePath();ctx.fill();
 for(let k=0;k<9;k++){
  const x=l+(k+1)*w/10,drop=8+(k*13)%34;
  ctx.fillStyle=k%2?'#a4d1da98':'#e4f6f8d8';
  ctx.beginPath();ctx.moveTo(x-3,t+1);ctx.lineTo(x+3,t+1);
  ctx.lineTo(x,t+drop);ctx.closePath();ctx.fill();
 }
 // Organic stone apron follows the collision floor.
 ctx.fillStyle='#536d7c';ctx.beginPath();
 ctx.moveTo(l-47,b+16);ctx.lineTo(l-12,b+7);
 ctx.lineTo(l+35,b+13);ctx.lineTo(l+w*.45,b+5);
 ctx.lineTo(r-29,b+11);ctx.lineTo(r+46,b+16);
 ctx.lineTo(r+55,b+47);ctx.lineTo(l-57,b+47);ctx.fill();
 const fx=geom.fireX,fy=b-14,flick=Math.sin(performance.now()*.012)*5;
 ctx.strokeStyle='#533426';ctx.lineWidth=6;ctx.beginPath();
 ctx.moveTo(fx-14,fy);ctx.lineTo(fx+16,fy+6);
 ctx.moveTo(fx+11,fy);ctx.lineTo(fx-12,fy+6);ctx.stroke();
 ctx.fillStyle='#f9a62a';ctx.beginPath();ctx.moveTo(fx-15,fy+5);
 ctx.quadraticCurveTo(fx-21,fy-23,fx+4,fy-43-flick);
 ctx.quadraticCurveTo(fx+20,fy-15,fx+12,fy+4);ctx.fill();
 ctx.fillStyle='#fff4b5';ctx.beginPath();ctx.moveTo(fx-5,fy+5);
 ctx.quadraticCurveTo(fx-8,fy-13,fx+5,fy-24);
 ctx.lineTo(fx+9,fy+5);ctx.fill();
 // The exposed back wall is now visible stone rather than a painted gap.
 // This agrees with the solid wallX used by the cave collision solver.
 ctx.fillStyle='#213c4ad9';ctx.beginPath();
 ctx.moveTo(geom.wallX+3,t+13);
 ctx.lineTo(geom.wallX+16,t+39);
 ctx.lineTo(r+24,t+63);
 ctx.lineTo(r+19,b+13);
 ctx.lineTo(geom.wallX+5,b+9);
 ctx.lineTo(geom.wallX+8,b-50);
 ctx.closePath();ctx.fill();
 ctx.strokeStyle='#9eb4bd44';ctx.lineWidth=2.4;ctx.beginPath();
 ctx.moveTo(geom.wallX+5,t+43);
 ctx.lineTo(geom.wallX+8,b-57);
 ctx.stroke();
 ctx.restore();
}

// Wider, irregular frozen cliff sections: a changing surface, NOT a
// continuous, rounded tube. This changes artwork only; iceClimbPoints()
// still owns the movement path and the existing Up/W climb behaviour.
function iceFaceWidths(t,spire,tier){
 const phase=spire*1.53+tier*2.31;
 const shoulder=.83+.17*Math.sin(Math.PI*t);
 const left=Math.max(20,(34+11*Math.sin(t*16.2+phase)+
  6*Math.sin(t*37.5+phase*.7))*shoulder);
 const right=Math.max(21,(36+13*Math.cos(t*12.4+phase*.8)+
  7*Math.sin(t*29.1+phase*1.2))*shoulder);
 return {left,right};
}
function drawIceClimb(i,paintCtx=ctx) {
 const routes=independentIceRoutes(i);
 for(const route of routes){
  const points=route.points;
  if(points.length<2)continue;
  const lower=points[0],upper=points.at(-1);
  // Never paint a bright ice cap 22 units ABOVE the snow-covered summit.
  // The gameplay centre reaches that height, but the ice artwork is buried
  // below the crest. A child branch stops where it meets its shared trunk.
  const surfaceTop=spires[i].summit[2]+16;
  const renderTop=Math.min(lower.y-12,
   route.sharedWith===null?surfaceTop:route.joinY+5);
  const visualUpper=icePositionAt(i,renderTop,route.tier);
  const height=Math.max(1,lower.y-renderTop);
  const sections=[];
  for(let y=lower.y;y>renderTop;y-=9){
   const t=(lower.y-y)/height;
   const at=icePositionAt(i,y,route.tier);
   const drift=2.7*Math.sin(y*.057+i*2.1+route.tier*1.9);
   sections.push({x:at.x+drift,y,t,...iceFaceWidths(t,i,route.tier)});
  }
  sections.push({x:visualUpper.x,y:renderTop,t:1,
   ...iceFaceWidths(1,i,route.tier)});
  // Uneven left and right margins; the outline is never a uniform-radius
  // tube and the frosted surface changes width independently on both sides.
  const outline=(leftRatio=1,rightRatio=1)=>{
   paintCtx.beginPath();
   sections.forEach((p,j)=>{
    const x=p.x-p.left*leftRatio;
    if(j===0)paintCtx.moveTo(x,p.y);else paintCtx.lineTo(x,p.y);
   });
   for(let j=sections.length-1;j>=0;j--){
    const p=sections[j];paintCtx.lineTo(p.x+p.right*rightRatio,p.y);
   }
   paintCtx.closePath();
  };
  paintCtx.save();
  paintCtx.lineJoin='round';paintCtx.lineCap='round';
  // Shadowed rock seams and translucent glaze tie the formation into the
  // underlying mountain. These are drawn into the cached terrain, not per frame.
  outline(1.10,1.10);
  paintCtx.fillStyle='#203d5070';paintCtx.fill();
  outline();
  const glacier=paintCtx.createLinearGradient(
   lower.x-65,lower.y,visualUpper.x+75,renderTop);
  glacier.addColorStop(0,'#477b8fad');
  glacier.addColorStop(.28,'#a9d8dfcc');
  glacier.addColorStop(.57,'#8bc4d1db');
  glacier.addColorStop(.82,'#d9eff0bc');
  glacier.addColorStop(1,'#608da3b2');
  paintCtx.fillStyle=glacier;paintCtx.fill();
  // A translucent inner ice sheet is irregular and broken up by rock, not
  // a solid cyan line following the entire playable route.
  outline(.53,.61);
  paintCtx.fillStyle='#b7e6e4a1';paintCtx.fill();
  // Embedded stone windows and diagonal cracks expose the rock beneath.
  const n=Math.max(3,Math.floor(height/44));
  for(let k=0;k<n;k++){
   const t=(k+.48)/n,y=lower.y-t*height;
   const p=icePositionAt(i,y,route.tier);
   const w=iceFaceWidths(t,i,route.tier);
   const side=(k+i+route.tier)%2===0?-1:1;
   const fx=p.x+side*(side<0?w.left:w.right)*.48;
   const reach=(side<0?w.left:w.right)*.52;
   paintCtx.fillStyle=k%3===0?'#3e6678a0':'#527b8b84';
   paintCtx.beginPath();
   paintCtx.moveTo(fx-side*reach*.23,y-12);
   paintCtx.lineTo(fx+side*reach*.83,y-6);
   paintCtx.lineTo(fx+side*reach*.63,y+14);
   paintCtx.lineTo(fx-side*reach*.12,y+21);
   paintCtx.closePath();paintCtx.fill();
   // Short individual frost fractures; no straight continuous centre stripe.
   paintCtx.strokeStyle=k%3===1?'#edfaff99':'#32677988';
   paintCtx.lineWidth=2.1+(k%3)*.5;
   paintCtx.beginPath();paintCtx.moveTo(p.x-side*7,y-14);
   paintCtx.lineTo(p.x+side*(11+k%4*4),y+1);
   paintCtx.lineTo(p.x+side*3,y+18);paintCtx.stroke();
  }
  // Individual frost deposits at the shelf entrance. Summit snowfall is
  // composited separately above the ice and over the cliff rim.
  for(const edge of [lower]){
   paintCtx.fillStyle='#e4f7f2b8';paintCtx.beginPath();
   paintCtx.moveTo(edge.x-21,edge.y+1);
   paintCtx.lineTo(edge.x-8,edge.y-8);
   paintCtx.lineTo(edge.x+6,edge.y-6);
   paintCtx.lineTo(edge.x+23,edge.y+2);
   paintCtx.lineTo(edge.x+9,edge.y-1);
   paintCtx.closePath();paintCtx.fill();
  }
  paintCtx.restore();
 }
}

/**
 * Snow is the FRONTMOST layer where frozen climbing faces reach the crest.
 * The shape is a scalloped wind-drift embedded into the existing summit snow
 * rather than a separate square ice topping. Drawn once into terrain cache.
 */

/**
 * Rock-backed shelf entry: the climb line finishes above the landing
 * surface (the player's feet are ~22 units below its route start).
 * Overlap the last icy face with the actual snow lip and a short rock
 * frost apron; never leave a visual gap or invent an extra platform.
 * This is static terrain art and is cached once per route.
 */
function drawIceShelfJoins(i,paintCtx=ctx){
 const routes=iceRouteNetwork(i);
 for(const route of routes){
  const ledge=spires[i].ledges[route.tier];
  if(!ledge)continue;
  const x=route.points[0].x,y=ledge[2];
  const maxLeft=Math.min(34,x-ledge[0]-5);
  const maxRight=Math.min(30,ledge[1]-x-5);
  if(maxLeft<6||maxRight<6)continue;
  paintCtx.save();
  const melt=paintCtx.createLinearGradient(x,y-32,x+8,y+52);
  melt.addColorStop(0,'#99cad1e3');
  melt.addColorStop(.34,'#d2edefe0');
  melt.addColorStop(.7,'#82b1bf98');
  melt.addColorStop(1,'#6a94a400');
  paintCtx.fillStyle=melt;paintCtx.beginPath();
  paintCtx.moveTo(x-maxLeft*.86,y-31);
  paintCtx.lineTo(x-maxLeft,y-6);
  paintCtx.lineTo(x-maxLeft*.59,y+7);
  paintCtx.lineTo(x-maxLeft*.30,y+22);
  paintCtx.lineTo(x-5,y+28);
  paintCtx.lineTo(x+maxRight*.25,y+25);
  paintCtx.lineTo(x+maxRight*.77,y+10);
  paintCtx.lineTo(x+maxRight*.94,y-10);
  paintCtx.lineTo(x+maxRight*.74,y-32);
  paintCtx.closePath();paintCtx.fill();
  const drift=paintCtx.createLinearGradient(x,y-12,x,y+16);
  drift.addColorStop(0,'#fbfffff0');
  drift.addColorStop(.5,'#e4f4f2ef');
  drift.addColorStop(1,'#c4dfe4a0');
  paintCtx.fillStyle=drift;paintCtx.beginPath();
  paintCtx.moveTo(x-maxLeft-9,y-6);
  paintCtx.quadraticCurveTo(x-maxLeft*.52,y-14,x-7,y-9);
  paintCtx.quadraticCurveTo(x+maxRight*.48,y-13,x+maxRight+7,y-4);
  paintCtx.lineTo(x+maxRight*.82,y+6);
  paintCtx.quadraticCurveTo(x,y+9,x-maxLeft*.86,y+7);
  paintCtx.closePath();paintCtx.fill();
  paintCtx.restore();
 }
}

function drawIceCrestSnow(i,paintCtx=ctx){
 const summitY=spires[i].summit[2];
 const routes=iceRouteNetwork(i).filter(route=>route.sharedWith===null);
 for(const route of routes){
  const tip=icePositionAt(i,summitY+16,route.tier);
  if(!tip)continue;
  const x=tip.x,span=iceFaceWidths(1,i,route.tier);
  const radius=Math.max(39,(span.left+span.right)*.46+9);
  const crest=paintCtx.createLinearGradient(x,summitY-16,x,summitY+60);
  crest.addColorStop(0,'#f6ffffed');
  crest.addColorStop(.31,'#e9f7fae0');
  crest.addColorStop(.64,'#badde5aa');
  crest.addColorStop(1,'#9dc5d000');
  paintCtx.save();
  paintCtx.beginPath();
  // Irregular upper snowcap follows the already-walkable level summit.
  paintCtx.moveTo(x-radius*.78,summitY-7);
  for(let n=0;n<=12;n++){
   const t=n/12,xx=x-radius*.78+t*radius*1.56;
   paintCtx.lineTo(xx,summitY-7-3*Math.sin(t*Math.PI)-
    2*Math.sin(t*19+i+route.tier));
  }
  // Snow feathers extend into the ice in uneven overlapping tongues.
  for(let n=12;n>=0;n--){
   const t=n/12,xx=x-radius*.78+t*radius*1.56;
   const feathers=(1-Math.abs(2*t-1));
   const lower=summitY+5+feathers*(13+5*Math.sin(t*17+i*2.1));
   paintCtx.lineTo(xx,lower);
  }
  paintCtx.closePath();paintCtx.fillStyle=crest;paintCtx.fill();
  paintCtx.strokeStyle='#f9ffffcb';paintCtx.lineWidth=2;
  paintCtx.beginPath();
  paintCtx.moveTo(x-radius*.7,summitY-8);
  paintCtx.quadraticCurveTo(x,summitY-17,x+radius*.72,summitY-8);
  paintCtx.stroke();
  // A few embedded snow/ice pockets break the artificial hard edge.
  for(let k=0;k<3;k++){
   const offset=(k-1)*radius*.35;
   paintCtx.fillStyle=k===1?'#edf8f1bf':'#e2f3f4aa';
   paintCtx.beginPath();
   paintCtx.moveTo(x+offset-9,summitY+10);
   paintCtx.lineTo(x+offset+4,summitY+14);
   paintCtx.lineTo(x+offset+11,summitY+26+(k%2)*8);
   paintCtx.lineTo(x+offset-3,summitY+20);
   paintCtx.closePath();paintCtx.fill();
  }
  paintCtx.restore();
 }
}

// One real campsite on the third peak: checkpoint geography is part of
// the same mountain summit collider, not a floating or separate level.
function drawFeaturedCampsite(){
 if(typeof featuredCampPosition!=='function')return;
 const point=featuredCampPosition(),x=point.x,y=point.y;
 ctx.save();
 ctx.fillStyle='#142b3b';ctx.beginPath();
 ctx.moveTo(x-67,y+1);ctx.lineTo(x-30,y-40);
 ctx.lineTo(x+17,y-4);ctx.lineTo(x+17,y+3);
 ctx.closePath();ctx.fill();
 const canvas=ctx.createLinearGradient(x-62,y-43,x+10,y+6);
 canvas.addColorStop(0,'#879287');canvas.addColorStop(.55,'#495b57');
 canvas.addColorStop(1,'#263c3a');
 ctx.fillStyle=canvas;ctx.beginPath();
 ctx.moveTo(x-68,y+1);ctx.lineTo(x-31,y-41);
 ctx.lineTo(x-6,y+1);ctx.closePath();ctx.fill();
 ctx.strokeStyle='#111e29';ctx.lineWidth=2.5;
 ctx.beginPath();ctx.moveTo(x-31,y-41);ctx.lineTo(x+16,y+2);
 ctx.moveTo(x-68,y+1);ctx.lineTo(x-6,y+1);ctx.stroke();
 ctx.fillStyle='#101d23';ctx.beginPath();
 ctx.moveTo(x-32,y-31);ctx.lineTo(x-11,y-2);ctx.lineTo(x-27,y-2);ctx.closePath();ctx.fill();
 const fx=x+49,fy=y-5;
 ctx.strokeStyle='#4d3021';ctx.lineWidth=4;ctx.beginPath();
 ctx.moveTo(fx-10,fy);ctx.lineTo(fx+11,fy+4);ctx.moveTo(fx+10,fy);ctx.lineTo(fx-8,fy+4);ctx.stroke();
 const flick=Math.sin(performance.now()*.01)*2;
 const glow=ctx.createRadialGradient(fx,fy-14,0,fx,fy-14,58);
 glow.addColorStop(0,'#f5ac3d5a');glow.addColorStop(1,'#f5ac3d00');
 ctx.fillStyle=glow;ctx.fillRect(fx-65,fy-79,130,100);
 ctx.fillStyle='#dc7731';ctx.beginPath();ctx.moveTo(fx-9,fy+1);
 ctx.quadraticCurveTo(fx-15,fy-14,fx+1,fy-27-flick);
 ctx.quadraticCurveTo(fx+12,fy-11,fx+9,fy+1);ctx.fill();
 ctx.fillStyle='#ffdd82';ctx.beginPath();ctx.moveTo(fx-3,fy+1);
 ctx.quadraticCurveTo(fx-7,fy-11,fx+3,fy-16);
 ctx.lineTo(fx+5,fy+1);ctx.fill();
 ctx.restore();
}

function drawCaveLadder() {
 const c=spires[4].cave, x=caveGeometry().ladderX;
 const startY=c.floor-7, endY=spires[4].summit[2]+10;
 // Actual tunnel corridor follows the SAME ladder X from cave floor to the
 // fifth peak. The player emerges at this X with no scripted lateral slide.
 ctx.save();
 const tunnel=ctx.createLinearGradient(x-34,endY,x+38,startY);
 tunnel.addColorStop(0,'#152c3c');tunnel.addColorStop(.35,'#081724');
 tunnel.addColorStop(1,'#162e3b');
 ctx.fillStyle=tunnel;ctx.beginPath();
 ctx.moveTo(x-28,startY+20);ctx.lineTo(x-32,startY-35);
 ctx.lineTo(x-25,c.ceiling+4);ctx.lineTo(x-27,endY-3);
 ctx.lineTo(x-12,endY-18);ctx.lineTo(x+15,endY-18);
 ctx.lineTo(x+29,endY-4);ctx.lineTo(x+25,c.ceiling+4);
 ctx.lineTo(x+30,startY+20);ctx.closePath();ctx.fill();
 ctx.strokeStyle='#76949d65';ctx.lineWidth=3;
 ctx.beginPath();ctx.moveTo(x-26,startY+15);
 ctx.lineTo(x-23,c.ceiling+4);ctx.lineTo(x-27,endY-3);ctx.stroke();
 ctx.beginPath();ctx.moveTo(x+27,startY+15);
 ctx.lineTo(x+25,c.ceiling+4);ctx.lineTo(x+29,endY-3);ctx.stroke();
 ctx.restore();
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 // Brushed steel rails and ice-encrusted wall brackets.
 ctx.strokeStyle='#203746';ctx.lineWidth=9;
 ctx.beginPath();ctx.moveTo(x-13,startY);ctx.lineTo(x-13,endY);
 ctx.moveTo(x+13,startY);ctx.lineTo(x+13,endY);ctx.stroke();
 ctx.strokeStyle='#9eb1ba';ctx.lineWidth=4.2;
 ctx.beginPath();ctx.moveTo(x-13,startY);ctx.lineTo(x-13,endY);
 ctx.moveTo(x+13,startY);ctx.lineTo(x+13,endY);ctx.stroke();
 for(let y=startY-10;y>=endY;y-=19){
  ctx.strokeStyle='#344957';ctx.lineWidth=7;
  ctx.beginPath();ctx.moveTo(x-14,y);ctx.lineTo(x+14,y);ctx.stroke();
  ctx.strokeStyle='#ced9d9';ctx.lineWidth=3.5;
  ctx.beginPath();ctx.moveTo(x-13,y-2);ctx.lineTo(x+13,y-2);ctx.stroke();
  if(Math.round(y)%3===0){
   ctx.fillStyle='#f2f8f9';ctx.fillRect(x-15,y-4,4,2);
  }
 }
 for(let y=startY-22;y>endY;y-=64){
  ctx.strokeStyle='#6c858e';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(x+13,y);ctx.lineTo(x+27,y+5);ctx.stroke();
 }
 ctx.restore();
}

function drawClimbingRoutes(i){
 if(i===4) drawCaveLadder();
 else if(i>0) drawIceClimb(i);
}

// Rear/three-quarter wall-facing silhouette on ice. This temporary painted
// overlay masks the front-facing sprite's facial detail until the planned
// full character asset overhaul; weight transfer uses the same climbBeat
// distance as the axes, so resting stops ALL climbing motion immediately.
function drawClimberWallFacing(beat){
 const step=Math.sin(beat*Math.PI*.72),shift=step*2.2;
 ctx.save();ctx.translate(shift,0);
 ctx.fillStyle='#78212f';ctx.beginPath();ctx.ellipse(0,-72,13,12,0,0,PI*2);ctx.fill();
 ctx.fillStyle='#bf3c47';ctx.beginPath();
 ctx.moveTo(-17,-61);ctx.quadraticCurveTo(-19,-43,-14,-26);
 ctx.lineTo(13,-26);ctx.quadraticCurveTo(20,-44,17,-61);
 ctx.quadraticCurveTo(0,-65,-17,-61);ctx.fill();
 ctx.fillStyle='#8d2f40';ctx.beginPath();
 ctx.roundRect(-10,-55,20,26,5);ctx.fill();
 ctx.strokeStyle='#e17d72';ctx.lineWidth=2.1;
 ctx.beginPath();ctx.moveTo(-12,-54);ctx.lineTo(-7,-33);
 ctx.moveTo(12,-54);ctx.lineTo(7,-33);ctx.stroke();
 ctx.strokeStyle='#482d34';ctx.lineWidth=3;ctx.beginPath();
 ctx.moveTo(-14,-31);ctx.lineTo(13,-31);ctx.stroke();
 ctx.restore();
}
function drawIcePicks(){
 if(!p.climb || !p.climb.isIce)return;
 // Continuous alternation tied to actual climbing distance; release Up and
 // the cycle freezes, so there's no perpetual flailing when resting.
 const beat=p.climb.climbBeat*Math.PI*.72;
 const wall=icePositionAt(p.climb.spire,p.y,p.climb.tierIndex)?.x ?? p.x;
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 for(const side of [-1,1]){
  const phase=beat+(side===1?Math.PI:0);
  const reach=Math.sin(phase)*.72;
  const hx=p.x+side*12, hy=p.y-24-reach*3;
  const tx=wall+side*5, ty=p.y-42-reach*9;
  // Glove follows the shaft; tip is embedded in the ice band.
  ctx.strokeStyle='#24343c';ctx.lineWidth=3.6;
  ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(tx,ty);ctx.stroke();
  ctx.strokeStyle='#bed0d3';ctx.lineWidth=2.5;
  ctx.beginPath();ctx.moveTo(tx-side*9,ty-4);
  ctx.quadraticCurveTo(tx+side*3,ty-9,tx+side*9,ty+2);ctx.stroke();
  ctx.fillStyle='#1d262e';ctx.beginPath();ctx.arc(hx,hy,3.1,0,PI*2);ctx.fill();
  // Alternating boots and ice-crampon spikes actually touch the wall.
  const footY=p.y+12+reach*5, footX=wall+side*(9+reach);
  ctx.strokeStyle='#17232d';ctx.lineWidth=6;
  ctx.beginPath();ctx.moveTo(p.x+side*8,p.y+2);
  ctx.lineTo(footX,footY);ctx.stroke();
  ctx.strokeStyle='#d3e0e5';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(footX-side*5,footY+1);
  ctx.lineTo(footX+side*2,footY+5);ctx.stroke();
 }
 ctx.restore();
}

function decorate(i,paintCtx=ctx){
 const summit=spires[i].summit, top=summit[2], l=summit[0], w=summit[1]-l;
 // Distinct landscape identities for the four crossings and final cavern.
 const treeLayouts=[
  [[.09,2.8],[.18,2.25],[.76,3.0],[.90,2.35]],
  [[.14,2.75],[.81,2.15]],
  [[.17,1.8],[.84,2.2],[.92,1.55]],
  [[.82,2.85]],
  [[.73,2.15],[.88,1.55]]
 ];
 for(const [f,size] of treeLayouts[i]) pine(l+f*w,top-8,size,paintCtx);
 if(i>0 && i<4){
  const tiers=spires[i].ledges;
  for(const [idx,ledge] of tiers.entries()){
   if(idx%2!==0)continue;
   const width=ledge[1]-ledge[0];
   if(width>110) pine(ledge[0]+19+(i%2)*7,ledge[2]-7,.66+(i%3)*.11,paintCtx);
  }
 }
 if(i===2||i===3){
  paintCtx.save();
  for(let k=0;k<4;k++){
   const x=l+w*(.28+k*.125),sz=12+(k*7+i*3)%18;
   paintCtx.fillStyle=k%2===0?'#597688':'#3c5c6d';
   paintCtx.beginPath();paintCtx.moveTo(x-sz,top+1);
   paintCtx.lineTo(x-sz*.3,top-sz*.95);
   paintCtx.lineTo(x+sz*.35,top-sz*.65);
   paintCtx.lineTo(x+sz*.68,top);paintCtx.closePath();paintCtx.fill();
   paintCtx.strokeStyle='#eaf6f9';paintCtx.lineWidth=3;
   paintCtx.beginPath();paintCtx.moveTo(x-sz*.8,top-sz*.14);
   paintCtx.lineTo(x-sz*.25,top-sz*.86);paintCtx.stroke();
  }
  paintCtx.restore();
 }
}

// Hand-carried shepherd's staff: same material length as the planted pole.
// The small backward tail means it reads as a full wooden stick, not a yellow spear.
function restingStaffEnds(gripX, gripY, direction, materialLength) {
 const tilt = 0.15, rear = 36, dx = (direction < 0 ? -1 : 1) * Math.cos(tilt), dy = -Math.sin(tilt);
 return {
  start: {x:gripX - dx * rear, y:gripY - dy * rear},
  end: {x:gripX + dx * (materialLength - rear), y:gripY + dy * (materialLength - rear)}
 };
}

// Consistent weathered wooden shaft for both the carried and the bending state.
// Only paints the existing points; vault motion, reach and spring physics are untouched.
// Produce a curved pole whose sampled MATERIAL ARC LENGTH stays fixed.
// The physical hand separation is limited to the available pole length;
// no longer draw a stretched straight shaft at extreme launch poses.
function vaultStaffArc(ax,ay,handX,handY,materialLength){
 const dx=handX-ax,dy=handY-ay,chord=Math.hypot(dx,dy);
 const scale=chord>materialLength?materialLength/chord:1;
 const px=ax+dx*scale,py=ay+dy*scale,
  ux=chord<1e-5?0:-(py-ay)/Math.max(1,chord*scale),
  uy=chord<1e-5?-1:(px-ax)/Math.max(1,chord*scale);
 const sample=(curvature,t)=>{
  const cx1=ax+(px-ax)*.28+ux*curvature,cy1=ay+(py-ay)*.28+uy*curvature;
  const cx2=ax+(px-ax)*.72+ux*curvature,cy2=ay+(py-ay)*.72+uy*curvature;
  const r=1-t;
  return {x:r*r*r*ax+3*r*r*t*cx1+3*r*t*t*cx2+t*t*t*px,
   y:r*r*r*ay+3*r*r*t*cy1+3*r*t*t*cy2+t*t*t*py};
 };
 const lengthOf=bend=>{
  let old=sample(bend,0),length=0;
  for(let i=1;i<=64;i++){
   const next=sample(bend,i/64);
   length+=Math.hypot(next.x-old.x,next.y-old.y);old=next;
  }
  return length;
 };
 let lo=0,hi=Math.max(400,materialLength*3),bend=0;
 if(lengthOf(0)<materialLength-1e-5){
  for(let i=0;i<18;i++){
   const mid=(lo+hi)*.5;
   if(lengthOf(mid)>materialLength)hi=mid;else lo=mid;
  }
  bend=(lo+hi)*.5;
 }
 const points=[];
 for(let i=0;i<=40;i++)points.push(sample(bend,i/40));
 return points;
}
function paintWoodenStaff(points, gripFraction) {
 if(points.length < 2) return;
 ctx.save(); ctx.lineCap='round'; ctx.lineJoin='round';
 const sections=points.length-1;
 for(let k=1;k<=sections;k++){
  const from=points[k-1], to=points[k], t=(k-.5)/sections;
  const thickness=6.5-1.7*t+0.2*Math.sin(t*27);
  ctx.beginPath(); ctx.moveTo(from.x,from.y);ctx.lineTo(to.x,to.y);
  ctx.strokeStyle='#463226';ctx.lineWidth=thickness+1.3;ctx.stroke();
  ctx.strokeStyle=k%7===0?'#876144':'#a17a55';
  ctx.lineWidth=thickness;ctx.stroke();
  ctx.strokeStyle='#d7b48a90';ctx.lineWidth=Math.max(0.9,thickness*.19);ctx.stroke();
 }
 // Subtle grain follows the shaft and never looks like repeated bright yellow bands.
 for(let k=3;k<sections-2;k+=5){
  const a=points[k], b=points[Math.min(sections,k+2)];
  ctx.strokeStyle=k%3===0?'#5238298c':'#d3aa7c80'; ctx.lineWidth=.95;
  ctx.beginPath();ctx.moveTo(a.x,a.y-1.4);ctx.lineTo(b.x,b.y-1.4);ctx.stroke();
 }
 // A short, worn leather hand-grip reinforces the shepherd's-staff appearance.
 const pos=Math.max(1,Math.min(sections-2,Math.round(sections*gripFraction)));
 for(let z=-1;z<=1;z++){
  const at=pos+z, a=points[Math.max(0,at-1)], b=points[Math.min(sections,at+1)];
  const t=points[at], d=Math.hypot(b.x-a.x,b.y-a.y)||1;
  const nx=-(b.y-a.y)/d, ny=(b.x-a.x)/d;
  ctx.strokeStyle=z===0?'#4b3529':'#674637';ctx.lineWidth=2.2;
  ctx.beginPath();ctx.moveTo(t.x-nx*3.3,t.y-ny*3.3);
  ctx.lineTo(t.x+nx*3.3,t.y+ny*3.3);ctx.stroke();
 }
 ctx.restore();
}

// Static terrain, held in a small, true LRU cache. The old two-canvas
// mobile cache could evict a mountain that was STILL visible, causing an
// expensive full re-raster on each subsequent frame while standing still.
const terrainCache=new Map();
const renderStats={
 terrainBuilds:0,terrainHits:0,terrainEvictions:0,terrainBytes:0,
 backdropBuilds:0,backdropBytes:0
};
const backdropCache={image:null,key:''};
let cachedRouteSeed=-1;
function invalidateTerrainCache(){
 terrainCache.clear();cachedRouteSeed=-1;renderStats.terrainBytes=0;
 backdropCache.image=null;backdropCache.key='';renderStats.backdropBytes=0;
}
function mountainCache(i){
 if(cachedRouteSeed!==routeSeed){terrainCache.clear();
  cachedRouteSeed=routeSeed;renderStats.terrainBytes=0;}
 if(terrainCache.has(i)){
  const cached=terrainCache.get(i);
  // Mark as recently used; never evict a mountain repeatedly at rest.
  terrainCache.delete(i);terrainCache.set(i,cached);
  renderStats.terrainHits++;
  return cached;
 }
 const s=spires[i], xs=[s.summit[0]-260,...s.ledges.map(t=>t[0]-150)];
 if(s.cave)xs.push(s.cave.left-230);
 const left=Math.min(...xs),right=s.summit[1]+210;
 const top=s.summit[2]-(i===4?760:420),bottom=2125;
 const width=right-left,height=bottom-top;
 // Mobile auto gets a sharper foreground raster, not a sharper/upscaled
 // distant background. Larger mountain sheets remain capped per dimension.
 const scale=graphicsQuality==='low'?.42:
  graphicsQuality==='high'?1:(innerWidth<950?.72:.88);
 const maxAxis=graphicsQuality==='high'?2600:(innerWidth<950?2304:1800);
 const pixelScale=Math.min(1,scale,maxAxis/Math.max(width,height));
 const image=document.createElement('canvas');
 image.width=Math.ceil(width*pixelScale);image.height=Math.ceil(height*pixelScale);
 const off=image.getContext('2d',{alpha:true});
 if(!off)return null;
 off.setTransform(pixelScale,0,0,pixelScale,-left*pixelScale,-top*pixelScale);
 drawSpire(i,off);
 if(i>0&&i<4){drawIceClimb(i,off);drawIceShelfJoins(i,off);drawIceCrestSnow(i,off);}
 decorate(i,off);
 const data={image,left,top,width,height,bytes:image.width*image.height*4};
 terrainCache.set(i,data);renderStats.terrainBuilds++;
 renderStats.terrainBytes+=data.bytes;
 // Three nearby mountains may be on screen at once in portrait mode.
 // Keep them resident, with a hard memory budget for low-memory phones.
 const max=innerWidth<950?3:4;
 const maxBytes=(innerWidth<950?40:88)*1024*1024;
 while(terrainCache.size>max||
   (terrainCache.size>1&&renderStats.terrainBytes>maxBytes)){
  const key=terrainCache.keys().next().value;
  const removed=terrainCache.get(key);
  terrainCache.delete(key);
  renderStats.terrainBytes-=removed.bytes;
  renderStats.terrainEvictions++;
 }
 return data;
}
function backdropTexture(w,h){
 if(!mountainBackdrop.complete||!mountainBackdrop.naturalWidth)return null;
 const iw=mountainBackdrop.naturalWidth,ih=mountainBackdrop.naturalHeight;
 const rect=backdropViewport(iw,ih,w,h,0,0);
 const scale=graphicsQuality==='low'?.7:
  graphicsQuality==='high'?1:(innerWidth<950?.94:1);
 const width=Math.max(1,Math.ceil(rect.width*scale));
 const height=Math.max(1,Math.ceil(rect.height*scale));
 const key=[iw,ih,w,h,width,height,graphicsQuality].join(':');
 if(backdropCache.key!==key||!backdropCache.image){
  const image=document.createElement('canvas');
  image.width=width;image.height=height;
  const off=image.getContext('2d',{alpha:false});
  if(!off)return null;
  off.drawImage(mountainBackdrop,0,0,width,height);
  backdropCache.image=image;backdropCache.key=key;
  renderStats.backdropBytes=width*height*4;
  renderStats.backdropBuilds++;
 }
 return backdropCache.image;
}

// Aspect-preserving cover with *bounded continuous* parallax. No modulo,
// tile wrap, camera seam or brief empty strip on the first sprint.
function backdropViewport(iw,ih,w,h,cameraX,cameraY){
 const scale=Math.max(w/iw,h/ih)*1.17;
 const width=iw*scale,height=ih*scale;
 const px=Math.min((width-w)*.47,Math.max(-(width-w)*.47,cameraX*.012));
 const py=Math.min((height-h)*.42,Math.max(-(height-h)*.42,cameraY*.006));
 return {x:(w-width)/2-px,y:(h-height)/2-py,width,height};
}

function draw(){
 const w = innerWidth, h = innerHeight, zoom = getZoom();
 const targetX = p.x - .28 * w / zoom, targetY = p.y - .56 * h / zoom;
 camera.x += (targetX - camera.x) * .055; camera.y += (targetY - camera.y) * .045;
 ctx.fillStyle = '#6d91ab'; ctx.fillRect(0,0,w,h);
 
 if(mountainBackdrop.complete && mountainBackdrop.naturalWidth){
  const rect=backdropViewport(mountainBackdrop.naturalWidth,
    mountainBackdrop.naturalHeight,w,h,camera.x,camera.y);
  const reduced=backdropTexture(w,h);
  // Reuse a bounded raster at display resolution rather than resampling
  // the multi-megapixel source JPG on every animation frame.
  ctx.drawImage(reduced||mountainBackdrop,rect.x,rect.y,rect.width,rect.height);
 }
 let fg = ctx.createLinearGradient(0, h * .40, 0, h);
 fg.addColorStop(0, '#d6e4f000'); fg.addColorStop(.76, '#bfd5e344'); fg.addColorStop(1, '#b3c7d488');
 ctx.fillStyle = fg; ctx.fillRect(0, h * .4, w, h * .6);
 
 ctx.fillStyle = '#344f6680';
 const rearScroll=camera.x*.07, firstRear=Math.floor(rearScroll/275)-2;
 for(let i = firstRear; i < firstRear+Math.ceil(w/275)+5; i++){
  const x = i * 275 - rearScroll, top = h * .62 + Math.sin(i * 2.4) * 44;
  ctx.beginPath(); ctx.moveTo(x - 36, h); ctx.lineTo(x - 20, top + 30); ctx.lineTo(x - 8, top + 8); ctx.lineTo(x, top); ctx.lineTo(x + 18, top + 16); ctx.lineTo(x + 36, h); ctx.closePath(); ctx.fill();
 }
 
 ctx.fillStyle = '#f6fbffe0'; const sec = performance.now() * .001;
 for(let n=0;n<snow.length;n+=(graphicsQuality==='low'?3:innerWidth<700?2:1)){
  const f=snow[n];
  let sx = ((f.x * w + sec * (8 + f.speed * 12) - camera.x * .02) % (w + 30) + w + 30) % (w + 30);
  let sy = ((f.y * h + sec * (10 + f.speed * 13)) % (h + 20));
  ctx.beginPath(); ctx.arc(sx, sy, f.r, 0, PI * 2); ctx.fill();
 }
 
 ctx.strokeStyle = '#f6fbff70'; ctx.lineWidth = 1;
 for(let j = 0; j < 32; j++){
  const xx = ((j * 97 + sec * 55 + camera.x * .022) % (w + 40) + w + 40) % (w + 40);
  const yy = ((j * 53 + sec * (34 + j % 5 * 7)) % (h + 40));
  ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx + 7, yy - 2); ctx.stroke();
 }
 
 ctx.save(); ctx.scale(zoom, zoom); ctx.translate(-camera.x, -camera.y);
 for(let i=0;i<spires.length;i++){
  const s=spires[i].summit;
  const nearLeft=i===4?Math.min(s[0],spires[4].cave.left-230):Math.min(s[0],...spires[i].ledges.map(t=>t[0]));
  // Avoid spending the first interactive frame rasterising an entire
  // off-screen mountain because a few pixels of its approach shelf touch
  // the extreme right border. Lazy cache it once substantially visible.
  if((s[1]-camera.x)*zoom<-220||(nearLeft-camera.x)*zoom>w-50)continue;
  const chunk=mountainCache(i);
  if(chunk)ctx.drawImage(chunk.image,chunk.left,chunk.top,chunk.width,chunk.height);
  else {
   drawSpire(i);
   if(i>0&&i<4){drawIceClimb(i);drawIceShelfJoins(i);drawIceCrestSnow(i);}
   decorate(i);
  }
 }
 if((spires[4].cave.right-camera.x)*zoom>-200&&(spires[4].cave.left-camera.x)*zoom<w+200)drawCave();
 if((spires[4].cave.right-camera.x)*zoom>-200&&(spires[4].cave.left-camera.x)*zoom<w+200)drawCaveLadder();
 if(typeof featuredCampPosition==='function'){
  const campsite=featuredCampPosition();
  if((campsite.x-camera.x)*zoom>-120&&
    (campsite.x-camera.x)*zoom<w+120)drawFeaturedCampsite();
 }
 
 // PB ghost shares the existing world transform; no canvas or terrain reraster.
 if(typeof ghostPositionAt==='function'){
  const ghost=ghostPositionAt();
  if(ghost){
   ctx.save();ctx.globalAlpha=.30;
   if(climberSheet.complete&&climberSheet.naturalWidth){
    ctx.translate(ghost[1],ghost[2]+22);
    ctx.scale(ghost[4]<0?-1:1,1);
    ctx.drawImage(climberSheet,ghost[3]*200,0,200,256,-39,-93,78,100);
   }else{
    ctx.fillStyle='#8be4e9';ctx.fillRect(ghost[1]-9,ghost[2]-30,18,48);
   }
   ctx.restore();
  }
 }
 
   if(trail.length > 2){
  ctx.strokeStyle = '#ffd69b78'; ctx.lineWidth = 2; ctx.setLineDash([5, 6]);
  ctx.beginPath(); trail.forEach((v, i) => i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y)); ctx.stroke(); ctx.setLineDash([]);
 }
 
 if(p.vault){
  const shaft=vaultStaffArc(p.anchorX,p.anchorY,p.x+3,p.y-5,cfg.poleLength);
  paintWoodenStaff(shaft,.88);
  ctx.fillStyle='#293b43';ctx.beginPath();
  ctx.arc(p.anchorX,p.anchorY,5.2,0,PI*2);ctx.fill();
 } else if(p.state !== 'CLIMBING'){
  // Match the 195-world-unit pole used by the physics engine at rest.
  const ends=restingStaffEnds(p.x,p.y-13,p.facingDir,cfg.poleLength);
  const shaft=[];
  for(let q=0;q<=24;q++){
   const t=q/24;
   shaft.push({x:ends.start.x+(ends.end.x-ends.start.x)*t,
               y:ends.start.y+(ends.end.y-ends.start.y)*t});
  }
  paintWoodenStaff(shaft,36/cfg.poleLength);
 }
 
 // Stable slow stride cycle, with limited neighbouring-frame interpolation.
 const running=isGround() && Math.abs(p.vx)>30;
 const step=(p.runDistance||0)/55;
 const phase=Math.floor(step)%8;
 const pose=p.state==='CLIMBING' ? 11
  : p.vault?9:(p.state==='AIRBORNE'||p.state==='FALLING')?10
  :running?phase:8;
 if(climberSheet.complete && climberSheet.naturalWidth){
  ctx.save(); ctx.translate(p.x, p.y + 22); ctx.scale(p.facingDir < 0 ? -1 : 1, 1);
  const athletic = p.state === 'RUNNING' && Math.abs(p.vx)>90;
  if(athletic){ctx.translate(0,-1);ctx.rotate(.032*Math.sign(p.facingDir));}
  if(p.state==='CLIMBING' && p.climb?.isIce){
   const phase=(p.climb.climbBeat||0)*Math.PI;
   ctx.translate(Math.sin(phase)*1.5,Math.cos(phase)*.7);
   ctx.rotate(Math.sin(phase)*.018);
  }
  if(p.state==='CLIMBING'&&p.climb?.isIce)ctx.scale(.88,1.04);
  ctx.drawImage(climberSheet, pose*200, 0, 200, 256, -39, -93, 78, 100);
  if(p.state==='CLIMBING'&&p.climb?.isIce)
   drawClimberWallFacing(p.climb.climbBeat);
  // Avoid ghosted/doubled hats: never alpha-overlay mismatched sprite frames.
  ctx.restore();
 } else {
  ctx.fillStyle = '#bb3947'; ctx.fillRect(p.x - 10, p.y - 30, 20, 50);
 }
 if(p.state === 'CLIMBING' && p.climb?.isIce) drawIcePicks();
 ctx.restore();


 // Occasional larger flakes in front of the mountaineer; all particle motion
 // is time-driven, not keyed to discrete scrolling tiles.
 const frontCount=graphicsQuality==='low'?14:innerWidth<700?26:46;
 ctx.fillStyle='#f6ffffd9';
 for(let n=0;n<frontCount;n++){
  const velocity=38+(n%7)*11, swirl=Math.sin(sec*1.6+n*3.7)*12;
  const fx=((n*107.7+sec*velocity+swirl)%(w+30)+(w+30))%(w+30)-15;
  const fy=((n*199.3+sec*(velocity*.88))%(h+22)+(h+22))%(h+22)-11;
  ctx.globalAlpha=.22+(n%5)*.095;
  ctx.beginPath();ctx.arc(fx,fy,n%9===0?2.3:1.15,0,PI*2);ctx.fill();
 }
 ctx.globalAlpha=1;

 // Avoid repeated DOM mutations that can trigger style/layout work
 // dozens of times each second even when standing absolutely still.
 const nearRungs=p.state==='CLIMBING'||(isGround()&&
  ['ledge','cave'].includes(currentPlatform()?.kind)&&
  Math.abs(p.x-climbEntryX(currentPlatform()))<45);
 const upControl=document.getElementById('up');
 if(upControl.hidden===nearRungs)upControl.hidden=!nearRungs;
 const downControl=document.getElementById('down');
 const surface=isGround()?currentPlatform():null;
 let canDown=p.state==='CLIMBING';
 if(surface?.spire>0&&surface?.spire<4){
  const routes=iceRouteNetwork(surface.spire);
  if(surface.kind==='summit'){
   canDown=routes.some(route=>Math.abs(p.x-route.points.at(-1).x)<=28);
  }else if(surface.kind==='ledge'){
   const tier=Number(surface.id.split('-')[1]),entryX=climbEntryX(surface);
   canDown=routes.some(route=>route.sharedWith===tier &&
    Math.abs(p.x-entryX)<=28 &&
    Math.abs(iceXOnPath(route.points,surface.top-22)-entryX)<=28);
  }
 }
 if(downControl.hidden===canDown)downControl.hidden=!canDown;
 const meterDisplay=p.vault?'block':'none';
 if(meter.style.display!==meterDisplay)meter.style.display=meterDisplay;
 if(p.vault)needle.style.left=Math.min(100,p.vault.elapsed/p.vault.rideDuration*100)+'%';
 const stageText=completed?'ASCENT COMPLETE':
  `FIVE PEAKS · PEAK ${Math.min(atStage+1,5)} / 5 · ${leapTitles[Math.min(atStage,3)]}`;
 if(stageEl.textContent!==stageText)stageEl.textContent=stageText;
 const status=completed?'Checkpoint reached.':p.state==='CLIMBING'?
  (p.climb?.isIce?'ALTERNATE A / D OR ◀ ▶ TO SCRAMBLE · W STEADY · S DOWN':
   'Hold ↑ through rock tunnel · Release to rest'):
  `Speed ${Math.round(Math.abs(p.vx))} · ${p.state.toLowerCase().replaceAll('_',' ')}`;
 if(subEl.textContent!==status)subEl.textContent=status;
 if(typeof updateTrialHud==='function')updateTrialHud();
 const timerEl=document.getElementById('timer'),timeLabel=formatTime(elapsed);
 if(timerEl.textContent!==timeLabel)timerEl.textContent=timeLabel;
}


