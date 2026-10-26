// Summit Leap v0.8.3 — extracted unchanged from v0.8.1.
function pine(cx, ground, s){
 ctx.save(); ctx.translate(cx, ground); ctx.scale(s, s);
 const seed = (cx*1.3 + ground*.9) % 999;
 ctx.strokeStyle = '#332f30'; ctx.lineWidth = 3.1; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,-104); ctx.stroke();
 for(let j=0; j<8; j++){
  const y = -18-j*10, reach = (26-j*2.5);
  for(const sign of [-1, 1]){
   const lean = reach * (1 + Math.sin(j*2.8 + seed)*.11);
   ctx.strokeStyle = '#203f40'; ctx.lineWidth = 4.6-j*.25; ctx.beginPath(); ctx.moveTo(0, y-9);
   ctx.quadraticCurveTo(sign*lean*.42, y-4, sign*lean, y+5); ctx.stroke();
   ctx.fillStyle = j%2===0 ? '#1d4a47' : '#294b4d'; ctx.beginPath(); ctx.moveTo(0, y-14);
   ctx.quadraticCurveTo(sign*lean*.62, y-18, sign*lean, y+3);
   ctx.quadraticCurveTo(sign*lean*.30, y+2, 0, y-1); ctx.fill();
   ctx.strokeStyle = '#e5f2f1'; ctx.lineWidth = 2.1; ctx.lineCap = 'round';
   ctx.beginPath(); ctx.moveTo(sign*2, y-13); ctx.quadraticCurveTo(sign*lean*.55, y-14, sign*lean*.8, y); ctx.stroke();
  }
 }
 ctx.restore();
}

// 2. Natural mountain-integrated ledges
function drawSpire(i){
 const s = spires[i], L = s.summit[0], R = s.summit[1], T = s.summit[2], tiers = s.ledges;
 const bottom = 2100;
 ctx.save();
 // One continuous canyon-side contour, sampled from upper summit through
 // high / middle / low shelves. The face never detaches from a landing lip.
 ctx.beginPath();
 ctx.moveTo(mountainContourX(i,T+2),T+2);
 const crestSteps=Math.max(10,Math.round((R-L)/28));
 for(let n=1;n<=crestSteps;n++){
  const f=n/crestSteps, x=L+(R-L)*f;
  const uneven=2.2*Math.sin(f*19+i*2.3)+1.1*Math.sin(f*43+i);
  ctx.lineTo(x,T-2+uneven);
 }
 // Wind-cut rear face: no artificial vertical grey rectangle wall.
 for(let y=T+23;y<bottom;y+=27){
  const depth=y-T;
  const flank=R+8+Math.sin(depth*.013+i)*19+Math.sin(depth*.041+i*2)*7+Math.min(38,depth*.022);
  ctx.lineTo(flank,y);
 }
 ctx.lineTo(R+41,bottom);
 ctx.lineTo(mountainContourX(i,bottom),bottom);
 for(let y=bottom-16;y>T+2;y-=14)ctx.lineTo(mountainContourX(i,y),y);
 ctx.closePath();
 ctx.clip();

 let rock = ctx.createLinearGradient(L - 100, T, R + 100, T + 500);
 rock.addColorStop(0, '#8499a6'); rock.addColorStop(.16, '#657b89'); rock.addColorStop(.44, '#485e70'); rock.addColorStop(.72, '#31495d'); rock.addColorStop(1, '#1a3145');
 ctx.fillStyle = rock; ctx.fillRect(L - 230, T - 30, R - L + 420, 2200);

 if(slateTexture.complete && slateTexture.naturalWidth){
  const pat = ctx.createPattern(slateTexture, 'repeat');
  ctx.save(); ctx.globalAlpha = .69;
  ctx.fillStyle = pat; ctx.fillRect(L - 290, T - 50, R - L + 500, 2200); ctx.restore();
 }

 // Fractured rock face detail
 let seed = i * 37 + 9;
 const rnd = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
 for(let k = 0; k < 105; k++){
  const x = L - 170 + rnd() * (R - L + 240), y = T + 20 + rnd() * 1280, d = 24 + rnd() * 110;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + d * .3, y - d * .2); ctx.lineTo(x + d * .4, y + d * .9); ctx.lineTo(x - d * .1, y + d * 1.45); ctx.closePath();
  ctx.fillStyle = k % 3 === 0 ? '#c3d1d810' : k % 3 === 1 ? '#081b2c26' : '#d2deea12'; ctx.fill();
 }
 for(let k = 0; k < 75; k++){
  const x = L - 40 + rnd() * (R - L + 50), y = T + rnd() * 1300;
  ctx.strokeStyle = rnd() > .4 ? '#091d2c66' : '#b2c5d031'; ctx.lineWidth = 1 + rnd() * 2;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 7 + rnd() * 22, y + 18 + rnd() * 45); ctx.lineTo(x - 16 + rnd() * 24, y + 48 + rnd() * 40); ctx.stroke();
 }
 // Broad rock buttresses and fracture bands follow the continuous cliff mass.
 ctx.save();
 for(let n=0;n<6;n++){
  const y0=T+85+n*169, x0=mountainContourX(i,y0)+32;
  ctx.strokeStyle=n%2===0?'#132c3b44':'#b6c7ca25';
  ctx.lineWidth=8+n%3*4;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(x0,y0);
  ctx.bezierCurveTo(x0+34,y0+50,x0+12,y0+105,x0+53,y0+145);
  ctx.stroke();
 }
 ctx.restore();
 ctx.restore();

 // Snow is adhered to real landing surfaces, not perched on detached slabs.
 const all = [[L, R, T], ...tiers.map(t=>[t[0],t[1],t[2]])];
 for(const [a,b,y] of all){
  const isSummit=Math.abs(y-T)<.01;
  const width=b-a;
  ctx.save();
  // Low-relief sedimentary stone immediately beneath the snow.
  ctx.fillStyle='#142b3c9b';
  ctx.beginPath();ctx.moveTo(a+3,y+4);
  ctx.quadraticCurveTo(a+width*.5,y+12,b-4,y+6);
  ctx.quadraticCurveTo(b-width*.18,y+19,a+width*.21,y+33);
  ctx.lineTo(a+5,y+12);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#74909d8c';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(a+14,y+24);
  ctx.quadraticCurveTo(a+width*.35,y+34,b-width*.21,y+15);ctx.stroke();

  const cap=ctx.createLinearGradient(a,y-12,a,y+13);
  cap.addColorStop(0,'#ffffff');cap.addColorStop(.55,'#eaf5f9');
  cap.addColorStop(1,'#a1c5d2');
  ctx.fillStyle=cap;ctx.beginPath();
  ctx.moveTo(a-3,y-2);
  const steps=Math.max(6,Math.ceil(width/18));
  for(let q=0;q<=steps;q++){
   const f=q/steps, x=a+f*width;
   const drift=-6+(Math.sin(f*18+i*2.6)+Math.sin(f*37+i*3.1))*(isSummit?2:1.5);
   ctx.lineTo(x,y+drift);
  }
  ctx.lineTo(b+2,y+2);
  for(let q=steps;q>=0;q--){
   const f=q/steps, x=a+f*width;
   const base=5+Math.sin(f*13+i)*1.6+(isSummit?1:0);
   ctx.lineTo(x,y+base);
  }
  ctx.closePath();ctx.fill();
  ctx.strokeStyle='#faffffcc';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(a+4,y-6);ctx.quadraticCurveTo((a+b)/2,y-9,b-6,y-5);ctx.stroke();
  // Isolated naturally spaced icicles rather than an even picket fence.
  const icicles=Math.max(1,Math.floor(width/68));
  for(let q=0;q<icicles;q++){
   const f=(q+.29+Math.sin(q*2.7+i)*.16)/icicles;
   const x=a+f*width;
   const length=5+(q*7+i*3)%12;
   ctx.fillStyle='#bedee5b7';ctx.beginPath();
   ctx.moveTo(x-2,y+5);ctx.lineTo(x+2,y+5);
   ctx.lineTo(x,y+5+length);ctx.closePath();ctx.fill();
  }
  ctx.restore();
 }
 // Exposed far edge drop-off fissure
 if(tiers.length) for(const t of tiers){
  ctx.fillStyle = '#0d223577'; ctx.beginPath(); ctx.moveTo(t[1] + 2, t[2] + 9); ctx.lineTo(t[1] + 24, t[2] + 32); ctx.lineTo(t[1] + 9, t[2] + 86); ctx.lineTo(t[1] + 2, t[2] + 98); ctx.closePath(); ctx.fill();
 }
}

function drawCave(){
 const c = spires[4].cave, opening = c.floor - c.ceiling;
 ctx.save();
 ctx.fillStyle = '#0d1b27'; ctx.beginPath(); ctx.moveTo(c.left - 4, c.ceiling - 13);
 ctx.bezierCurveTo(c.left + 30, c.ceiling - 35, c.right - 28, c.ceiling - 24, c.right + 27, c.ceiling + 11);
 ctx.lineTo(c.right + 31, c.floor + 38); ctx.lineTo(c.left + 9, c.floor + 11); ctx.closePath(); ctx.fill();
 
 let shade = ctx.createLinearGradient(c.left, c.ceiling, c.right, c.floor);
 shade.addColorStop(0, '#142638'); shade.addColorStop(.65, '#081523'); shade.addColorStop(1, '#172935');
 ctx.fillStyle = shade; ctx.fillRect(c.left, c.ceiling + 4, c.right - c.left, c.floor - c.ceiling - 10);
 
 ctx.fillStyle = '#596c78'; ctx.beginPath(); ctx.moveTo(c.left - 18, c.ceiling - 28);
 ctx.quadraticCurveTo(c.left + 45, c.ceiling - 35, c.right + 40, c.ceiling - 17);
 ctx.lineTo(c.right + 40, c.ceiling + 6); ctx.quadraticCurveTo(c.left + 50, c.ceiling - 11, c.left - 18, c.ceiling + 6); ctx.closePath(); ctx.fill();
 ctx.fillStyle = '#ebf5f6'; ctx.beginPath(); ctx.moveTo(c.left - 18, c.ceiling - 27); ctx.quadraticCurveTo(c.left + 70, c.ceiling - 35, c.right + 35, c.ceiling - 19); ctx.lineTo(c.right + 30, c.ceiling - 11); ctx.lineTo(c.left - 15, c.ceiling - 16); ctx.fill();
 
 ctx.fillStyle = '#4d606a'; ctx.beginPath(); ctx.moveTo(c.left - 9, c.floor + 3); ctx.lineTo(c.right + 36, c.floor + 2); ctx.lineTo(c.right + 34, c.floor + 22); ctx.lineTo(c.left - 9, c.floor + 14); ctx.fill();
 ctx.strokeStyle = '#e0ebec'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(c.left - 7, c.floor - 1); ctx.lineTo(c.right + 35, c.floor - 1); ctx.stroke();
 
 // Campfire
 const flameX = c.right - 36, flameY = c.floor - 10, flick = Math.sin(performance.now() * .012) * 5;
 const glow = ctx.createRadialGradient(flameX, flameY - 15, 1, flameX, flameY - 15, 160);
 glow.addColorStop(0, '#ffca7477'); glow.addColorStop(.42, '#ec852433'); glow.addColorStop(1, '#ee8c2100'); ctx.fillStyle = glow; ctx.fillRect(c.left - 85, c.ceiling - 100, c.right - c.left + 185, opening + 200);
 ctx.strokeStyle = '#513324'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(flameX - 13, flameY); ctx.lineTo(flameX + 16, flameY + 4); ctx.moveTo(flameX + 12, flameY); ctx.lineTo(flameX - 12, flameY + 3); ctx.stroke();
 ctx.fillStyle = '#ffa82e'; ctx.beginPath(); ctx.moveTo(flameX - 13, flameY);
 ctx.quadraticCurveTo(flameX - 22, flameY - 27, flameX + 4, flameY - 44 - flick);
 ctx.quadraticCurveTo(flameX + 23, flameY - 17, flameX + 11, flameY); ctx.fill();
 ctx.fillStyle = '#fff1a7'; ctx.beginPath(); ctx.moveTo(flameX - 4, flameY); ctx.quadraticCurveTo(flameX - 8, flameY - 19, flameX + 5, flameY - 24 - flick * .4); ctx.quadraticCurveTo(flameX + 11, flameY - 5, flameX + 8, flameY); ctx.fill();
 ctx.restore();
}

// 4. One frozen ice ascent per outdoor mountain; a single steel ladder in the cave.
function drawIceClimb(i) {
 const points = iceClimbPoints(i);
 if (points.length < 2) return;
 const lower = points[0], upper = points[points.length-1];
 const left = [], right = [], mid = [];
 for (let y = lower.y; y >= upper.y; y -= 8) {
  const pos = icePositionAt(i, y);
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
  const here=icePositionAt(i,y);
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

function drawCaveLadder() {
 const c=spires[4].cave, x=c.right-25;
 const startY=c.floor-5, endY=spires[4].summit[2]-10;
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
 if(!p.climb || !p.climb.isIce) return;
 const beat=p.climb.climbBeat * Math.PI * .92;
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 for(const side of [-1,1]){
  const phase=beat + (side===1?Math.PI:0);
  const reach=Math.sin(phase)*7;
  const handX=p.x+side*18,handY=p.y-29+reach*.4;
  const tipX=handX+side*11,tipY=handY-24-reach;
  // Axe shaft held by the climber, with a swept steel pick at the ice.
  ctx.strokeStyle='#26333a';ctx.lineWidth=4;
  ctx.beginPath();ctx.moveTo(handX,handY);ctx.lineTo(tipX,tipY);ctx.stroke();
  ctx.strokeStyle='#9db8c2';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(tipX-side*10,tipY-3);
  ctx.quadraticCurveTo(tipX+side*2,tipY-9,tipX+side*13,tipY-1);
  ctx.lineTo(tipX+side*8,tipY+3);ctx.stroke();
  ctx.fillStyle='#333b40';ctx.beginPath();ctx.arc(handX,handY,3.5,0,PI*2);ctx.fill();
 }
 ctx.restore();
}

function decorate(i){
 const s = spires[i].summit, top = s[2];
 const l = s[0], r = s[1];
 const positions = [l + 48, l + 145, r - 125, r - 55];
 for(const [j, x] of positions.entries()){pine(x, top - 8, j % 2 ? 2.35 : 3.1)}
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

function draw(){
 const w = innerWidth, h = innerHeight, zoom = getZoom();
 const targetX = p.x - .28 * w / zoom, targetY = p.y - .56 * h / zoom;
 camera.x += (targetX - camera.x) * .055; camera.y += (targetY - camera.y) * .045;
 ctx.fillStyle = '#6d91ab'; ctx.fillRect(0,0,w,h);
 
 if(mountainBackdrop.complete && mountainBackdrop.naturalWidth){
  const bgW = w * 1.27, dx = -w * .15 - (((camera.x * .016) % (w * .14)) + w * .14) % (w * .14);
  ctx.drawImage(mountainBackdrop, dx, -h * .14, bgW, h * 1.17);
 }
 let fg = ctx.createLinearGradient(0, h * .40, 0, h);
 fg.addColorStop(0, '#d6e4f000'); fg.addColorStop(.76, '#bfd5e344'); fg.addColorStop(1, '#b3c7d488');
 ctx.fillStyle = fg; ctx.fillRect(0, h * .4, w, h * .6);
 
 ctx.fillStyle = '#344f66b9';
 for(let i = -2; i < Math.ceil(w / 260) + 3; i++){
  const x = i * 275 - ((camera.x * .07) % 275), top = h * .62 + Math.sin(i * 2.4) * 44;
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
 for(let i = 0; i < spires.length; i++){
  const s = spires[i].summit;
  if((s[1] - camera.x) * zoom < -180 || (s[0] - camera.x) * zoom > w + 180) continue;
  drawSpire(i);
 }
 if((spires[4].cave.right - camera.x) * zoom > -200 && (spires[4].cave.left - camera.x) * zoom < w + 200) drawCave();
 for(let i = 1; i < spires.length; i++){
  const s = spires[i].summit;
  if((s[1] - camera.x) * zoom < -180 || (s[0] - camera.x) * zoom > w + 180) continue;
  drawClimbingRoutes(i);
 }
 for(let i = 0; i < spires.length; i++){
  const s = spires[i].summit;
  if((s[1] - camera.x) * zoom < -180 || (s[0] - camera.x) * zoom > w + 180) continue;
  decorate(i);
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
 
 const pose = p.state === 'STEP_OFF' ? (Math.floor(sec * 10) % 8) : p.state === 'CLIMBING' ? (Math.floor(p.climb?.climbBeat || 0) % 2 ? 12 : 11) : p.vault ? 9 : (p.state === 'AIRBORNE' || p.state === 'FALLING') ? 10 : Math.abs(p.vx) > 18 ? Math.floor(sec * Math.max(7, Math.abs(p.vx) / 23)) % 8 : 8;
 if(climberSheet.complete && climberSheet.naturalWidth){
  ctx.save(); ctx.translate(p.x, p.y + 22); ctx.scale(p.facingDir < 0 ? -1 : 1, 1);
  ctx.drawImage(climberSheet, pose * 200, 0, 200, 256, -39, -93, 78, 100); ctx.restore();
 } else {
  ctx.fillStyle = '#bb3947'; ctx.fillRect(p.x - 10, p.y - 30, 20, 50);
 }
 if(p.state === 'CLIMBING' && p.climb?.isIce) drawIcePicks();
 ctx.restore();

 // Check rung proximity for Climb up button & hint
 const rungXTarget = climbEntryX;
 const nearRungs = p.state === 'CLIMBING' || (isGround() && ['ledge','cave'].includes(currentPlatform()?.kind) && Math.abs(p.x - rungXTarget(currentPlatform())) < 45);
 document.getElementById('up').hidden = !nearRungs;

 meter.style.display = p.vault ? 'block' : 'none';
 if(p.vault) needle.style.left = Math.min(100, p.vault.elapsed / p.vault.rideDuration * 100) + '%';
 stageEl.textContent = completed ? 'ASCENT COMPLETE' : `LEAP ${Math.min(atStage + 1, 4)} / 4`;
 let status = completed ? 'Checkpoint reached.' : p.state === 'CLIMBING' ? (p.climb?.isIce ? 'Hold ↑ to ice climb · Release to rest' : 'Hold ↑ on cave ladder · Release to rest') : p.state === 'STEP_OFF' ? 'Stepping onto the summit' : `Speed ${Math.round(Math.abs(p.vx))} · ${p.state.toLowerCase().replaceAll('_', ' ')}`;
 subEl.textContent = status;
 document.getElementById('timer').textContent = formatTime(elapsed);
}


