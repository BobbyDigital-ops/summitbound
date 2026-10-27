const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const read=path=>fs.readFileSync('public/game/scripts/'+path,'utf8');
const art=read('rendering.js');
const ctx=vm.createContext({});vm.runInContext(art,ctx);
const arc=ctx.vaultStaffArc;
test('Phase 6: bending pole remains 195 material units at every animation reach',()=>{
 const L=195;
 for(const [dx,dy] of [[-120,22],[100,-110],[195,0],[320,80],
   [0,0],[10,0],[-260,-160],[0,100],[150,10],[50,-30]]){
  const arr=arc(20,55,20+dx,55+dy,L);
  const len=arr.slice(1).reduce((total,pt,index)=>
   total+Math.hypot(pt.x-arr[index].x,pt.y-arr[index].y),0);
  assert.ok(Math.abs(len-L)<.12,
   'material length changed at '+dx+','+dy+' to '+len);
  assert.ok(Math.hypot(arr.at(-1).x-20,arr.at(-1).y-55)<=L+.000001,
   'rendered pole stretched farther than possible from its base');
  assert.ok(arr.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
 }
});
test('Phase 6: pole remains carried at rest and never reroutes vault physics',()=>{
 const src=read('simulation.js');
 assert.match(art,/restingStaffEnds\(p\.x,p\.y-13,p\.facingDir,cfg\.poleLength\)/);
 assert.match(art,/vaultStaffArc\(p\.anchorX,p\.anchorY,p\.x\+3,p\.y-5,cfg\.poleLength\)/);
 assert.equal((art.match(/paintWoodenStaff\(shaft,/g)||[]).length,2);
 assert.doesNotMatch(src,/cfg\.poleLength\s*=/);
});
test('Phase 6: wall-facing rear pose and ice tools use distance instead of frame clock',()=>{
 const simulation=read('simulation.js');
 assert.match(art,/function drawClimberWallFacing\(beat\)/);
 assert.match(art,/drawClimberWallFacing\(p\.climb\.climbBeat\)/);
 assert.match(art,/const beat=p\.climb\.climbBeat\*Math\.PI\*\.72/);
 assert.match(simulation,/c\.climbBeat\+=\(oldY-p\.y\)\/24/);
 assert.match(simulation,/iceClimbDisplacement\(c,k,dt\)/);
 assert.equal((art.match(/drawImage\(climberSheet, pose\*200/g)||[]).length,1,
   'climbing overlays should not duplicate the head sprite');
});
