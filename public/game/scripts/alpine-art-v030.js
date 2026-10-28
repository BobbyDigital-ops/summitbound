// SUMMITBOUND 0.30 — ALPINE ART DIRECTION
// Static, seeded world-space painter. One shared geography supplies the
// background granite, physical ledges and visible ice. Rasterized once per
// mountain by rendering.js; no per-frame particle systems in this module.
(() => {
 const twopi=Math.PI*2;
 const noise=n=>{const x=Math.sin(n*127.1+78.233)*43758.5453;return x-Math.floor(x);};
 const between=(seed,a,b)=>a+(b-a)*noise(seed);
 const ink=['#0f1a22','#1a2831','#263640','#364751','#495962'];
 const light=['#53646a','#68777a','#7c8889','#9ba7a7'];
 function line(g,points,color,width=2){
  g.beginPath();g.moveTo(points[0][0],points[0][1]);
  for(let k=1;k<points.length;k++)g.lineTo(points[k][0],points[k][1]);
  g.lineWidth=width;g.strokeStyle=color;g.stroke();
 }
 function polygon(g,pts,color){
  g.beginPath();g.moveTo(pts[0][0],pts[0][1]);
  for(let k=1;k<pts.length;k++)g.lineTo(pts[k][0],pts[k][1]);
  g.closePath();g.fillStyle=color;g.fill();
 }
 function cliffMass(g,peak,left,right,top,front,back,seed){
  const bottom=2125,w=right-left;
  g.save();
  g.beginPath();g.moveTo(left,top+1);
  const capSteps=Math.max(12,Math.round(w/18));
  for(let k=1;k<=capSteps;k++){
   const u=k/capSteps;
   const chips=3*Math.sin(u*71+seed)+between(seed+k*1.71,-5,3);
   g.lineTo(left+w*u,top+chips);
  }
  for(let y=top+17;y<bottom;y+=14)g.lineTo(back(y),y);
  g.lineTo(back(bottom),bottom);
  for(let y=bottom;y>top+4;y-=13)g.lineTo(front(y),y);
  g.closePath();
  const fill=g.createLinearGradient(left,top,right+190,top+800);
  fill.addColorStop(0,'#78858a');
  fill.addColorStop(.17,'#536168');
  fill.addColorStop(.52,'#2e404a');
  fill.addColorStop(1,'#15252d');
  g.fillStyle=fill;g.fill();g.clip();

  // Broad linked granite planes, not uniformly scattered comic-book cracks.
  // Each facet shares its light direction and intersects solid cliff only.
  for(let k=0;k<120;k++){
   const yy=top+17+between(seed+k*2.9,0,1850);
   const l=front(yy),r=back(yy);
   if(r-l<45)continue;
   const x=l+(r-l)*between(seed+k*9.3,.06,.94);
   const fw=between(seed+k*8.7,22,152);
   const fh=between(seed+k*4.1,65,270);
   const skew=between(seed+k*5.37,-70,70);
   const pts=[[x,yy],[x+fw*.62,yy+fh*.22],[x+skew,yy+fh],[x-fw*.27,yy+fh*.42]];
   polygon(g,pts,k%6===0?'#a1abad16':k%5===0?'#09192341':k%2?'#a4afb012':'#0c1d2933');
   line(g,[pts[0],pts[1],pts[2]],k%4===0?'#93a1a125':'#11232e77',k%5===0?2.2:1.2);
  }
  // Long tectonic shear zones organize the rock, rather than tiling
  // identical decorative polygons from the cliff top to the bottom.
  for(let k=0;k<28;k++){
   const y=top+50+k*70+between(seed+k*13,-20,20);
   const l=front(y),r=back(y);
   if(r-l<60)continue;
   const x=l+(r-l)*between(seed+k*5,.18,.86),step=between(seed+k*17,-25,24);
   line(g,[[x-18,y-40],[x,y+6],[x+step,y+75],[x+step-22,y+124]],
    k%5===0?'#a6b1b136':'#0d1a258c',between(seed+k*11,1.4,4));
   if(k%3===0)line(g,[[x+4,y+9],[x+34,y+20],[x+46,y+47]],'#a9b7b228',1.2);
  }
  // Frosty inclusions and tiny snow deposits embedded only on solid rock.
  for(let k=0;k<44;k++){
   const y=top+65+between(seed+k*31,0,1350),a=front(y),b=back(y);
   if(b-a<50)continue;
   const x=a+(b-a)*between(seed+k*3,.2,.86),length=between(seed+k*37,8,39);
   line(g,[[x,y],[x+length,y-7],[x+length+9,y-6]],'#c5c9c143',1.3);
  }
  g.restore();
  // A thin rugged crust is physically tied to the same walkable ridge.
  g.save();
  const snow=g.createLinearGradient(left,top-15,left,top+14);
  snow.addColorStop(0,'#d4d8d1');snow.addColorStop(.55,'#aebcba');snow.addColorStop(1,'#737f80');
  g.beginPath();g.moveTo(left,top+4);
  for(let k=0;k<=capSteps;k++){
   const x=left+w*k/capSteps;
   g.lineTo(x,top-3+between(seed+k*6,-4,3));
  }
  g.lineTo(right,top+9);g.lineTo(left,top+8);
  g.closePath();g.fillStyle=snow;g.fill();
  line(g,[[left+3,top-3],[left+w*.33,top-5],[left+w*.62,top-3],[right-4,top-3]],'#e3e4d79c',1.3);
  g.restore();
 }
 function ledgeRock(g,peak,ledge,seed){
  const L=ledge[0],R=ledge[1],T=ledge[2],w=R-L;
  const face=mountainContourX(peak,T+82);
  const deep=mountainContourX(peak,T+152);
  const root=Math.max(face+30,L+w*.52);
  const pts=[[L-9,T+6],[L+w*.2,T+2],[R,T+5],[R+4,T+23],
   [R-w*.14,T+44],[root+26,T+89],[deep+35,T+146],
   [deep-24,T+159],[face-18,T+92],[L+w*.2,T+62],[L-13,T+24]];
  g.save();
  const f=g.createLinearGradient(L,T,R+90,T+160);
  f.addColorStop(0,'#63737a');f.addColorStop(.43,'#3c505b');f.addColorStop(1,'#1a2c37');
  polygon(g,pts,f);
  line(g,[[L+w*.2,T+20],[L+w*.42,T+55],[root+13,T+92],[deep+30,T+144]],'#162832b9',3);
  line(g,[[L+w*.7,T+17],[L+w*.61,T+44],[L+w*.75,T+68]],'#9eaeb047',1.5);
  for(let k=0;k<8;k++){
   const x=L+w*between(seed+k*2.9,.13,.85),y=T+between(seed+k*4.21,13,70);
   line(g,[[x,y],[x+between(seed+k*7,-19,15),y+24]],'#a5b3b328',1.5);
  }
  const cap=g.createLinearGradient(L,T-12,L,T+13);
  cap.addColorStop(0,'#e0e3da');cap.addColorStop(.6,'#a8b8b7');cap.addColorStop(1,'#71868b');
  const snow=[[L-9,T+6]];
  for(let k=0;k<=16;k++){
   const x=L+w*k/16;
   snow.push([x,T-3+between(seed+k*9,-5,3)]);
  }
  snow.push([R+2,T+7],[L-9,T+10]);
  polygon(g,snow,cap);
  // Wind-driven cornices hang slightly below the actual platform, not
  // white horizontal rectangles extending into unsupported collision space.
  for(let k=0;k<6;k++){
   const x=L+w*(k+.5)/7;
   const y=T+5;
   const h=between(seed+k*17,7,22);
   polygon(g,[[x-5,y],[x+5,y],[x+between(seed+k*31,-2,3),y+h]],'#d3dcd7aa');
  }
  g.restore();
 }
 function alpineFir(g,x,y,h,seed,lean=0){
  // Trunk and ragged individual branches. Size and asymmetric wind bend
  // are seeded so these read as real trees, not identical Christmas symbols.
  const dark=seed%4===0?'#111f25':'#172a30';
  g.save();
  const n=13;
  g.strokeStyle='#1d2524';g.lineCap='round';g.lineWidth=Math.max(2.5,h*.052);
  line(g,[[x,y+2],[x+lean*h*.4,y-h*.5],[x+lean*h,y-h]],'#25302f',Math.max(2,h*.048));
  for(let k=0;k<n;k++){
   const u=(k+1)/(n+1),yy=y-h*u,cx=x+lean*h*u;
   const reach=h*.32*(1-u)*between(seed+k*1.41,.62,1.15);
   const sag=h*.05*(1-u),floor=yy+sag;
   for(const side of [-1,1]){
    const w=reach*between(seed+k*3.2+side*7,.62,1.16);
    const tip=cx+side*w;
    line(g,[[cx,yy-3],[cx+side*w*.52,yy+2],[tip,floor+between(seed+k*4+side,0,7)]],
      k%3===0?'#314748':dark,Math.max(1.6,h*.037*(1-u*.65)));
    if(k%2===0){
     line(g,[[cx+side*w*.55,yy+2],[cx+side*w*.8,yy-4],[tip,floor+2]],'#63747163',1.5);
    }
    // Sparse snow accumulated on upper needle boughs.
    if(k%3===0&&u>.22)
     line(g,[[cx+side*w*.4,yy-2],[cx+side*w*.72,yy-2]],'#c6d1c3a0',1.8);
   }
  }
  line(g,[[x+lean*h*.96,y-h],[x+lean*h*1.02,y-h-8]],'#637777',1.8);
  g.restore();
 }
 function deadTree(g,x,y,h,seed){
  g.save();
  line(g,[[x,y],[x-4,y-h*.36],[x+5,y-h*.71],[x+12,y-h]],'#283139',Math.max(2,h*.09));
  for(let k=0;k<5;k++){
   const u=.32+k*.12,side=k%2?-1:1;
   const xx=x+5*u,yy=y-h*u;
   line(g,[[xx,yy],[xx+side*h*.24,yy-h*.12],[xx+side*h*.31,yy-h*.24]],'#344044',Math.max(1.4,h*.04));
  }
  g.restore();
 }
 function snowBoulder(g,x,y,size,seed){
  const pts=[[x-size,y+1],[x-size*.8,y-size*.48],[x-size*.2,y-size*.83],
   [x+size*.5,y-size*.7],[x+size,y],[x-size,y]];
  polygon(g,pts,'#344851');polygon(g,[[x-size*.8,y-size*.49],
   [x-size*.2,y-size*.83],[x+size*.5,y-size*.7],[x+size*.12,y-size*.45]],'#7f909080');
  line(g,[[x-size*.8,y-size*.49],[x-size*.2,y-size*.83],[x+size*.5,y-size*.7]],'#c1ccc2ae',2.6);
  line(g,[[x+size*.2,y-size*.5],[x+size*.36,y-size*.2]],'#192d37',2);
 }
 function vegetation(g,i,ledge,seed){
  const L=ledge[0],R=ledge[1],T=ledge[2],w=R-L;
  if(w>230&&i%3!==1){
   alpineFir(g,L+w*.2,T-4,between(seed,51,91),seed,.07);
   if(i%2===0)deadTree(g,R-24,T-3,between(seed+17,35,54),seed);
  }else if(w>130&&i%2===0)
   deadTree(g,L+24,T-2,between(seed+7,29,53),seed);
  for(let k=0;k<3;k++){
   const x=L+w*between(seed+k*8,.21,.87);
   line(g,[[x,T-3],[x-4,T-8],[x-6,T-7]],'#475755',1.4);
  }
  snowBoulder(g,R-between(seed,22,46),T-1,between(seed+7,7,15),seed);
 }
 function paintIce(g,i){
  const routes=iceRouteNetwork(i);
  for(let r=0;r<routes.length;r++){
   const route=routes[r],points=route.points;
   if(!points||points.length<2)continue;
   const top=route.sharedWith==null?points.at(-1).y:route.joinY;
   const bottom=points[0].y;
   if(bottom<=top)continue;
   g.save();
   // Uneven ice frozen INTO granite, never a uniform tube with rounded ends.
   const left=[],right=[];
   for(let k=0;k<=55;k++){
    const u=k/55,y=top+(bottom-top)*u,x=iceXOnPath(points,y);
    const rough=(noise(i*131+r*911+k*23.1)-.5)*13;
    const swell=6*Math.sin(u*23+i+r);
    const width=30+swell+between(r*99+k*.28,0,6);
    left.push([x-width*.6+rough*.6,y]);
    right.push([x+width*.65+rough,y]);
   }
   polygon(g,left.concat(right.reverse()),'#18313c');
   const shade=g.createLinearGradient(points[0].x-30,top,points[0].x+35,bottom);
   shade.addColorStop(0,'#708b91');shade.addColorStop(.28,'#354e59');
   shade.addColorStop(.73,'#59717a');shade.addColorStop(1,'#233b45');
   const core=[],rhs=[];
   for(let k=0;k<=58;k++){
    const u=k/58,y=top+(bottom-top)*u,x=iceXOnPath(points,y);
    const chip=between(i*77+r*19+k*3,-5,5);
    core.push([x-19+chip,y]);rhs.push([x+16+chip,y]);
   }
   polygon(g,core.concat(rhs.reverse()),shade);
   for(let k=0;k<65;k++){
    const u=between(i*43+r*9+k*13,.02,.98),y=top+(bottom-top)*u;
    const x=iceXOnPath(points,y)+between(i+r*51+k*2,-15,16);
    const len=between(k+i*4+r*7,4,21);
    line(g,[[x,y],[x-3,y+len],[x+3,y+len*.8]],
      k%5===0?'#d7e2d17d':k%3===0?'#a9c7c387':'#162d3780',
      k%6===0?2.6:1.4);
   }
   // A clear entry into the correct collision ledge, not a glowing
   // protrusion or horizontal plumbing elbow above bare air.
   const foot=points[0],px=foot.x,py=bottom;
   polygon(g,[[px-19,py-19],[px+19,py-15],[px+27,py+17],
     [px-26,py+18]],'#6881898b');
   line(g,[[px-20,py+3],[px+2,py-4],[px+24,py+4]],'#c1d3caad',2);
   g.restore();
  }
 }
 function mountain(i,g){
  const m=spires[i],ridge=m.summit,arrive=m.ridgeArrival;
  const seed=31+i*957;
  if(arrive){
   cliffMass(g,i,arrive[0],arrive[1],arrive[2],
    y=>mountainContourX(i,y),
    y=>arrive[1]+Math.min(100,Math.max(0,y-arrive[2])*.19)+Math.sin(y*.032+i)*6,
    seed);
   cliffMass(g,i,ridge[0],ridge[1],ridge[2],
    y=>ridgeUpperWallX(i,y),y=>mountainFlankX(i,y),seed+44);
  }else cliffMass(g,i,ridge[0],ridge[1],ridge[2],
   y=>mountainContourX(i,y),y=>mountainFlankX(i,y),seed);
  for(let t=0;t<m.ledges.length;t++)
   ledgeRock(g,i,m.ledges[t],seed+t*47);
 }
 function decorateMountain(i,g){
  const m=spires[i],ridge=m.summit,arrival=m.ridgeArrival,seed=i*211+71;
  // Restore the missing sense of life without returning to bright cartoon
  // trees: wind-bent alpine conifers, frost-heavy pines, dead timber, scree.
  const caps=arrival?[arrival,ridge]:[ridge];
  for(let idx=0;idx<caps.length;idx++){
   const cap=caps[idx],width=cap[1]-cap[0],y=cap[2];
   const n=width>700?5:width>380?3:2;
   for(let k=0;k<n;k++){
    const u=(k+.4)/(n+.3);
    // Trees occupy edges, leaving broad, readable running/planting space.
    const f=k%2===0?Math.min(.27,u*.7):Math.max(.72,.7+u*.28);
    const x=cap[0]+width*f;
    const tall=between(seed+idx*89+k*31,65,155);
    if((i+k+idx)%4===0)deadTree(g,x,y-4,tall*.65,seed);
    else alpineFir(g,x,y-4,tall,seed+k*17+idx*49,between(seed+k*9,-.15,.06));
   }
   for(let k=0;k<6;k++){
    const x=cap[0]+width*between(seed+idx*67+k*37,.14,.92);
    snowBoulder(g,x,y,between(seed+k*27,7,21),seed+k);
   }
  }
  for(let k=0;k<m.ledges.length;k++)vegetation(g,i,m.ledges[k],seed+k*52);
 }
 function campsite(peak){
  const loc=featuredCampPosition(peak);
  if(!loc)return;
  const x=loc.x,y=loc.y,seed=peak*97+71;
  ctx.save();
  // Low expedition shelter with a snow bank, guy-lines and small chimney.
  polygon(ctx,[[x-66,y],[x-31,y-43],[x+9,y],[x-66,y]],'#1a2a30');
  polygon(ctx,[[x-66,y],[x-31,y-43],[x-23,y]],'#55615c');
  polygon(ctx,[[x-23,y],[x-31,y-43],[x+9,y]],'#344547');
  line(ctx,[[x-31,y-44],[x+9,y+1]],'#b1aaa087',2);
  line(ctx,[[x-65,y],[x-83,y+12]],'#9aa5a380',1.5);
  line(ctx,[[x+9,y],[x+28,y+13]],'#9aa5a380',1.5);
  line(ctx,[[x-71,y+8],[x-9,y+5],[x+14,y+8]],'#ccd5c9a0',2);
  // Small golden light deliberately remains the one warm note.
  const pulse=.89+.1*Math.sin(performance.now()*.006);
  const glow=ctx.createRadialGradient(x+45,y-13,2,x+45,y-13,75);
  glow.addColorStop(0,'#efb26070');glow.addColorStop(1,'#e98f1b00');
  ctx.fillStyle=glow;ctx.fillRect(x-25,y-85,145,105);
  polygon(ctx,[[x+38,y],[x+34,y-20*pulse],[x+44,y-31*pulse],
    [x+52,y-12],[x+53,y]],'#dd914e');
  polygon(ctx,[[x+41,y],[x+42,y-16*pulse],[x+49,y]],'#f5d09a');
  for(let k=0;k<5;k++){
   const tx=x+65+k*8,ty=y+1+between(seed+k*3,-3,3);
   line(ctx,[[tx,ty],[tx-2,ty-5]],'#889b98',1);
  }
  ctx.restore();
 }
 // These are source-level replacements for the visual painter only.
 // Neither the terrain colliders nor pole, runner, jump or climbing physics
 // are edited by the v0.30 art pass.
 drawSpire=function alpineSpire(i,g=ctx){mountain(i,g);};
 drawIceClimb=function alpineIceRoutes(i,g=ctx){paintIce(g,i);};
 drawIceShelfJoins=function(){};
 drawIceCrestSnow=function(){};
 decorate=function alpineVegetation(i,g=ctx){decorateMountain(i,g);};
 drawFeaturedCampsite=function alpineCamp(peak=2){campsite(peak);};
})();