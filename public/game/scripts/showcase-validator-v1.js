// Summitbound Phase 2 — physics-based authoring report.
// Report actual first-contact windows for each landing, preserving frozen pole physics.
(function(root){
 'use strict';
 const MOTIFS=Object.freeze([
  {peak:0,name:'Wolvesgate Run-Up',skill:'speed and launch timing',kind:'distance',goal:'Reach the first exposed ice shelves'},
  {peak:1,name:'The Black Notch',skill:'steep recoil and second vault',kind:'vertical',goal:'Climb the ridge and clear its broken crown'},
  {peak:2,name:'Windward Camp',skill:'precision checkpoint landing',kind:'precision',goal:'Land on the campsite without bypassing its ascent'},
  {peak:3,name:'The Broken Crown',skill:'technical ridge transfer',kind:'transfer',goal:'Re-vault from exposed lower ridge to higher crest'},
  {peak:4,name:'Firespine',skill:'long final crossing and recovery',kind:'recovery',goal:'Reach the last campsite and summit'}
 ]);
 function sampleLedgeProfiles(spires,profileFn){
  const pairs=[];
  for(let i=1;i<spires.length;i++){
   const from=spires[i-1],to=spires[i];
   const sources=[{id:'s'+(i-1),surface:from.summit}];
   for(const source of sources){
    const options=to.ledges.map((ledge,j)=>({id:'l'+i+'-'+j,ledge,width:ledge[1]-ledge[0]}));
    const measured=profileFn(options.map(o=>o.ledge),source.surface);
    pairs.push(...options.map((o,j)=>({
     from:source.id,to:o.id,peak:i,kind:to.ledges[j].platformSize||'shelf',
     width:o.width,hits:measured[j].hits,safe:measured[j].safe,
     releaseWindows:measured[j].releaseWindows
    })));
   }
   if(to.ridgeArrival){
    const p=profileFn([to.summit],to.ridgeArrival)[0];
    pairs.push({from:'a'+i,to:'s'+i,peak:i,kind:'ridge-transfer',
     width:to.summit[1]-to.summit[0],hits:p.hits,safe:p.safe,
     releaseWindows:p.releaseWindows});
   }
  }
  return pairs;
 }
 function report(spires,profileFn,graphFn,auditFn){
  const links=sampleLedgeProfiles(spires,profileFn);
  const graph=graphFn(),audit=auditFn();
  return {motifs:MOTIFS.map(m=>({...m})),links,
   unreachable:links.filter(l=>l.safe<2),
   graphValid:graph.valid,graphIssues:graph.issues.slice(),
   auditValid:audit.valid,auditFailures:audit.failures.slice(),
   allCertified:links.every(l=>l.safe>=2)&&graph.valid&&audit.valid};
 }
 // Compare a proposed alteration to the already playable configuration.
 // A proposal that worsens an existing weak landing is rejected too.
 function noRegression(before,after){
  const prior=new Map(before.links.map(x=>[x.from+'>'+x.to,x]));
  const issues=[];
  for(const link of after.links){
   const old=prior.get(link.from+'>'+link.to);
   if(!old){issues.push('new unmeasured link '+link.from+'>'+link.to);continue;}
   if(link.safe<old.safe||link.hits<old.hits)
    issues.push('landing lost contact windows '+link.from+'>'+link.to);
   if(old.safe>=2&&link.safe<2)issues.push('landing became unreachable '+link.to);
  }
  for(const issue of after.auditFailures)
   if(!before.auditFailures.includes(issue))issues.push('new route violation: '+issue);
  for(const issue of after.graphIssues)
   if(!before.graphIssues.includes(issue))issues.push('new graph violation: '+issue);
  return {valid:issues.length===0,issues};
 }
 root.SummitShowcase=Object.freeze({MOTIFS,sampleLedgeProfiles,report,noRegression});
})(typeof globalThis!=='undefined'?globalThis:this);
