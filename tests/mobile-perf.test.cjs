const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const render=fs.readFileSync('public/game/scripts/rendering.js','utf8');
const input=fs.readFileSync('public/game/scripts/input-ui.js','utf8');
const sim=fs.readFileSync('public/game/scripts/simulation.js','utf8');
const html=fs.readFileSync('public/game/summit-leap-v081.html','utf8');
test('static mountain scenery cached per route and invalidated after seed changes',()=>{
 assert.match(render,/const terrainCache=new Map/);
 assert.match(render,/function mountainCache\(i\)/);
 assert.match(render,/drawSpire\(i,off\)/);
 assert.match(render,/terrainCache\.set\(i,data\)/);
 assert.match(render,/drawIceClimb\(i,off\)/);
});
test('mobile quality profiles cap internal drawing resolution and snow',()=>{
 assert.match(sim,/graphicsQuality==='low'\?1/);
 assert.match(render,/graphicsQuality==='low'\?3/);
 assert.match(render,/graphicsQuality==='low'\?14/);
 assert.match(input,/graphicsQuality=levels/);
 assert.match(html,/id="graphicsMode"/);
 assert.match(html,/id="performanceLabel"/);
});
test('keyboard, pointer and vault controls still attached',()=>{
 assert.match(input,/processKeyDown/);assert.match(input,/processKeyUp/);
 assert.match(input,/canvas\.addEventListener\('pointerdown'/);
 assert.match(input,/control\(document\.getElementById\('up'\), 'up'\)/);
 assert.match(input,/release\(\)/);
});
test('frame pacing retains 120Hz physics but slows stationary mobile painting',()=>{
 assert.match(sim,/for\(let n = 0; acc >= DT/);
 assert.match(sim,/const stationary=innerWidth<950/);
 assert.match(sim,/renderGap=graphicsQuality==='low'\|\|stationary\?31:0/);
 assert.match(sim,/graphicsQuality==='high'\?2:\(innerWidth<950\?1:1\.6\)/);
 assert.match(sim,/p95/);
 assert.match(render,/if\(stageEl\.textContent!==stageText\)/);
 assert.match(render,/if\(timerEl\.textContent!==timeLabel\)/);
});
test('player HUD release version stays in sync with document title',()=>{
 const match=html.match(/<title>Summitbound — ([^<]*?) (v\d+\.\d+\.\d+)<\/title>/);
 assert.ok(match,'document title has semver release');
 const label=match[1].toUpperCase()+' · '+match[2];
 assert.ok(html.includes('<small>'+label+'</small>'),'visible HUD shows same release as title');
});
