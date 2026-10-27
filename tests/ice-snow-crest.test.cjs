const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync('public/game/scripts/rendering.js','utf8');
test('ice faces stop below the snowy lip and shared trunks are not painted twice',()=>{
 assert.match(src,/route\.sharedWith===null\?surfaceTop:route\.joinY\+5/);
 assert.match(src,/const renderTop=Math\.min\(lower\.y-12/);
 assert.match(src,/function drawIceCrestSnow\(/);
 assert.match(src,/const routes=iceRouteNetwork\(i\)\.filter/);
 assert.match(src,/drawIceClimb\(i,off\);drawIceCrestSnow\(i,off\)/);
 assert.match(src,/drawIceClimb\(i\);drawIceCrestSnow\(i\)/);
 assert.doesNotMatch(src,/sections\.push\(\{x:upper\.x,y:upper\.y/,
  'visible ice reaches above the summit rim again');
});
test('crest snow uses irregular feathered transparent snow not a flat ice rectangle',()=>{
 const a=src.indexOf('function drawIceCrestSnow('),
  b=src.indexOf('function drawCaveLadder(',a);
 assert.ok(a>0&&b>a);
 const part=src.slice(a,b);
 assert.match(part,/createLinearGradient/);
 assert.match(part,/feathers=/);
 assert.match(part,/lineTo\(xx,lower\)/);
 assert.match(part,/crest\.addColorStop\(1,'#9dc5d000'\)/);
});
