/* Independent Summitbound modular part library. No old map imports. */
(function(g){const S={S:72,M:144,L:240};
const BASES=['bastion','horn','broken-ridge','overhang','stepped-wall','split-mass','sheared-face','frosted-crag'];
const EXTENSIONS=['spur','rib','shelf','buttress','tooth','split-crown','black-fin','terrace'];
const PLATFORMS=Array.from({length:50},(_,i)=>Object.freeze({id:'landing-'+(i+1),size:Math.floor(i/10)+1,width:[48,96,168,290,480][Math.floor(i/10)],variant:i%10}));
const ICE=['blue-fall','cracked-ice','frozen-chute','hanging-fall'];
function random(seed){let n=seed>>>0||1;return ()=>((n=(Math.imul(1664525,n)+1013904223)>>>0)/4294967296);}
function edge(x,y,size,side){const h=S[size],dir=side==='left'?-1:1;return [0,.25,.5,.75,1].map(t=>[Math.round(x+dir*Math.sin(t*Math.PI)*h*.12),Math.round(y+t*h)]);}
const lib=Object.freeze({S,BASES,EXTENSIONS,PLATFORMS,ICE,random,edge});
if(typeof module==='object'&&module.exports)module.exports=lib;else g.SummitParts=lib;
})(typeof globalThis!=='undefined'?globalThis:this);
