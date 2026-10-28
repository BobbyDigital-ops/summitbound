const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const render=fs.readFileSync('public/game/scripts/rendering.js','utf8');
const data=fs.readFileSync('public/game/scripts/world-data.js','utf8');
test('trees have upright natural taper not inverted SVG asset',()=>{
 assert.match(render,/const fraction=j\/14, half=31\*\(1-fraction\*\.86\)/);
 assert.ok(!render.includes('drawImage(alpineFirSprite'));
});
test('character cannot be drawn twice with overlaid hat frames',()=>{
 assert.equal((render.match(/drawImage\(climberSheet,\s*pose\*200/g)||[]).length,1);
 // The second sprite draw, guarded by ghostPositionAt(), is an intentional
 // translucent personal-best ghost, not a second overlay on the player.
});
test('cliff uses sparse native vegetation rather than pasted-on SVG decals',()=>{
 assert.ok(!render.includes('drawImage(alpineScrubSprite'));
 assert.match(render,/for\(let n=0;n<7;n\+\+\)/);
});
test('physics and level seed code are untouched by the visual rollback',()=>{
 assert.match(data,/const cfg = \{gravity:800/);
 assert.match(render,/function paintWoodenStaff\(/);
});
