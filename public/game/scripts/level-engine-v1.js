// Summitbound Level Engine v1 — deterministic, data-first platform composition.
// Geometry and collision share the same [left,right,top] coordinates.
// This engine is opt-in: approved Five Peaks remains an untouched baseline.
(function(root){
 'use strict';
 const WIDTHS=Object.freeze({
  foothold:Object.freeze({min:28,max:52,role:'axe-catch'}),
  narrow:Object.freeze({min:65,max:115,role:'precision'}),
  shelf:Object.freeze({min:125,max:215,role:'landing'}),
  terrace:Object.freeze({min:230,max:370,role:'mixed'}),
  summit:Object.freeze({min:390,max:670,role:'run-up'})
 });
 const TEMPLATES=Object.freeze({
  vertical:Object.freeze({rise:[180,460],gap:[130,340],landing:['narrow','shelf']}),
  distance:Object.freeze({rise:[-90,130],gap:[360,750],landing:['shelf','terrace']}),
  precision:Object.freeze({rise:[-50,240],gap:[260,540],landing:['foothold','narrow']}),
  transfer:Object.freeze({rise:[70,280],gap:[230,480],landing:['narrow','terrace']}),
  recovery:Object.freeze({rise:[-170,100],gap:[280,560],landing:['foothold','shelf']})
 });
 const sample=(rng,[a,b])=>a+(b-a)*rng();
 function rngFor(seed){let state=(Number(seed)>>>0)||1;return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};}
 function widthPreset(kind,rng){const p=WIDTHS[kind];if(!p)throw Error('Unknown platform preset: '+kind);return Math.round(sample(rng,[p.min,p.max]));}
 function compose(options={}){
  const seed=options.seed??1,count=Math.max(1,Math.min(24,Math.trunc(options.count??5))),rng=rngFor(seed);
  const requested=options.motifs||['vertical','distance','precision','transfer','recovery'];
  let x=options.startX??0,y=options.startY??950;
  const platforms=[{id:'launch',kind:'summit',left:x,right:x+widthPreset('summit',rng),top:y,surface:'snow',motif:'start'}];
  for(let i=0;i<count;i++){
   const motif=requested[i%requested.length],spec=TEMPLATES[motif];
   if(!spec)throw Error('Unknown jump motif: '+motif);
   const takeoff=platforms.at(-1);
   const gap=Math.round(sample(rng,spec.gap)),rise=Math.round(sample(rng,spec.rise));
   const tier=spec.landing[Math.floor(rng()*spec.landing.length)];
   const width=widthPreset(tier,rng);
   x=takeoff.right+gap;y=takeoff.top-rise;
   platforms.push({id:'landing-'+(i+1),kind:tier,left:x,right:x+width,top:y,
    surface:['rock','snow','ice'][Math.floor(rng()*3)],motif,gap,rise});
  }
  return {schema:'summitbound.level.v1',seed,motifs:requested.slice(),platforms};
 }
 function geometryAudit(level){
  const issues=[],a=level?.platforms||[];
  if(!a.length)issues.push('No platforms');
  a.forEach((p,i)=>{
   if(![p.left,p.right,p.top].every(Number.isFinite))issues.push('Non-finite geometry '+i);
   if(p.right<=p.left)issues.push('Non-positive width '+i);
   if(i&&p.left<a[i-1].right)issues.push('Overlapping platform '+i);
   if(!WIDTHS[p.kind])issues.push('Unknown size preset '+i);
   const preset=WIDTHS[p.kind];
   if(preset&&(p.right-p.left<preset.min||p.right-p.left>preset.max))issues.push('Width violates preset '+i);
  });
  return {valid:issues.length===0,issues};
 }
 // Reachable first-contact on a *real* top surface using actual sampled
 // ballistic trajectories; never claim a level is viable just from gap size.
 function reachability(level,trajectories,options={}){
  const base=geometryAudit(level);if(!base.valid)return {valid:false,issues:base.issues,links:[]};
  if(!Array.isArray(trajectories)||!trajectories.length)
   return {valid:false,issues:['Physics flight samples required'],links:[]};
  const links=[],issues=[];
  for(let i=1;i<level.platforms.length;i++){
   const from=level.platforms[i-1],to=level.platforms[i];
   let hits=0;
   for(const f of trajectories){
    if(!Array.isArray(f.descending))continue;
    // Samples are relative to the source takeoff edge and source floor.
    for(const point of f.descending){
     const xx=from.right+point.x,feet=from.top+point.feet;
     const prev=from.top+point.prev;
     if(prev<=to.top&&feet>=to.top&&xx>=to.left&&xx<=to.right){hits++;break;}
    }
   }
   links.push({from:from.id,to:to.id,landingWidth:to.right-to.left,hits});
   if(hits<(options.minHits??1))issues.push('No verified landing trajectory '+from.id+' -> '+to.id);
  }
  return {valid:issues.length===0,issues,links,geometry:base};
 }
 function exportLevel(level){const audit=geometryAudit(level);if(!audit.valid)throw Error(audit.issues.join('; '));return JSON.stringify(level,null,2);}
 root.SummitLevelEngine=Object.freeze({WIDTHS,TEMPLATES,rngFor,widthPreset,compose,geometryAudit,reachability,exportLevel});
})(typeof globalThis!=='undefined'?globalThis:this);
