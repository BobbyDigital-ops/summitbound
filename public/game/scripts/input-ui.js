// Summit Leap v0.8.3 — extracted unchanged from v0.8.1.
document.getElementById('retry').addEventListener('click', retry);
document.getElementById('shuffle').addEventListener('click', () => { applyRoute(routeSeed + 1); gameReset(); hint('NEW LANDING SHELVES — SAME PHYSICS', 3); });
document.getElementById('restart').addEventListener('click', gameReset);
document.getElementById('again').addEventListener('click', gameReset);
document.getElementById('campContinue')?.addEventListener('click',continueCaveAscent);
document.getElementById('campRetry')?.addEventListener('click',retryFinalLeap);

document.getElementById('tuneToggle').addEventListener('click', () => document.getElementById('tuning').hidden = !document.getElementById('tuning').hidden);
document.getElementById('tuneClose').addEventListener('click', () => document.getElementById('tuning').hidden = true);
document.getElementById('graphicsMode')?.addEventListener('click',()=>{
 const levels=['auto','low','high'];
 graphicsQuality=levels[(levels.indexOf(graphicsQuality)+1)%levels.length];
 if(graphicsQuality==='auto'){autoPortraitCap=1.2;slowAutoWindows=0;}
 document.getElementById('graphicsMode').textContent='Graphics: '+graphicsQuality;
 resize();
 invalidateTerrainCache();
});

for(const [id, key, output, divisor] of [['liftTune','arcadeLift','liftVal',100], ['rangeTune','arcadeRange','rangeVal',100], ['gravityTune','gravity','gravityVal',1]]) {
 document.getElementById(id).addEventListener('input', e => {
  let num = Number(e.target.value);
  cfg[key] = num / divisor;
  if(typeof invalidateTimeTrial==='function')invalidateTimeTrial();
  document.getElementById(output).textContent = divisor === 100 ? num + '%' : String(num);
 });
}

for(const el of document.querySelectorAll('[data-skip]')) el.addEventListener('click', () => { spawn(Number(el.dataset.skip), true); if(typeof invalidateTimeTrial==='function')invalidateTimeTrial(); document.getElementById('tuning').hidden = true; });

function processKeyDown(keyStr, codeStr) {
 const k = (keyStr || '').toLowerCase();
 const c = (codeStr || '').toLowerCase();
 if (!k && !c) return;

 // Ice tools work on fresh key edges only, not keyboard auto-repeat.
 // On solid ground these same A/D keys still steer the runner.
 const axeSide=(k==='a'||k==='arrowleft'||c==='keya')?-1:
  (k==='d'||k==='arrowright'||c==='keyd')?1:0;
 if(axeSide&&!keys.has(k)&&!keys.has(c))iceAxeStrike(axeSide);

 const isSpace = k === ' ' || k === 'space' || c === 'space';
 if (isSpace) {
  if (!keys.has(' ') && !keys.has('space')) plant();
  keys.add(' ');
  keys.add('space');
 }
 if (k) keys.add(k);
 if (c) keys.add(c);

 if (k === 'r' || c === 'keyr') retry();
}

function processKeyUp(keyStr, codeStr) {
 const k = (keyStr || '').toLowerCase();
 const c = (codeStr || '').toLowerCase();
 if (k) keys.delete(k);
 if (c) keys.delete(c);

 const isSpace = k === ' ' || k === 'space' || c === 'space';
 if (isSpace) {
  keys.delete(' ');
  keys.delete('space');
  release();
 }
}

function handleNativeKeyDown(e) {
 if (!e || typeof e.key !== 'string') return;
 const k = e.key.toLowerCase();
 if ([' ', 'space', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'w', 's', 'a', 'd'].includes(k)) {
  e.preventDefault();
 }
 processKeyDown(e.key, e.code);
}

function handleNativeKeyUp(e) {
 if (!e || typeof e.key !== 'string') return;
 const k = e.key.toLowerCase();
 if ([' ', 'space', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'w', 's', 'a', 'd'].includes(k)) {
  e.preventDefault();
 }
 processKeyUp(e.key, e.code);
}

window.addEventListener('keydown', handleNativeKeyDown);
window.addEventListener('keyup', handleNativeKeyUp);

// One release path for browser focus loss, tab backgrounding and Android
// app lifecycle. No stuck touch-held direction/axe after returning.
function clearGameInput(){
 keys.clear();
 fingers.left.clear();fingers.right.clear();
 fingers.up.clear();fingers.down.clear();fingers.vault=null;
 if(p.state==='CLIMBING'&&p.climb)p.climb.pulse=0;
 for(const id of ['left','right','up','down']){
  document.getElementById(id)?.classList.remove('down');
 }
 release();
}
function resetResumeClock(){
 prev=performance.now();acc=0;lastRenderedAt=0;
}
window.addEventListener('message', e => {
 if (!e.data || typeof e.data !== 'object') return;
 if (e.data.type === 'SUMMIT_KEY_DOWN') {
  processKeyDown(e.data.key, e.data.code);
 } else if (e.data.type === 'SUMMIT_KEY_UP') {
  processKeyUp(e.data.key, e.data.code);
 } else if (e.data.type === 'SUMMIT_BLUR') {
  clearGameInput();resetResumeClock();
 }
});
window.addEventListener('blur',()=>{clearGameInput();resetResumeClock();});
window.addEventListener('pagehide',()=>{clearGameInput();resetResumeClock();});
window.addEventListener('pageshow',resetResumeClock);
document.addEventListener('visibilitychange',()=>{
 if(document.hidden)clearGameInput();
 resetResumeClock();
});

window.addEventListener('pointerdown', () => window.focus());

function control(el, dir){
 el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); el.setPointerCapture(e.pointerId); if(dir==='left'||dir==='right')iceAxeStrike(dir==='left'?-1:1); fingers[dir].add(e.pointerId); el.classList.add('down'); });
 for(const evt of ['pointerup','pointercancel','lostpointercapture']) el.addEventListener(evt, e => { e.preventDefault(); e.stopPropagation(); fingers[dir].delete(e.pointerId); el.classList.toggle('down', fingers[dir].size > 0); });
}

control(document.getElementById('left'), 'left');
control(document.getElementById('right'), 'right');
control(document.getElementById('up'), 'up');
control(document.getElementById('down'), 'down');
document.getElementById('ghostToggle')?.addEventListener('click',()=>{
 trialGhostVisible=!trialGhostVisible;
 document.getElementById('ghostToggle').textContent=trialGhostVisible?'Ghost: on':'Ghost: off';
});

canvas.addEventListener('pointerdown', e => {
 e.preventDefault();
 if(fingers.vault !== null) return;
 canvas.setPointerCapture(e.pointerId);
 fingers.vault = e.pointerId;
 plant();
});

for(const evt of ['pointerup','pointercancel','lostpointercapture']) canvas.addEventListener(evt, e => {
 if(fingers.vault === e.pointerId){ fingers.vault = null; release(); }
});

window.addEventListener('resize', resize);
resize(); spawn(0); requestAnimationFrame(loop);

