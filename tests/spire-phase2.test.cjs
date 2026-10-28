const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const dir='public/game/scripts/';
const context=vm.createContext({module:{exports:{}},require});
function lib(name,requireFn=()=>{throw Error('Unexpected dependency')}){
 const c=vm.createContext({module:{exports:{}},require:requireFn});
 vm.runInContext(fs.readFileSync(dir+name,'utf8'),c,{filename:name});
 return c.module.exports;
}
const K=lib('spire-kit-v10.js'),A=lib('spire-assembly-v10.js',()=>K);
const P=lib('spire-phase2-playtest.js');
vm.runInContext(fs.readFileSync(dir+'physics.js','utf8'),context);
vm.runInContext(fs.readFileSync(dir+'climb-mechanics.js','utf8'),context);
const Physics=vm.runInContext('PolePhysicsEngine',context);
const iceStep=vm.runInContext('iceClimbDisplacement',context);
function game(seed=42){return new P.SpirePhase2Playtest({assemble:A.assemble,physics:Physics,iceStep})}
function independentSection(pieces,y){
 const widths=[];
 for(const part of pieces){
  if(y<part.offsetY-part.height-1e-7||y>part.offsetY+1e-7)continue;
  const p=part.vertices,xs=[];
  for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];
   if(a[1]===b[1]){if(a[1]===y)xs.push(a[0],b[0]);continue}
   if(y>=Math.min(a[1],b[1])&&y<=Math.max(a[1],b[1]))xs.push(a[0]+(b[0]-a[0])*(y-a[1])/(b[1]-a[1]));
  }
  if(xs.length)widths.push({left:Math.min(...xs),right:Math.max(...xs)});
 }
 return widths.length?{left:Math.min(...widths.map(x=>x.left)),right:Math.max(...widths.map(x=>x.right))}:null;
}
function completelyInside(pieces,left,right,top,bottom,margin=.4){
 const ys=[top,bottom];
 for(const p of pieces)for(const vertex of p.vertices)
  if(vertex[1]>top&&vertex[1]<bottom)ys.push(vertex[1]);
 ys.sort((a,b)=>a-b);
 const checks=[...ys];
 for(let i=1;i<ys.length;i++)checks.push((ys[i]+ys[i-1])/2);
 return checks.every(y=>{const c=independentSection(pieces,y);return c&&left>=c.left+margin&&right<=c.right-margin});
}
test('placement law: all rock ledge polygons and entire vertical iceflows remain within mountain outline (2,000 seeds)',()=>{
 let ledges=0,ice=0,scaffolds=0,ladders=0;
 for(let seed=1;seed<=2000;seed++){
  const s=A.assemble(seed);assert.equal(A.inspect(s).valid,true);
  for(const platform of s.platforms){
   if(platform.kind==='scaffold'){scaffolds++;continue}
   ledges++;
   const xs=platform.vertices.map(p=>p[0]),ys=platform.vertices.map(p=>p[1]);
   assert.ok(completelyInside(s.pieces,Math.min(...xs),Math.max(...xs),Math.min(...ys),Math.max(...ys)),
    'ledge breaches solid outline at seed '+seed+'/'+platform.id);
  }
  for(const climb of s.routes){
   if(climb.kind==='ladder'){ladders++;continue}
   ice++;
   assert.ok(completelyInside(s.pieces,climb.collider.left,climb.collider.right,climb.toY,climb.fromY,.8),
    'iceflow breaches outline at seed '+seed+'/'+climb.id);
  }
 }
 assert.ok(ledges>2000&&scaffolds>2000&&ice>1000&&ladders>1000);
});
test('geometry audits reject intentionally displaced rock ledge and iceflow',()=>{
 const s=A.assemble(3);
 const rock=s.platforms.find(p=>p.kind==='rock');
 assert.ok(rock);
 rock.vertices=rock.vertices.map(p=>[p[0]+1000,p[1]]);
 assert.ok(A.inspect(s).errors.some(e=>e.includes('rock ledge breaches')));
 const t=A.assemble(3),ice=t.routes.find(r=>r.kind==='ice');
 assert.ok(ice);
 ice.collider.left+=1000;ice.collider.right+=1000;
 assert.ok(A.inspect(t).errors.some(e=>e.includes('icefall breaches')));
});
test('phase 2 player can attach and climb a real ladder route to its destination',()=>{
 const g=game(42),bottom=g.player.standingOn;
 const route=g.spire.routes.find(r=>r.source===bottom);
 assert.ok(route);
 g.player.x=route.x;g.action('up',true);g.tick(1/120);
 assert.equal(g.player.state,'CLIMBING');
 for(let i=0;i<3500&&g.player.state==='CLIMBING';i++)g.tick(1/120);
 assert.equal(g.player.state,'GROUNDED');
 assert.equal(g.player.standingOn,route.target);
 assert.equal(g.player.y,g.surface(route.target).top-22);
});
test('phase 2 player can climb generated straight ice with original ice-step code',()=>{
 const g=game(3);const ice=g.spire.routes.find(r=>r.kind==='ice');
 assert.ok(ice);
 const source=g.surface(ice.source);
 g.player.x=ice.x;g.player.y=source.top-22;g.player.standingOn=source.id;
 g.action('up',true);g.tick(1/120);
 assert.equal(g.player.state,'CLIMBING');
 assert.equal(g.player.climb.isIce,true);
 for(let i=0;i<4000&&g.player.state==='CLIMBING';i++)g.tick(1/120);
 assert.equal(g.player.standingOn,ice.target);
});
test('phase 2 deck uses existing pole-plant / release engine unchanged',()=>{
 const g=game(1),deck=g.surface('departure');
 g.player.standingOn='departure';g.player.state='GROUNDED';
 g.player.x=deck.left+9;g.player.y=deck.top-22;g.player.vx=400;g.player.facingDir=1;
 assert.equal(g.plant(),true);
 assert.equal(g.player.state,'RIDING_VAULT');
 for(let i=0;i<95;i++)g.tick(1/120);
 assert.ok(g.player.vault);
 assert.equal(g.release(),true);
 assert.equal(g.player.state,'AIRBORNE');
 assert.ok(Math.abs(g.player.vx)>100);
});
test('preserves all four placement-law exceptions and stand-alone physics imports',()=>{
 const src=fs.readFileSync(dir+'spire-assembly-v10.js','utf8');
 const ph=fs.readFileSync(dir+'spire-phase2-playtest.js','utf8');
 assert.ok(src.includes("if(pref.kind==='rock')"));
 assert.ok(src.includes("route.kind==='ice'&&!insideRockRect"));
 assert.ok(src.includes("useIce?'ice':'ladder'"));
 assert.ok(ph.includes('this.physics.stepVault'));
 assert.ok(ph.includes('this.iceStep'));
});

test('three independent spire scenes can be climbed from the lowest platform to their real departure decks',()=>{
 for(const seed of [42,143,257]){
  const g=game(seed);
  g.action('up',true);
  for(let i=0;i<12500&&!g.completed;i++)g.tick(1/120);
  assert.equal(g.completed,true,'seed '+seed+' never reached orange departure');
  assert.equal(g.player.standingOn,'departure');
  assert.equal(g.player.y,g.spire.departure.y-22);
 }
});
