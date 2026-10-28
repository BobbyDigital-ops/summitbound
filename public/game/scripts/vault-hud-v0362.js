// Estimate release outcome from the exact velocity function used by gameplay.
// Assumes level landing and ignores obstacles; units are world-space units.
function vaultReleaseHudText(vault,config,phase){
 const velocity=PolePhysicsEngine.calculateReleaseVelocity(0,0,vault,config);
 const gravity=Math.max(1,config.gravity),riseSpeed=Math.max(0,-velocity.vy);
 const rise=riseSpeed*riseSpeed/(2*gravity);
 const range=Math.abs(velocity.vx)*2*riseSpeed/gravity;
 const kind=phase<.11?'BUILDING POWER':phase>=.93?'POWER DRAINING':
   phase<.45?'HEIGHT FOCUS':phase<.70?'BALANCED':'DISTANCE FOCUS';
 return kind+' · ~'+Math.round(rise)+' HEIGHT · ~'+Math.round(range)+' RANGE';
}
