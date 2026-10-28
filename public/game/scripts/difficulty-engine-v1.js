// Summitbound Difficulty Engine v1. A difficulty score is *measured*, not
// assigned by peak number. Same physical flight profiles power landing QA.
(function(root){
 'use strict';
 const TIERS=Object.freeze([
  {name:'Approach',min:0,max:24},
  {name:'Ascent',min:25,max:44},
  {name:'Exposed',min:45,max:62},
  {name:'Severe',min:63,max:79},
  {name:'Summit',min:80,max:100}
 ]);
 const SECTIONS=Object.freeze([
  {id:'opening',name:'The Opening Chasm',from:0,to:1,landingTier:1,motif:'distance'},
  {id:'black-notch',name:'The Black Notch',from:1,to:1,ridge:true,motif:'vertical'},
  {id:'windward',name:'Windward Camp',from:1,to:2,landingTier:0,motif:'precision'},
  {id:'broken-crown',name:'The Broken Crown',from:3,to:3,ridge:true,motif:'transfer'},
  {id:'firespine',name:'Firespine Crossing',from:3,to:4,landingTier:0,motif:'recovery'}
 ]);
 const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
 function describe(peakSet,def,profiles){
  const from=peakSet[def.from];
  const target=peakSet[def.to];
  const source=def.ridge?target.ridgeArrival:from.summit;
  const landings=def.ridge?[target.summit]:target.ledges;
  if(!source||!landings?.length)return {id:def.id,valid:false,reason:'missing geometry'};
  const index=def.ridge?0:def.landingTier;
  const p=profiles(landings,source)[index];
  const landing=landings[index];
  if(!p||!landing)return {id:def.id,valid:false,reason:'missing landing'};
  const fastOnly=profiles(landings,source,375)[index];
  const slowOnly=profiles(landings,source,300)[index];
  const gap=landing[0]-source[1],rise=source[2]-landing[2],width=landing[1]-landing[0];
  const tight=1-clamp(p.safe/18,0,1);
  const windows=1-clamp(p.releaseWindows/7,0,1);
  const narrow=1-clamp((width-65)/310,0,1);
  const span=clamp((gap-310)/570,0,1);
  const climb=clamp(Math.max(0,rise)/380,0,1);
  const speed=slowOnly.safe>=2?0:fastOnly.safe>=2?.5:1;
  const chain=def.ridge?.13:0;
  const score=Math.round(clamp(100*(.31*tight+.21*windows+.17*narrow+
   .14*span+.10*climb+.07*speed+chain),0,100));
  const tier=TIERS.find(t=>score<=t.max)||TIERS.at(-1);
  return {id:def.id,name:def.name,motif:def.motif,valid:p.safe>=2,
   score,tier:tier.name,tierIndex:TIERS.indexOf(tier)+1,
   from:def.ridge?'a'+def.to:'s'+def.from,
   to:def.ridge?'s'+def.to:'l'+def.to+'-'+index,
   gap,rise,width,hits:p.hits,safe:p.safe,releaseWindows:p.releaseWindows,
   slowSafe:slowOnly.safe,mediumSafe:fastOnly.safe};
 }
 function gradeCourse(peakSet,profiles,definitions=SECTIONS){
  const sections=definitions.map(def=>describe(peakSet,def,profiles));
  return {sections,valid:sections.every(q=>q.valid),average:Math.round(
   sections.reduce((sum,q)=>sum+(q.score||0),0)/Math.max(1,sections.length)),
   // A strictly graded five-challenge curve is an aspiration, not an
   // invented guarantee. Report measured regressions for authors to fix.
   progression:sections.slice(1).map((q,i)=>({
    from:sections[i].id,to:q.id,delta:q.score-sections[i].score
   })),tiers:TIERS.map(t=>t.name)};
 }
 function compare(reference,challenger){
  const failures=[];
  if(!challenger.valid)failures.push('challenge has unplayable measured sections');
  if(challenger.sections.length!==reference.sections.length)
   failures.push('missing challenge segments');
  challenger.sections.forEach((s,i)=>{
   if(s.valid&&s.safe<2)failures.push('too few brakeable samples '+s.id);
  });
  const harder=challenger.sections.filter((s,i)=>s.score>reference.sections[i].score+1).length;
  return {valid:failures.length===0,failures,harder,changed:
   challenger.sections.filter((s,i)=>s.score!==reference.sections[i].score).length,
   scoreDelta:challenger.average-reference.average};
 }
 root.SummitDifficulty=Object.freeze({TIERS,SECTIONS,describe,gradeCourse,compare});
})(typeof globalThis!=='undefined'?globalThis:this);
