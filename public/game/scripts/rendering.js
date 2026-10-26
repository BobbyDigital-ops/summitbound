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
 ctx.beginPath();
 ctx.moveTo(L, T - 9);
 ctx.bezierCurveTo(L + (R - L) * .25, T - 17, R - 90, T - 15, R - 4, T + 17);
 ctx.lineTo(R + 65, bottom);
 ctx.lineTo(i === 4 ? s.cave.left - 145 : L - 170, bottom);

 // Stepped cliff contours integrated into a single continuous mountain body
 if(i === 4){
  const c = s.cave;
  ctx.lineTo(c.left - 15, c.floor + 100);
  ctx.lineTo(c.left - 20, c.floor + 18);
  ctx.lineTo(c.left - 25, c.ceiling - 10);
  ctx.lineTo(L - 20, T + 55);
 } else if(tiers.length){
  const low = tiers[2], mid = tiers[1], high = tiers[0];
  ctx.lineTo(low[0] + 16, low[2] + 48);
  ctx.lineTo(low[0] + 19, low[2] + 18);
  ctx.quadraticCurveTo(low[0] - 12, low[2] + 12, low[0] - 8, low[2] + 1);
  ctx.lineTo(low[1] + 10, low[2] + 1);
  ctx.lineTo(L - 12, (low[2] + mid[2]) / 2);
  ctx.lineTo(mid[0] + 20, mid[2] + 40);
  ctx.lineTo(mid[0] + 16, mid[2] + 18);
  ctx.quadraticCurveTo(mid[0] - 11, mid[2] + 13, mid[0] - 8, mid[2] + 1);
  ctx.lineTo(mid[1] + 6, mid[2] + 1);
  ctx.lineTo(L - 8, (mid[2] + high[2]) / 2);
  ctx.lineTo(high[0] + 21, high[2] + 40);
  ctx.lineTo(high[0] + 14, high[2] + 15);
  ctx.quadraticCurveTo(high[0] - 14, high[2] + 9, high[0] - 6, high[2] + 1);
  ctx.lineTo(high[1] + 8, high[2] + 1);
  ctx.lineTo(L - 4, T + 45);
 } else {
  ctx.lineTo(L - 14, T + 105);
 }
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
 ctx.restore();

 // Surface snow integrated into the cliff contour
 const all = [[L, R, T], ...tiers.map(t => [t[0], t[1], t[2]])];
 for(const [a, b, y] of all){
  ctx.beginPath(); ctx.moveTo(a - 5, y - 2); ctx.bezierCurveTo(a + 23, y - 15, b - 32, y - 11, b + 4, y - 5);
  ctx.lineTo(b + 3, y + 3); ctx.quadraticCurveTo(b - 16, y + 11, b - 31, y + 5);
  ctx.lineTo(a + 15, y + 7); ctx.closePath(); ctx.fillStyle = '#e1edf1'; ctx.fill();
  ctx.strokeStyle = '#fcffff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a, y - 5); ctx.quadraticCurveTo((a + b) / 2, y - 12, b, y - 7); ctx.stroke();
  for(let t = 0; t < Math.min(12, Math.floor((b - a) / 26)); t++){
   const px = a + 15 + t * 27; ctx.fillStyle = '#bbdce3aa'; ctx.beginPath(); ctx.moveTo(px, y + 5); ctx.lineTo(px + 3, y + 5); ctx.lineTo(px + 1, y + 12 + (t % 4) * 3); ctx.fill();
  }
 }
 // Thin overhanging snow lips and darker fractured rock directly beneath landing surfaces.
 // Rendering-only detail: platform bounds, terrain collision, and vault physics are unchanged.
 for(const [a, b, y] of all){
  ctx.save();
  ctx.strokeStyle = '#263c4c99'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(a + 5, y + 10);
  ctx.quadraticCurveTo((a + b) / 2, y + 17, b - 5, y + 8); ctx.stroke();
  ctx.strokeStyle = '#f5fbffb8'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(a + 10, y - 3);
  ctx.quadraticCurveTo((a + b) / 2, y - 9, b - 12, y - 5); ctx.stroke();
  const count = Math.max(2, Math.floor((b - a) / 75));
  for(let n = 1; n <= count; n++){
   const x = a + (b - a) * n / (count + 1);
   ctx.strokeStyle = '#152b3c7d'; ctx.lineWidth = 2;
   ctx.beginPath(); ctx.moveTo(x, y + 17);
   ctx.lineTo(x + 7, y + 33 + (n % 3) * 6);
   ctx.lineTo(x + 2, y + 46 + (n % 2) * 6); ctx.stroke();
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

// 4. Inboard Ladders for Landing & Access Clearance
function drawLadders(i){
 if(i === 0) return;
 const sp = spires[i], goalY = sp.summit[2] - 10;
 const tiers = i === 4 ? [[sp.cave.left, sp.cave.right, sp.cave.floor]] : sp.ledges;
 for(const tier of tiers){
  // Place ladder rungs ~30px inboard from the right edge of the shelf
  const x = (i === 4 ? sp.cave.right - 25 : tier[1] - 30);
  const startY = tier[2] - 5;
  ctx.save(); ctx.lineCap = 'round';
  ctx.lineWidth = 5; ctx.strokeStyle = '#273c4a';
  ctx.beginPath(); ctx.moveTo(x - 12, startY); ctx.lineTo(x - 12, goalY); ctx.moveTo(x + 12, startY); ctx.lineTo(x + 12, goalY); ctx.stroke();
  ctx.strokeStyle = '#b9a18a'; ctx.lineWidth = 3;
  for(let y = startY - 6; y >= goalY; y -= 17){
   ctx.beginPath(); ctx.moveTo(x - 13, y); ctx.lineTo(x + 13, y); ctx.stroke();
  }
  ctx.strokeStyle = '#c8dce2'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x - 18, goalY); ctx.lineTo(Math.max(x + 20, sp.summit[0] + 20), goalY); ctx.stroke();
  ctx.restore();
 }
}

function decorate(i){
 const s = spires[i].summit, top = s[2];
 const l = s[0], r = s[1];
 const positions = [l + 48, l + 145, r - 125, r - 55];
 for(const [j, x] of positions.entries()){pine(x, top - 8, j % 2 ? 2.35 : 3.1)}
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
  drawLadders(i);
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
  ctx.lineCap = 'round'; let lastX = ax, lastY = ay;
  for(let q = 1; q <= 30; q++){
   const t = q / 30, r = 1 - t;
   const curX = r * r * r * ax + 3 * r * r * t * cx1 + 3 * r * t * t * cx2 + t * t * t * px;
   const curY = r * r * r * ay + 3 * r * r * t * cy1 + 3 * r * t * t * cy2 + t * t * t * py;
   ctx.strokeStyle = q % 6 === 0 ? '#876043' : '#b98752'; ctx.lineWidth = 6.6 - t * 3.2;
   ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(curX, curY); ctx.stroke();
   ctx.strokeStyle = '#e3c19a8c'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(lastX - .5, lastY - .9); ctx.lineTo(curX - .5, curY - .9); ctx.stroke();
   lastX = curX; lastY = curY;
  }
  ctx.fillStyle = '#293b43'; ctx.beginPath(); ctx.arc(ax, ay, 5.2, 0, PI * 2); ctx.fill();
 } else if(p.state !== 'CLIMBING'){
  ctx.strokeStyle = '#ac7b4e'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(p.x - 8, p.y - 5); ctx.lineTo(p.x + p.facingDir * 154, p.y - 26); ctx.stroke();
  ctx.strokeStyle = '#e0b88a'; ctx.lineWidth = 1.4; ctx.stroke();
 }
 
 const pose = p.state === 'STEP_OFF' ? (Math.floor(sec * 10) % 8) : p.state === 'CLIMBING' ? (Math.floor(p.climb?.climbBeat || 0) % 2 ? 12 : 11) : p.vault ? 9 : (p.state === 'AIRBORNE' || p.state === 'FALLING') ? 10 : Math.abs(p.vx) > 18 ? Math.floor(sec * Math.max(7, Math.abs(p.vx) / 23)) % 8 : 8;
 if(climberSheet.complete && climberSheet.naturalWidth){
  ctx.save(); ctx.translate(p.x, p.y + 22); ctx.scale(p.facingDir < 0 ? -1 : 1, 1);
  ctx.drawImage(climberSheet, pose * 200, 0, 200, 256, -39, -93, 78, 100); ctx.restore();
 } else {
  ctx.fillStyle = '#bb3947'; ctx.fillRect(p.x - 10, p.y - 30, 20, 50);
 }
 ctx.restore();

 // Check rung proximity for Climb up button & hint
 const rungXTarget = (plat) => plat ? (plat.kind === 'cave' ? spires[4].cave.right - 25 : plat.right - 30) : -999;
 const nearRungs = p.state === 'CLIMBING' || (isGround() && ['ledge','cave'].includes(currentPlatform()?.kind) && Math.abs(p.x - rungXTarget(currentPlatform())) < 45);
 document.getElementById('up').hidden = !nearRungs;

 meter.style.display = p.vault ? 'block' : 'none';
 if(p.vault) needle.style.left = Math.min(100, p.vault.elapsed / p.vault.rideDuration * 100) + '%';
 stageEl.textContent = completed ? 'ASCENT COMPLETE' : `LEAP ${Math.min(atStage + 1, 4)} / 4`;
 let status = completed ? 'Checkpoint reached.' : p.state === 'CLIMBING' ? 'Hold ↑ to climb · Release to rest' : p.state === 'STEP_OFF' ? 'Stepping onto the summit' : `Speed ${Math.round(Math.abs(p.vx))} · ${p.state.toLowerCase().replaceAll('_', ' ')}`;
 subEl.textContent = status;
 document.getElementById('timer').textContent = formatTime(elapsed);
}


