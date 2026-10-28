/* Independent map assembly. Does not import old map definitions. */
(function(root){
function build(seed){
let x=seed>>>0||1;const rand=()=>((x=(Math.imul(x,1664525)+1013904223)>>>0)/4294967296);
const parts=[];for(let i=0;i<4;i++){
let w=220+Math.floor(rand()*130),h=180+Math.floor(rand()*250),px=i*190,py=100+Math.floor(rand()*200);
parts.push({id:i,vertices:[[px,py],[px+w,py],[px+w+40,py+h],[px-40,py+h]]});
}
return {seed,parts,source:'independent'};
}
const api={build};if(typeof module==='object'&&module.exports)module.exports=api;else root.CleanMap=api;
})(typeof globalThis!=='undefined'?globalThis:this);
