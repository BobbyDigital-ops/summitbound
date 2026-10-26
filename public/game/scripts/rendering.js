// Summit Leap v0.8.3 — extracted unchanged from v0.8.1.
// Irregular, wind-sculpted conifers: branching silhouettes with broken snow
// deposits instead of stacked symmetric triangle/Christmas-tree sprites.
function pine(cx,ground,s,paintCtx=ctx){
 paintCtx.save();paintCtx.translate(cx,ground);paintCtx.scale(s,s);
 if(alpineFirSprite.complete&&alpineFirSprite.naturalWidth){
  paintCtx.drawImage(alpineFirSprite,-35,-130,70,130);
  paintCtx.restore();return;
 }
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
 for(let n=0;n<12;n++){
  const h=T+90+n*79+(n%3)*17;
  const frac=.20+(.65*((n*37+i*19)%17)/16);
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
 if(alpineScrubSprite.complete&&alpineScrubSprite.naturalWidth){
  for(const f of [.22,.49,.76]){
   const x=L+(R-L)*f,y=T+210+f*380;
   paintCtx.drawImage(alpineScrubSprite,x-38,y-25,76,36);
  }
 }
 paintCtx.restore();
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
   -(4+17*Math.pow(Math.max(0,Math.sin(f*18+i*3.7)),4))
   *(f>.21&&f<.86?1:0));
  const rough=2.9*Math.sin(f*71+i*3.7)+2.6*Math.sin(f*151+i);
  paintCtx.lineTo(x,T-2+crag+rough);
 }
 // Wind-cut rear face: no artificial vertical grey rectangle wall.
 for(let y=T+23;y<bottom;y+=27){
  const depth=y-T;
  const flank=R+8+Math.sin(depth*.013+i)*19+Math.sin(depth*.041+i*2)*7+Math.min(38,depth*.022);
  paintCtx.lineTo(flank,y);
 }
 paintCtx.lineTo(R+41,bottom);
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
  for(const d of [[L+307,T-566,105],[L+372,T-485,120],
                  [L+440,T-305,130],[L+525,T-150,170]]){
   paintCtx.strokeStyle='#ecf7f5a6';paintCtx.lineWidth=4;paintCtx.beginPath();
   paintCtx.moveTo(d[0],d[1]);paintCtx.bezierCurveTo(d[0]+17,d[1]+27,
   d[0]-8,d[1]+d[2]*.48,d[0]+26,d[1]+d[2]);paintCtx.stroke();
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

 // Frozen falls: seasonal ice glazed over fractures, not additional climb paths.
 if(i===1||i===3||i===4){
  const falls=i===4
   ?[{x:L+585,y:T-175,length:650,width:43},{x:L+735,y:T+90,length:390,width:22}]
   :[{x:L+(R-L)*(i===1?.62:.77),y:T+12,length:i===1?395:510,width:i===1?33:46}];
  for(const fall of falls){
   const {x,y,length,width}=fall;
   const ice=paintCtx.createLinearGradient(x-width,y,x+width,y);
   ice.addColorStop(0,'#729eae00');ice.addColorStop(.23,'#b8e6ead2');
   ice.addColorStop(.52,'#effbffeb');ice.addColorStop(.77,'#88c8dacc');
   ice.addColorStop(1,'#4f879900');
   paintCtx.fillStyle=ice;paintCtx.beginPath();
   paintCtx.moveTo(x-width*.45,y);paintCtx.quadraticCurveTo(x-width,y+length*.24,x-width*.37,y+length*.5);
   paintCtx.bezierCurveTo(x-width*.75,y+length*.7,x-width*.30,y+length*.91,x-3,y+length);
   paintCtx.lineTo(x+width*.29,y+length*.9);
   paintCtx.bezierCurveTo(x+width*.8,y+length*.70,x+width*.35,y+length*.3,x+width*.43,y);
   paintCtx.closePath();paintCtx.fill();
   for(let g=0;g<4;g++){
    const sx=x-width*.28+g*width*.17;
    paintCtx.strokeStyle=g%2===0?'#eff9ffbf':'#4a91acaa';
    paintCtx.lineWidth=g%2===0?2.4:3.2;paintCtx.beginPath();
    paintCtx.moveTo(sx,y+15);paintCtx.bezierCurveTo(sx+8,y+length*.35,
     sx-10,y+length*.63,sx+6,y+length*.89);paintCtx.stroke();
   }
  }
 }
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
  const baseGrad=paintCtx.createLinearGradient(a,y,b,y+96);
  baseGrad.addColorStop(0,'#718794');baseGrad.addColorStop(.34,'#536a79');
  baseGrad.addColorStop(1,'#203849');
  paintCtx.fillStyle=baseGrad;paintCtx.beginPath();
  paintCtx.moveTo(a-5,y+2);
  paintCtx.lineTo(a+width*.27,y+6+Math.sin(a)*3);
  paintCtx.lineTo(b-3,y+2);paintCtx.lineTo(b+2,y+17);
  paintCtx.lineTo(b-width*.12,y+26+(i%3)*5);
  paintCtx.lineTo(b-width*.3,y+44);
  paintCtx.lineTo(a+width*.58,y+51+(i%2)*19);
  paintCtx.lineTo(a+width*.25,y+88);
  paintCtx.lineTo(a+width*.11,y+51);paintCtx.lineTo(a-9,y+14);
  paintCtx.closePath();paintCtx.fill();
  paintCtx.strokeStyle='#9db5bc6b';paintCtx.lineWidth=2;
  paintCtx.beginPath();paintCtx.moveTo(a+11,y+20);
  paintCtx.lineTo(a+width*.36,y+32);paintCtx.lineTo(a+width*.43,y+59);paintCtx.stroke();
  paintCtx.strokeStyle='#102b3c99';paintCtx.lineWidth=4;
  paintCtx.beginPath();paintCtx.moveTo(b-width*.20,y+14);
  paintCtx.lineTo(b-width*.30,y+47);paintCtx.lineTo(b-width*.36,y+57);paintCtx.stroke();

  const cap=paintCtx.createLinearGradient(a,y-12,a,y+13);
  cap.addColorStop(0,'#ffffff');cap.addColorStop(.55,'#eaf5f9');
  cap.addColorStop(1,'#a1c5d2');
  paintCtx.fillStyle=cap;paintCtx.beginPath();
  paintCtx.moveTo(a-3,y-2);
  const steps=Math.max(6,Math.ceil(width/18));
  for(let q=0;q<=steps;q++){
   const f=q/steps, x=a+f*width;
   const drift=-6+(Math.sin(f*18+i*2.6)+Math.sin(f*37+i*3.1))*(isSummit?2:1.5);
   paintCtx.lineTo(x,y+drift);
  }
  paintCtx.lineTo(b+2,y+2);
  for(let q=steps;q>=0;q--){
   const f=q/steps, x=a+f*width;
   const base=4+Math.sin(f*13+i)*2.2+(isSummit?2:6*Math.pow(Math.sin(Math.PI*f),2));
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
  ctx.lineTo(r+18,b-37);ctx.lineTo(r+32,b+5);
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
 const glow=ctx.createRadialGradient(r-36,b-20,1,r-36,b-20,185);
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
 const fx=r-37,fy=b-14,flick=Math.sin(performance.now()*.012)*5;
 ctx.strokeStyle='#533426';ctx.lineWidth=6;ctx.beginPath();
 ctx.moveTo(fx-14,fy);ctx.lineTo(fx+16,fy+6);
 ctx.moveTo(fx+11,fy);ctx.lineTo(fx-12,fy+6);ctx.stroke();
 ctx.fillStyle='#f9a62a';ctx.beginPath();ctx.moveTo(fx-15,fy+5);
 ctx.quadraticCurveTo(fx-21,fy-23,fx+4,fy-43-flick);
 ctx.quadraticCurveTo(fx+20,fy-15,fx+12,fy+4);ctx.fill();
 ctx.fillStyle='#fff4b5';ctx.beginPath();ctx.moveTo(fx-5,fy+5);
 ctx.quadraticCurveTo(fx-8,fy-13,fx+5,fy-24);
 ctx.lineTo(fx+9,fy+5);ctx.fill();
 ctx.restore();
}

// 4. One frozen ice ascent per outdoor mountain; a single steel ladder in the cave.
function drawIceClimb(i) {
 const routes=independentIceRoutes(i);
 for(const route of routes){
 const points=route.points;
 if(points.length<2)continue;
 const lower = points[0], upper = points[points.length-1];
 const left = [], right = [], mid = [];
 for (let y = lower.y; y >= upper.y; y -= 8) {
  const pos = icePositionAt(i,y,route.tier);
  const jag = Math.sin(y * .093 + i * 2.1) * 2.3 + Math.sin(y * .23) * 1.5;
  mid.push({x:pos.x + jag, y});
 }
 mid.push({x:upper.x,y:upper.y});
 for (const pos of mid) {
  const drift = Math.sin(pos.y * .08 + i) * 3;
  left.push({x:pos.x-23 + drift,y:pos.y});
  right.push({x:pos.x+21 + drift*.5,y:pos.y});
 }
 ctx.save();
 ctx.lineJoin='round'; ctx.lineCap='round';
 // Rock-to-ice seam: a continuous band fused into the mountain face.
 ctx.beginPath(); left.forEach((p,j)=>j?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
 right.slice().reverse().forEach(p=>ctx.lineTo(p.x,p.y));
 ctx.closePath(); ctx.fillStyle='#092d429c';ctx.fill();
 ctx.strokeStyle='#21455899';ctx.lineWidth=5;ctx.stroke();
 const ice=ctx.createLinearGradient(lower.x-25,0,lower.x+35,0);
 ice.addColorStop(0,'#527d92d8');ice.addColorStop(.3,'#b8f0f4db');
 ice.addColorStop(.58,'#73cbd9cc');ice.addColorStop(1,'#2a6e8ab8');
 ctx.beginPath();
 mid.forEach((p,j)=>j?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
 ctx.strokeStyle=ice;ctx.lineWidth=34;ctx.stroke();
 ctx.beginPath();
 mid.forEach((p,j)=>j?ctx.lineTo(p.x-9,p.y):ctx.moveTo(p.x-9,p.y));
 ctx.strokeStyle='#e6fbff91';ctx.lineWidth=4;ctx.stroke();
 // Embedded angular ice crystal veins, not ladder rungs.
 for(let y=lower.y-17, n=0; y>upper.y+12; y-=24,n++){
  const here=icePositionAt(i,y,route.tier);
  const sign=n%2===0 ? -1 : 1;
  ctx.strokeStyle=n%3===0?'#e7fbffc9':'#123c57a8';
  ctx.lineWidth=n%3===0?2.5:1.9;
  ctx.beginPath();ctx.moveTo(here.x+sign*4,y-11);
  ctx.lineTo(here.x+sign*(12+n%3*3),y+2);
  ctx.lineTo(here.x+sign*7,y+12);ctx.stroke();
  if(n%3===1){
   ctx.fillStyle='#e9ffffd5';ctx.beginPath();
   ctx.moveTo(here.x-1,y-4);ctx.lineTo(here.x+5,y+2);
   ctx.lineTo(here.x,y+8);ctx.lineTo(here.x-4,y+2);ctx.fill();
  }
 }
 // Mark the places where the frozen route meets each landing terrace.
 for(const point of points.slice(0,-1)){
  ctx.strokeStyle='#d7f8f9cf';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(point.x-17,point.y-2);
  ctx.lineTo(point.x-9,point.y-12);
  ctx.moveTo(point.x+13,point.y-1);ctx.lineTo(point.x+5,point.y-10);ctx.stroke();
 }
 ctx.restore();
 }
}

function drawCaveLadder() {
 const c=spires[4].cave, x=c.right-25;
 const startY=c.floor-7, endY=c.ceiling+18; // Cave-only metal rungs
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

function drawIcePicks(){
 if(!p.climb || !p.climb.isIce)return;
 // Continuous alternation tied to actual climbing distance; release Up and
 // the cycle freezes, so there's no perpetual flailing when resting.
 const beat=p.climb.climbBeat*Math.PI;
 const wall=icePositionAt(p.climb.spire,p.y,p.climb.tierIndex)?.x ?? p.x;
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 for(const side of [-1,1]){
  const phase=beat+(side===1?Math.PI:0);
  const reach=Math.sin(phase);
  const hx=p.x+side*12, hy=p.y-24-reach*3;
  const tx=wall+side*7, ty=p.y-47-reach*11;
  // Glove follows the shaft; tip is embedded in the ice band.
  ctx.strokeStyle='#24343c';ctx.lineWidth=3.6;
  ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(tx,ty);ctx.stroke();
  ctx.strokeStyle='#bed0d3';ctx.lineWidth=2.5;
  ctx.beginPath();ctx.moveTo(tx-side*9,ty-4);
  ctx.quadraticCurveTo(tx+side*3,ty-9,tx+side*9,ty+2);ctx.stroke();
  ctx.fillStyle='#1d262e';ctx.beginPath();ctx.arc(hx,hy,3.1,0,PI*2);ctx.fill();
  // Alternating boots and ice-crampon spikes actually touch the wall.
  const footY=p.y+12+reach*6, footX=wall+side*(9+reach*1.8);
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
  for(const idx of [0,2]){
   const ledge=tiers[idx],width=ledge[1]-ledge[0];
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

// Static mountain artwork is rasterised once per route at a bounded internal
// resolution. Redraw only moving snow, character, fire and input feedback.
// Retain at most two high-cost canvases on mobile to limit memory pressure.
const terrainCache=new Map();
let cachedRouteSeed=-1;
function invalidateTerrainCache(){terrainCache.clear();cachedRouteSeed=-1;}
function mountainCache(i){
 if(cachedRouteSeed!==routeSeed){terrainCache.clear();cachedRouteSeed=routeSeed;}
 if(terrainCache.has(i))return terrainCache.get(i);
 const s=spires[i], xs=[s.summit[0]-260,...s.ledges.map(t=>t[0]-150)];
 if(s.cave)xs.push(s.cave.left-230);
 const left=Math.min(...xs),right=s.summit[1]+210;
 const top=s.summit[2]-(i===4?760:420),bottom=2125;
 const width=right-left,height=bottom-top;
 const pixelScale=Math.min(1,innerWidth<950?.60:.88,1800/Math.max(width,height));
 const image=document.createElement('canvas');
 image.width=Math.ceil(width*pixelScale);image.height=Math.ceil(height*pixelScale);
 const off=image.getContext('2d',{alpha:true});
 if(!off)return null;
 off.setTransform(pixelScale,0,0,pixelScale,-left*pixelScale,-top*pixelScale);
 drawSpire(i,off);decorate(i,off);
 const data={image,left,top,width,height};
 terrainCache.set(i,data);
 const max=innerWidth<950?2:3;
 while(terrainCache.size>max)terrainCache.delete(terrainCache.keys().next().value);
 return data;
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
  ctx.drawImage(mountainBackdrop,rect.x,rect.y,rect.width,rect.height);
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
 for(const f of snow){
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
  const nearLeft=i===4?Math.min(s[0],spires[4].cave.left-230):Math.min(s[0],...s.ledges.map(t=>t[0]));
  if((s[1]-camera.x)*zoom<-220||(nearLeft-camera.x)*zoom>w+220)continue;
  const chunk=mountainCache(i);
  if(chunk)ctx.drawImage(chunk.image,chunk.left,chunk.top,chunk.width,chunk.height);
  else {drawSpire(i);decorate(i);}
 }
 if((spires[4].cave.right-camera.x)*zoom>-200&&(spires[4].cave.left-camera.x)*zoom<w+200)drawCave();
 for(let i=1;i<spires.length;i++){
  const s=spires[i].summit;
  if((s[1]-camera.x)*zoom<-180||(s[0]-camera.x)*zoom>w+180)continue;
  drawClimbingRoutes(i);
 }

  if(trail.length > 2){
  ctx.strokeStyle = '#ffd69b78'; ctx.lineWidth = 2; ctx.setLineDash([5, 6]);
  ctx.beginPath(); trail.forEach((v, i) => i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y)); ctx.stroke(); ctx.setLineDash([]);
 }
 
 if(p.vault){
  const ax = p.anchorX, ay = p.anchorY, px = p.x + 3, py = p.y - 5;
  const dx = px - ax, dy = py - ay, chord = Math.hypot(dx, dy) || 1;
  const nx = -dy / chord, ny = dx / chord, L = cfg.poleLength;
  const curveLen = (bend) => {
   let lx = ax, ly = ay, total = 0;
   const cx1 = ax + (px - ax) * .28 + nx * bend, cy1 = ay + (py - ay) * .28 + ny * bend;
   const cx2 = ax + (px - ax) * .72 + nx * bend, cy2 = ay + (py - ay) * .72 + ny * bend;
   for(let i = 1; i <= 24; i++){
    let t = i / 24, r = 1 - t;
    let x = r * r * r * ax + 3 * r * r * t * cx1 + 3 * r * t * t * cx2 + t * t * t * px;
    let y = r * r * r * ay + 3 * r * r * t * cy1 + 3 * r * t * t * cy2 + t * t * t * py;
    total += Math.hypot(x - lx, y - ly); lx = x; ly = y;
   }
   return total;
  };
  let low = 0, high = 400;
  for(let k = 0; k < 13; k++){
   let mid = (low + high) / 2;
   if(curveLen(mid) > L) high = mid; else low = mid;
  }
  const bend = (low + high) / 2, cx1 = ax + (px - ax) * .28 + nx * bend, cy1 = ay + (py - ay) * .28 + ny * bend, cx2 = ax + (px - ax) * .72 + nx * bend, cy2 = ay + (py - ay) * .72 + ny * bend;
  const shaft=[{x:ax,y:ay}];
  for(let q=1;q<=30;q++){
   const t=q/30, r=1-t;
   shaft.push({
    x:r*r*r*ax+3*r*r*t*cx1+3*r*t*t*cx2+t*t*t*px,
    y:r*r*r*ay+3*r*r*t*cy1+3*r*t*t*cy2+t*t*t*py
   });
  }
  paintWoodenStaff(shaft,.88);
  ctx.fillStyle = '#293b43'; ctx.beginPath(); ctx.arc(ax, ay, 5.2, 0, PI * 2); ctx.fill();
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
 
 const pose = p.state === 'STEP_OFF' ? (Math.floor(sec * 10) % 8) : p.state === 'CLIMBING' ? (Math.floor((p.climb?.climbBeat || 0) / 2) % 2 ? 12 : 11) : p.vault ? 9 : (p.state === 'AIRBORNE' || p.state === 'FALLING') ? 10 : Math.abs(p.vx) > 18 ? Math.floor((p.runDistance || 0) / 45) % 8 : 8;
 if(climberSheet.complete && climberSheet.naturalWidth){
  ctx.save(); ctx.translate(p.x, p.y + 22); ctx.scale(p.facingDir < 0 ? -1 : 1, 1);
  const athletic = p.state === 'RUNNING' && Math.abs(p.vx)>90;
  if(athletic){ctx.translate(0,-1);ctx.rotate(.032*Math.sign(p.facingDir));}
  if(p.state==='CLIMBING' && p.climb?.isIce){
   const phase=(p.climb.climbBeat||0)*Math.PI;
   ctx.translate(Math.sin(phase)*1.5,Math.cos(phase)*.7);
   ctx.rotate(Math.sin(phase)*.018);
  }
  ctx.drawImage(climberSheet, pose * 200, 0, 200, 256, -39, -93, 78, 100); ctx.restore();
 } else {
  ctx.fillStyle = '#bb3947'; ctx.fillRect(p.x - 10, p.y - 30, 20, 50);
 }
 if(p.state === 'CLIMBING' && p.climb?.isIce) drawIcePicks();
 ctx.restore();


 // Occasional larger flakes in front of the mountaineer; all particle motion
 // is time-driven, not keyed to discrete scrolling tiles.
 const frontCount=46;
 ctx.fillStyle='#f6ffffd9';
 for(let n=0;n<frontCount;n++){
  const velocity=38+(n%7)*11, swirl=Math.sin(sec*1.6+n*3.7)*12;
  const fx=((n*107.7+sec*velocity+swirl)%(w+30)+(w+30))%(w+30)-15;
  const fy=((n*199.3+sec*(velocity*.88))%(h+22)+(h+22))%(h+22)-11;
  ctx.globalAlpha=.22+(n%5)*.095;
  ctx.beginPath();ctx.arc(fx,fy,n%9===0?2.3:1.15,0,PI*2);ctx.fill();
 }
 ctx.globalAlpha=1;

 // Check rung proximity for Climb up button & hint
 const rungXTarget = climbEntryX;
 const nearRungs = p.state === 'CLIMBING' || (isGround() && ['ledge','cave'].includes(currentPlatform()?.kind) && Math.abs(p.x - rungXTarget(currentPlatform())) < 45);
 document.getElementById('up').hidden = !nearRungs;

 meter.style.display = p.vault ? 'block' : 'none';
 if(p.vault) needle.style.left = Math.min(100, p.vault.elapsed / p.vault.rideDuration * 100) + '%';
 stageEl.textContent = completed ? 'ASCENT COMPLETE' : `LEAP ${Math.min(atStage + 1, 4)} / 4 · ${leapTitles[Math.min(atStage,3)]}`;
 let status = completed ? 'Checkpoint reached.' : p.state === 'CLIMBING' ? (p.climb?.isIce ? 'Hold ↑ to ice climb · Release to rest' : 'Hold ↑ on cave ladder · Release to rest') : p.state === 'STEP_OFF' ? 'Stepping onto the summit' : `Speed ${Math.round(Math.abs(p.vx))} · ${p.state.toLowerCase().replaceAll('_', ' ')}`;
 subEl.textContent = status;
 document.getElementById('timer').textContent = formatTime(elapsed);
}


