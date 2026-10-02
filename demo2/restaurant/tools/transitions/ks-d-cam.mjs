const W=1920,H=1080,smooth=(a,b,t)=>{const x=Math.max(0,Math.min(1,(t-a)/(b-a)));return x*x*(3-2*x)};
const K_T=[2611,1060],ZK=9,SPLIT=0.55,lerp=(a,b,k)=>a+(b-a)*k;
function cam(t){const s=Math.min(1,t/SPLIT);const a=smooth(0,0.8,s);const z=Math.exp(Math.log(ZK)*Math.pow(s,1.7));
const S=[lerp(K_T[0],W/2,a),lerp(K_T[1],H/2,a)];let cx=K_T[0]-(S[0]-W/2)/z,cy=K_T[1]-(S[1]-H/2)/z;
const hw=W/2/z,hh=H/2/z;cx=Math.max(hw,Math.min(2880-hw,cx));cy=Math.max(hh,Math.min(1620-hh,cy));
let sw='';
if(cx+hw>W&&cy-hh<540){const l=cx+hw-W,d=540-(cy-hh);if(l<d){cx-=l;sw='L'}else{cy+=d;sw='D'}}
if(cy+hh>H&&cx-hw<960){const u=cy+hh-H,r=960-(cx-hw);if(u<r){cy-=u;sw+='U'}else{cx+=r;sw+='R'}}
return [z.toFixed(2),cx.toFixed(0),cy.toFixed(0),sw]}
for(let t=0;t<=0.55;t+=0.02)console.log(t.toFixed(2),...cam(t));
