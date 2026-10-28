// Summitbound v0.36: character rig adapted from the APPROVED standalone
// Summitbound_Running_Tuner. Isolated from physics, terrain and contacts.
// Intentional 125% stride and 125% foot clearance. The shoulder/hand chain
// owns BOTH ice axes: legacy ice-pick overlays must not render alongside it.
const SUMMITBOUND_RUN_TUNING=Object.freeze({stride:1.25,clearance:1.25});
function drawRigMountaineer(g,p){
 const unit=.64,PI=Math.PI;
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
 const climbing=state==='CLIMBING',hanging=state==='HANGING',flying=state==='AIRBORNE'||state==='FALLING',vaulting=state==='RIDING_VAULT';
 const k=running?(p.runDistance||0)/34:climbing?(p.climb?.climbBeat||0)*PI*2:0;
 const bounce=running?Math.max(0,Math.sin(k*2))*3.5:0;
 const hip=P(running?3*Math.cos(k):0,running?79+bounce:65+bounce);
 const shoulder=add(hip,P(running?17+2*Math.sin(k):4,71));
 const neck=add(shoulder,P(running?5:2,12));
 const head=add(neck,P(1,13)),helmet=add(head,P(0,8));
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
  else if(climbing){knee=add(H,P(27+(near?4:-7),-23+(near?6:-8)));ankle=add(knee,P(14,-31))}
  else if(flying||vaulting){knee=add(H,P(-32,-8));ankle=add(knee,P(-31,-12))}
  else if(hanging){knee=add(H,P(near?11:-12,-37));ankle=add(knee,P(near?4:-8,-33))}
  else{knee=add(H,P(0,-33));ankle=add(knee,P(0,-33))}
  capsule(H,knee,10,'#273947');capsule(knee,ankle,8,'#354958');orb(knee,8,8,'#394b58');
  capsule(ankle,add(ankle,P(18,-1.5)),7.5,'#665541','#262a31');
  line(add(ankle,P(4,-6)),add(ankle,P(17,-6)),2,'#cab18a');
 }
 g.save();
 // An axe-reach is forward with the torso, not a second disembodied tool.
 if(flying){g.translate(8,-16);g.rotate(-.16)}
 if(vaulting){g.rotate(-Math.min(.20,(p.vault?.elapsed||0)/(p.vault?.rideDuration||1)*.20))}
 leg(false);
 const packCenter=add(hip,P(running?-4:-14,40,-8));
 orb(packCenter,22,36,'#26343d');line(add(shoulder,P(-10,-8)),add(hip,P(-13,24)),4,'#a18b6f');
 capsule(hip,shoulder,18,'#a84433','#552b2c');
 orb(add(hip,P(0,45)),19,30,'#b64d39');capsule(neck,head,8,'#b95f4b');
 orb(head,12,13,'#26363f');orb(helmet,16,8,'#b0bbc0');
 line(add(head,P(5,1)),add(head,P(15,2)),3,'#c8d4d5');
 line(add(hip,P(-12,26)),add(hip,P(16,24)),3,'#b49a78');
 leg(true);
 function arm(near){
  const S=add(shoulder,P(2,0,near?16:-16));let elbow,hand;
  if(running){const swing=(near?1:-1)*Math.cos(k+.25);elbow=add(S,P(-6+13*swing,-30));hand=add(elbow,P(2+7*swing,-21))}
  else if(climbing){const beat=Math.sin(k+(near?0:PI));elbow=add(S,P(near?22:8,near?23+beat*9:5-beat*9));hand=add(elbow,P(near?6:12,near?28+beat*11:31-beat*11))}
  else if(flying||vaulting){elbow=add(S,P(31,5));hand=add(elbow,P(39,8))}
  else if(hanging){elbow=add(S,P(near?13:-5,22));hand=add(elbow,P(near?7:12,40))}
  else{elbow=add(S,P(14,-20));hand=add(elbow,P(10,-17))}
  capsule(S,elbow,10,near?'#b84835':'#973e33','#632d2b');
  capsule(elbow,hand,8,'#a43e31','#572a2b');orb(elbow,8,8,'#a44332');orb(hand,7,7,'#222f34');
  return hand;
 }
 const far=arm(false),near=arm(true);
 if(climbing||hanging){axe(far,1,-.5);axe(near,1,.6)}
 if(flying&&typeof axeCatchApproach==='function'&&axeCatchApproach(true))axe(near,.75,-.25);
 g.restore();return true;
}
