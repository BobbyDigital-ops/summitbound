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
test('user-visible version always updated on checkpoint',()=>{
 assert.match(html,/MOBILE RELEASE CANDIDATE · v0\.9\.7/);
});
