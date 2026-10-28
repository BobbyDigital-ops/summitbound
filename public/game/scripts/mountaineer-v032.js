/* Summitbound v0.32 — articulated hand-drawn expedition climber.
 * Original, vector-constructed silhouette at game resolution; no external
 * asset licences. Every arm/leg is posed from movement state.
 */
function drawPremiumMountaineer(g,p,phase,running){
 const stride=running?Math.sin((p.runDistance||0)/17):0;
 const airborne=p.state==='AIRBORNE'||p.state==='FALLING'||p.state==='RIDING_VAULT';
 const climbing=p.state==='CLIMBING',hanging=p.state==='HANGING';
 const step=running?stride*9:airborne?7:0;
 const pivot=(x,y,ax,ay,bx,by,c,w)=>{
  g.strokeStyle='#111d26';g.lineWidth=w+3;g.lineCap='round';g.beginPath();g.moveTo(x,y);g.lineTo(ax,ay);g.lineTo(bx,by);g.stroke();
  g.strokeStyle=c;g.lineWidth=w;g.beginPath();g.moveTo(x,y);g.lineTo(ax,ay);g.lineTo(bx,by);g.stroke();
 };
 const poly=(pts,c)=>{g.beginPath();g.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)g.lineTo(...pts[i]);g.closePath();g.fillStyle=c;g.fill()};
 g.save();
 if(!hanging){
  // Crampon boots, with separate moving knees and shadowed gaiters.
  for(const side of [-1,1]){
   const swing=side*step;
   const kneeY=-21+(running?Math.abs(swing)*.38:0);
   pivot(side*6,-37,side*9+swing*.52,kneeY,side*11+swing,-6,
    side===-1?'#2c4859':'#233a4b',9);
   poly([[side*11+swing-7,-7],[side*11+swing+9,-7],
    [side*11+swing+13,-2],[side*11+swing-9,-2]],'#1c2930');
   g.strokeStyle='#c2ccd1';g.lineWidth=1.5;g.beginPath();
   g.moveTo(side*11+swing-6,-3);g.lineTo(side*11+swing+9,-3);g.stroke();
  }
 }
 // Technical backpack with rolled sleeping mat and straps, not a red box.
 g.fillStyle='#14232a';g.beginPath();g.roundRect(-20,-76,39,47,10);g.fill();
 g.fillStyle='#536a69';g.beginPath();g.roundRect(-20,-70,9,33,4);g.fill();
 g.fillStyle='#a2a69c';g.beginPath();g.roundRect(-17,-80,31,8,4);g.fill();
 g.strokeStyle='#d1c6a2';g.lineWidth=1.8;
 g.beginPath();g.moveTo(-16,-76);g.lineTo(-16,-36);g.moveTo(11,-74);g.lineTo(11,-38);g.stroke();
 // Insulated jacket body with sculpted shoulder and waist taper.
 poly([[-16,-75],[-10,-83],[10,-83],[20,-71],[17,-42],[11,-36],
       [-12,-36],[-18,-45]],'#9f3743');
 poly([[-15,-70],[-6,-78],[1,-48],[-8,-40],[-17,-44]],'#c75359');
 poly([[4,-80],[12,-77],[17,-67],[13,-44],[4,-40]],'#652837');
 g.strokeStyle='#f2b8a1';g.lineWidth=1.7;g.beginPath();g.moveTo(1,-80);g.lineTo(1,-41);g.stroke();
 g.fillStyle='#e1a9a2';g.fillRect(-10,-46,5,2);g.fillRect(7,-46,4,2);
 // Articulated arms and glove silhouettes.
 const armShift=climbing?11:running?step*.7:airborne?-8:0;
 for(const side of [-1,1]){
  const shoulderX=side*13,handX=side*(21+Math.abs(armShift)*.33);
  const handY=climbing?-91:airborne?-71:running?-49+side*armShift:-46;
  pivot(shoulderX,-70,side*25,-61+side*armShift*.3,handX,handY,
    side===-1?'#ce5b62':'#802b3e',8);
  g.fillStyle='#243039';g.beginPath();g.ellipse(handX,handY,6,5,0,0,Math.PI*2);g.fill();
 }
 // Face is turned towards the rock during climbing.
 g.fillStyle='#3a2428';g.beginPath();g.ellipse(0,-91,13,15,0,0,Math.PI*2);g.fill();
 g.fillStyle='#c59d8a';g.beginPath();g.ellipse(climbing?1:4,-92,8,8,0,0,Math.PI*2);g.fill();
 // Insulated hood, chin protector and helmet with fitted headlamp.
 g.strokeStyle='#512c37';g.lineWidth=6;g.beginPath();g.arc(0,-92,12,Math.PI*.96,Math.PI*1.97);g.stroke();
 g.fillStyle='#c5b5a0';g.beginPath();g.ellipse(0,-102,13,7,0,Math.PI,Math.PI*2);g.fill();
 g.fillStyle='#b6c4c3';g.fillRect(-7,-105,12,3);
 g.fillStyle='#f6e4ba';g.fillRect(10,-101,5,5);
 g.strokeStyle='#202f35';g.lineWidth=4;g.beginPath();g.moveTo(-6,-94);g.lineTo(10,-94);g.stroke();
 // High visibility harness, carabiner, crampon tether.
 g.strokeStyle='#c9a774';g.lineWidth=2.4;g.beginPath();g.moveTo(-11,-43);g.lineTo(8,-32);g.lineTo(12,-42);g.stroke();
 g.fillStyle='#d2dbd2';g.beginPath();g.ellipse(10,-37,2.8,5,.4,0,Math.PI*2);g.fill();
 g.restore();
}
