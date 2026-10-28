const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=p=>fs.readFileSync('public/game/scripts/'+p,'utf8');
test('real release engine: steep early, longer late, spent overheld, momentum matters',()=>{
 const ctx=vm.createContext({console,Image:class Image{},document:{getElementById(){return {textContent:'',style:{},classList:{add(){},remove(){}}}},querySelectorAll(){return []}}});for(const name of ['physics.js','world-data.js','course-engine.js','pole-dynamics.js'])vm.runInContext(source(name),ctx,{filename:name});
 const result=vm.runInContext(`(()=>{
  applyRoute(0);
  function sample(u,speed){
   const state=PolePhysicsEngine.initVault(700,1078,speed,0,820,1100,cfg);
   const q=PolePhysicsEngine.stepVault(state,state.rideDuration*u,cfg);
   const v=PolePhysicsEngine.calculateReleaseVelocity(q.nextVx,q.nextVy,q.state,cfg);
   const height=Math.max(0,-v.vy)**2/(2*cfg.gravity);
   const range=Math.abs(v.vx)*2*Math.max(0,-v.vy)/cfg.gravity;
   return {u,speed,vx:v.vx,vy:v.vy,height,range};
  }
  return {early:sample(.30,450),middle:sample(.55,450),late:sample(.84,450),red:sample(1.12,450),slow:sample(.84,320)};
 })()`,ctx);
 console.log('Release measurements (same velocity function as game):',JSON.stringify(result));
 for(const v of Object.values(result))assert.ok(Number.isFinite(v.height)&&Number.isFinite(v.range));
 assert.ok(result.early.height>result.late.height,'early release should give more vertical height');
 assert.ok(result.late.range>result.early.range,'late release should give more distance');
 assert.ok(result.red.range<result.late.range*.65,'overheld release must lose range');
 assert.ok(result.late.range>result.slow.range,'run-up speed must matter');
 assert.ok(result.late.vx>result.early.vx,'horizontal velocity grows with release timing');
});
