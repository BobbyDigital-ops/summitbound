const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('public/game/scripts/sprite-climber-v033.js','utf8');
const svg=fs.readFileSync('public/game/assets/climber-v033-sprites.svg','utf8');
const html=fs.readFileSync('public/game/summit-leap-v081.html','utf8');
test('sprite atlas contains twelve non-identical actual frames',()=>{
 assert.match(svg,/width="1152" height="120"/);
 const poses=[...svg.matchAll(/data-pose="([^"]+)"/g)].map(x=>x[1]);
 assert.deepEqual(poses,['idle','run-a','run-b','run-c','run-d','plant','launch','flight','axe-reach','hang','pullup','climb']);
 assert.ok(svg.length>20000,'illustrated asset missing layered visual details');
 assert.ok(svg.includes('linearGradient')&&svg.includes('carabiner')===false);
});
test('game loads real sprite atlas instead of runtime procedural character',()=>{
 assert.match(html,/sprite-climber-v033\.js/);
 assert.match(src,/climber-v033-sprites\.svg/);
 assert.match(fs.readFileSync('public/game/scripts/rendering.js','utf8'),/drawSpriteMountaineer\(ctx,p\)/);
});
test('running gait cycles, flying reach and ice climbing select independent frames',()=>{
 const context=vm.createContext({Image:class Image{constructor(){this.complete=true;this.naturalWidth=1152}},window:{},document:{}});
 vm.runInContext(src,context);
 const pose=s=>vm.runInContext('spritePoseFor('+s+')',context);
 for(const [d,expect] of [
  ["{state:'GROUNDED',vx:0,standingOn:'s0'}",0],
  ["{state:'RUNNING',vx:190,standingOn:'s0',runDistance:0}",1],
  ["{state:'RUNNING',vx:190,standingOn:'s0',runDistance:22}",2],
  ["{state:'RUNNING',vx:190,standingOn:'s0',runDistance:44}",3],
  ["{state:'RUNNING',vx:190,standingOn:'s0',runDistance:66}",4],
  ["{state:'HANGING'}",9],["{state:'CLIMBING'}",11],
  ["{state:'FALLING',vy:-100}",7]
 ])assert.equal(pose(d),expect,d);
 context.axeCatchApproach=()=>({ready:true});
 assert.equal(pose("{state:'FALLING',vy:130}"),8);
 const draws=[];
 context.g={drawImage(...args){draws.push(args)}};
 vm.runInContext("drawSpriteMountaineer(g,{state:'FALLING',vy:120})",context);
 assert.equal(draws.length,1);
 assert.equal(draws[0][1],8*96);
 assert.equal(draws[0][3],96);
});
