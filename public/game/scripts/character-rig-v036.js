// Summitbound v0.36: character rig adapted from the APPROVED standalone
// Summitbound_Running_Tuner. Isolated from physics, terrain and contacts.
// Intentional 125% stride and 125% foot clearance. The shoulder/hand chain
// owns BOTH ice axes: legacy ice-pick overlays must not render alongside it.
const SUMMITBOUND_RUN_TUNING=Object.freeze({stride:1.25,clearance:1.25});
function drawRigMountaineer(g,p){
 // Scale the complete figure (including axes and accessories) by 33%. No physics change.
 const unit=.64*.67,PI=Math.PI;
 const P=(x,y,z=0)=>({x,y,z}),add=(a,b)=>P(a.x+b.x,a.y+b.y,a.z+b.z);
 const xy=v=>({x:v.x*unit+v.z*unit*.24,y:-v.y*unit+v.z*unit*.1});
 const capsule=(a,b,r,col,shadow='#13212c')=>{
  const A=xy(a),B=xy(b),len=Math.hypot(B.x-A.x,B.y-A.y);if(len<.01)return;
  g.save();g.translate(A.x,A.y);g.rotate(Math.atan2(B.y-A.y,B.x-A.x));
  const grad=g.createLinearGradient(0,-r*unit,0,r*unit);
  grad.addColorStop(0,col);grad.addColorStop(.72,col);grad.addColorStop(1,shadow);
  g.fillStyle=grad;g.beginPath();g.roundRect(0,-r*unit,len,r*2*unit,r*unit);g.fill();g.restore();
 };
 const orb=(v,rx,ry,col)=>{const s=xy(v);g.fillStyle=col;g.beginPath();g.ellipse(s.x,s.y,rx*unit,ry*unit,0,0,PI*2);g.fill()};
 const line=(a,b,w,col)=>{const A=xy(a),B=xy(b);g.strokeStyle=col;g.lineWidth=w*unit;g.lineCap='round';g.beginPath();g.moveTo(A.x,A.y);g.lineTo(B.x,B.y);g.stroke()};
 const detail=(a,b,w,col)=>line(a,b,w,col);
 const stitch=(a,b)=>detail(a,b,1.1,'#e7ad8b');
 const axe=(hand,up=1,angle=0)=>{
  // Grip = computed wrist position, never torso origin.
  const head=add(hand,P(14+Math.sin(angle)*3,30*up,0));
  line(hand,head,4,'#654b35');line(add(hand,P(-1,2)),add(head,P(-1,-1)),1.5,'#c4ab88');
  line(add(head,P(-12,4)),add(head,P(15,3)),4,'#a8c8d1');
  line(add(head,P(15,3)),add(head,P(18,-3)),2,'#dce8ec');
 };
 const state=p.state;
 const grounded=state==='GROUNDED'||state==='RUNNING'||(p.standingOn!=null&&state!=='CLIMBING');
 const running=grounded&&Math.abs(p.vx)>25;
 const pulling=state==='PULLING_UP',mt=p.mantle,progress=pulling?Math.min(1,(mt?.elapsed||0)/(mt?.duration||1)):0;
 const climbing=state==='CLIMBING',hanging=state==='HANGING',flying=state==='AIRBORNE'||state==='FALLING',vaulting=state==='RIDING_VAULT';
 const k=running?(p.runDistance||0)/34:climbing?(p.climb?.climbBeat||0)*PI*2:0;
 const bounce=running?Math.max(0,Math.sin(k*2))*3.5:0;
 const hip=P(running?3*Math.cos(k):0,running?79+bounce:65+bounce);
 const shoulder=add(hip,P(running?17+2*Math.sin(k):4,71));
 const neck=add(shoulder,P(running?5:2,9));
 const head=add(neck,P(1,12)),helmet=add(head,P(0,8));
 // The original tuner uses four continuous stance/recovery phases;
 // foot reach and clearance are independently scaled as approved.
 function runFoot(near){
  const u=((k/(PI*2)+(near?0:.5))%1+1)%1;
  const pts=[[0,57,9],[.19,7,8],[.38,-63,13],[.53,-46,44],[.72,9,57],[.89,47,34],[1,57,9]];
  for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1];if(u<=b[0]){
   let t=(u-a[0])/(b[0]-a[0]);t=t*t*(3-2*t);
   const x=(a[1]+(b[1]-a[1])*t)*SUMMITBOUND_RUN_TUNING.stride;
   const y0=a[2]+(b[2]-a[2])*t;
   return {x,y:y0<=13?y0:13+(y0-13)*SUMMITBOUND_RUN_TUNING.clearance};
  }}return {x:57*SUMMITBOUND_RUN_TUNING.stride,y:9};
 }
 function solveKnee(H,F,L1=45,L2=47){
  const dx=F.x-H.x,dy=F.y-H.y,dist=Math.max(.01,Math.hypot(dx,dy));
  const d=Math.min(L1+L2-.01,dist),a=(L1*L1-L2*L2+d*d)/(2*d);
  const height=Math.sqrt(Math.max(0,L1*L1-a*a));
  return P(H.x+dx*a/dist-dy/dist*height,H.y+dy*a/dist+dx/dist*height,H.z);
 }
 function leg(near){
  const z=near?9:-9,H=add(hip,P(0,0,z));let knee,ankle;
  if(running){const f=runFoot(near);ankle=P(f.x,f.y,z);knee=solveKnee(H,ankle)}
  else if(climbing){const beat=Math.sin(k+(near?0:Math.PI));knee=add(H,P(25+(near?5:-5),-26+beat*7));ankle=add(knee,P(9+beat*3,-28-beat*7))}
  else if(flying||vaulting){knee=add(H,P(-32,-8));ankle=add(knee,P(-31,-12))}
  else if(pulling){const hook=Math.min(1,Math.max(0,(progress-.28)/.45));knee=add(H,P((near?10:-8)+hook*23,-24+hook*16));ankle=add(knee,P(near?8:-10,-29+hook*22))}
  else if(hanging){knee=add(H,P(near?11:-12,-37));ankle=add(knee,P(near?4:-8,-33))}
  else{knee=add(H,P(0,-33));ankle=add(knee,P(0,-33))}
  capsule(H,knee,10,'#273947');capsule(knee,ankle,8,'#354958');orb(knee,8,8,'#394b58');
  capsule(ankle,add(ankle,P(18,-1.5)),7.5,'#665541','#262a31');
  line(add(ankle,P(4,-6)),add(ankle,P(17,-6)),2,'#cab18a');
  // Gaiters, leather toe guard, and crampon cleats follow the animated foot.
  line(add(ankle,P(-5,8)),add(ankle,P(7,8)),3,'#6a7881');
  line(add(ankle,P(6,2)),add(ankle,P(18,2)),1.5,'#c9ae8e');
  for(const x of [1,9,17])detail(add(ankle,P(x,-7)),add(ankle,P(x+2,-11)),1.8,'#d7dce0');
 }
 g.save();
 // An axe-reach is forward with the torso, not a second disembodied tool.
 if(flying){g.translate(8,-16);g.rotate(-.16)}
 if(pulling){g.translate(progress<.4?-3:progress*7,-4*Math.sin(progress*Math.PI));g.rotate(-.18*(1-progress))}
 if(vaulting){g.rotate(-Math.min(.20,(p.vault?.elapsed||0)/(p.vault?.rideDuration||1)*.20))}
 leg(false);
 const packCenter=add(hip,P(running?-4:-14,40,-8));
 orb(packCenter,22,36,'#26343d');
 // Roll-top pack, straps, buckles, carabiners and snow-dusted flap.
 orb(add(packCenter,P(-3,20)),19,10,'#4c6065');
 detail(add(packCenter,P(-15,23)),add(packCenter,P(10,23)),2.4,'#bdc8c3');
 detail(add(packCenter,P(-13,-18)),add(packCenter,P(10,-18)),2.2,'#718489');
 detail(add(packCenter,P(-8,-28)),add(packCenter,P(-8,29)),2.3,'#b6a17d');
 orb(add(packCenter,P(13,-17)),3.4,6,'#b7bdb9');
 line(add(shoulder,P(-10,-8)),add(hip,P(-13,24)),4,'#a18b6f');
 line(add(shoulder,P(9,-4)),add(hip,P(10,19)),2.8,'#d2ac80');
 capsule(hip,shoulder,18,'#a84433','#552b2c');
 orb(add(hip,P(0,45)),19,30,'#b64d39');
 // Diagonal fabric panels, jacket zipper, cuffs, pocket and harness.
 stitch(add(shoulder,P(7,-2)),add(hip,P(8,5)));
 detail(add(shoulder,P(-13,-12)),add(hip,P(-8,18)),2,'#8d302d');
 detail(add(hip,P(-8,41)),add(hip,P(9,39)),2,'#e2a17c');
 detail(add(hip,P(8,23)),add(hip,P(15,17)),2,'#eac39b');
 detail(add(hip,P(-14,15)),add(hip,P(11,12)),4,'#423b3a');
 orb(add(hip,P(8,12)),3,4,'#c4a57c');
 capsule(shoulder,neck,12,'#722f2c');capsule(neck,head,9,'#ad755d');
 orb(head,12,13,'#a37c61');orb(add(head,P(-4,1)),8,11,'#273841');orb(helmet,16,8,'#b0bbc0');
 orb(add(head,P(11,-3)),5,5,'#b38b70');orb(add(head,P(14,-1)),3,2.3,'#c39a7c');
 line(add(head,P(5,-7)),add(head,P(11,-9)),3,'#3c3635');
 // Helmet crown, visor, goggles, headlamp and chin strap.
 line(add(helmet,P(-13,0)),add(helmet,P(15,1)),2,'#e4e8e6');
 orb(add(head,P(11,4)),8,4,'#182a33');
 line(add(head,P(5,1)),add(head,P(15,2)),3,'#c8d4d5');
 orb(add(helmet,P(12,0)),4,4,'#e5d9a6');
 detail(add(head,P(-8,5)),add(head,P(8,-7)),2,'#a3a69f');
 line(add(hip,P(-12,26)),add(hip,P(16,24)),3,'#b49a78');
 leg(true);
 function arm(near){
  const S=add(shoulder,P(2,0,near?16:-16));let elbow,hand;
  if(running){const swing=(near?1:-1)*Math.cos(k+.25);elbow=add(S,P(-6+13*swing,-30));hand=add(elbow,P(2+7*swing,-21))}
  else if(climbing){const beat=Math.sin(k+(near?0:PI));elbow=add(S,P(near?18:9,17+beat*8));hand=add(elbow,P(near?11:16,25+beat*10))}
  else if(flying||vaulting){elbow=add(S,P(31,5));hand=add(elbow,P(39,8))}
  else if(pulling){elbow=add(S,P(near?13:-4,24-progress*23));hand=add(elbow,P(near?9:12,36-progress*28))}
  else if(hanging){elbow=add(S,P(near?13:-5,22));hand=add(elbow,P(near?7:12,40))}
  else{elbow=add(S,P(14,-20));hand=add(elbow,P(10,-17))}
  capsule(S,elbow,10,near?'#b84835':'#973e33','#632d2b');
  capsule(elbow,hand,8,'#a43e31','#572a2b');orb(elbow,8,8,'#a44332');
  // Contrasting reinforced cuff, reflective piping and insulated gloves.
  detail(add(elbow,P(2,-4)),add(elbow,P(6,-8)),2,'#df9177');
  orb(add(hand,P(-3,3)),8,6,'#434b4c');
  orb(hand,7,7,'#222f34');
  detail(add(hand,P(-4,-4)),add(hand,P(4,-5)),1.4,'#9ba8a7');
  return hand;
 }
 const far=arm(false),near=arm(true);
 if(climbing||hanging||pulling&&progress<.66){axe(far,1,-.5);axe(near,1,.6)}
 if(flying&&typeof axeCatchApproach==='function'&&axeCatchApproach(true))axe(near,.75,-.25);
 g.restore();return true;
}
