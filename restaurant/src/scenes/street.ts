import type { SceneDef, BeltPt } from "../engine/types";
import { html, hotspot, bubble } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { PRICING } from "../content/copy";
import "./street.css";

// Composition traced from Martin's recording: a deep lantern street and the rider
// in the lower left. Only the bicycle/pedal poses are replaced. All motion repeats
// at 24 seconds, with no scrolling panorama or changed camera angle.
const TAU=Math.PI*2, PX=3;
const mod=(a:number,b:number)=>((a%b)+b)%b;
const snap=(x:number)=>Math.round(x/PX)*PX;
const hash=(i:number)=>{const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x);};
const pts:BeltPt[]=[[150,-60,1],[150,918,1]];
for(let i=1;i<=12;i++){const a=Math.PI-i/12*Math.PI/2;pts.push([252+Math.cos(a)*102,918+Math.sin(a)*102,1]);}
pts.push([1680,1020,1]);
for(let i=1;i<=12;i++){const a=-Math.PI/2+i/12*Math.PI/2;pts.push([1680+Math.cos(a)*90,1110+Math.sin(a)*90,1]);}
pts.push([1770,1140,1]);
declareEggs(["street-bell","street-lamp","street-jiro","street-cargo","street-drain","street-puddle"]);

export const street:SceneDef={
 id:"street",room:"Delivery",art:"art/street/reference.png",mood:"bustling",hold:1.6,
 belt:{pts,width:64,plate:48,fadeIn:0,fadeOut:0},
 under(g,now,api){
  const t=mod(now,24);g.save();g.imageSmoothingEnabled=false;
  // Alternate only the leg/pedal patch; the street and upper rider remain fixed.
  const im=api.img("art/street/pedal.png");
  if(im.complete && im.naturalWidth && Math.floor(t/.75)%2===1){
   g.save();g.beginPath();g.moveTo(548,624);g.lineTo(740,624);g.lineTo(777,720);g.lineTo(777,930);g.lineTo(606,930);g.lineTo(594,804);g.lineTo(548,777);g.closePath();g.clip();g.drawImage(im,0,0,1920,1080);g.restore();
  }
  // Tiny highlights travel around the spokes on a two-second revolution.
  for(const [x,y] of [[489,852],[858,852]]) for(let i=0;i<8;i++){
   const a=t*TAU/2+i*TAU/8;g.fillStyle="rgba(225,211,171,.42)";
   for(let r=22;r<87;r+=6)g.fillRect(snap(x+Math.cos(a)*r),snap(y+Math.sin(a)*r),3,3);
  }
  // Lanterns gently brighten, and reflected light shifts on wet paving.
  for(const [x,y,r] of [[159,60,53],[996,86,48],[1188,86,48],[1374,89,47]]){
   g.globalAlpha=.035+.02*Math.sin(t*TAU/6+x);g.fillStyle="#ffd294";
   for(let dy=-r;dy<r;dy+=3){const w=Math.sqrt(Math.max(0,r*r-dy*dy));g.fillRect(snap(x-w),snap(y+dy),snap(w*2),3);}
  }
  for(let i=0;i<32;i++){
   const x=210+hash(i)*1550,y=966+hash(i+44)*108;
   g.globalAlpha=.1+.12*Math.sin(t*TAU/6+i)**2;g.fillStyle=i%3?'#e4a955':'#a6a7c6';
   g.fillRect(snap(x+Math.sin(t*TAU/8+i)*9),snap(y),12+(i%5)*9,3);
  }
  g.globalAlpha=1;
  // One gentle blink every eight seconds.
  if(t%8>5.8 && t%8<5.98){g.fillStyle="#c3b99b";g.fillRect(704,431,12,18);g.fillStyle="#625b4b";g.fillRect(704,443,12,3);}
  g.restore();
 },
 over(g,now){
  const t=mod(now,24);g.save();g.fillStyle="#c5d4de";
  for(let i=0;i<110;i++){
   const period=[1.5,2,2.4][i%3],f=mod(t/period+hash(i+80),1);
   const x=hash(i+190)*2180-f*220,y=-30+f*1140;
   g.globalAlpha=i%3===0?.3:.15;
   for(let k=0;k<4;k++)g.fillRect(snap(x-k*1.5),snap(y+k*3),3,3);
  }
  for(let i=0;i<25;i++){
   const age=mod(t/2+hash(i+300),1);if(age>.2)continue;
   const x=snap(hash(i+410)*1880),y=snap(928+hash(i+501)*140);
   g.globalAlpha=.4*(1-age/.2);g.fillRect(x-snap(age*35),y-snap(age*20),3,3);g.fillRect(x+snap(age*35),y,3,3);
  }g.restore();
 },
 click(x,y,api){if(y>980&&x>1690){api.egg("street-drain","The belt heads through the drain to the koi pond.");return true;}return false;},
  mount(el, api) {
    const [lead, tail] = PRICING.title.split(/,\s*/);
    const rows = PRICING.plans.map((p) => `
      <article class="st-row ${p.hot ? "hot" : ""}">
        <div class="st-line">
          <h3>${p.name}</h3>${p.hot ? `<span class="st-pick">chef's pick</span>` : ""}
          <span class="st-dots"></span>
          <p class="st-price">${p.price}${p.unit ? `<small>${p.unit}</small>` : ""}</p>
        </div>
        <p class="st-inc">${p.included}</p>
        <a class="btn ${p.hot ? "primary" : "ghost"}" href="${p.href}" target="_blank" rel="noopener">${p.cta}</a>
      </article>`).join("");
    html(el, `
      <section class="copy st-board">
        <p class="st-open"><i></i>Open late · night delivery</p>
        <h2 class="px st-title">${tail ? `${lead},<br><em>${tail}</em>` : PRICING.title}</h2>
        <div class="st-menu">
          <span class="st-tag">Tonight's menu</span>
          ${rows}
          <i class="st-drip"></i><i class="st-drip"></i><i class="st-drip"></i>
        </div>
      </section>`);

    hotspot(el,742,590,62,58,"Bike bell",()=>{api.sfx("chime");bubble(el,650,510,"Ring ring. Delivery for main.");api.egg("street-bell","The bell is the CI notification.");});
    hotspot(el,790,595,80,82,"Headlamp",()=>{api.sfx("blip");api.egg("street-lamp","Jiro lights the way home.");});
    hotspot(el,605,355,150,146,"Jiro",()=>{api.sfx("blip");api.egg("street-jiro","Zero emissions. Carefully reviewed deliveries.");});
    hotspot(el,383,477,167,247,"Delivery boxes",()=>{api.sfx("pop");api.egg("street-cargo","The boxes are stacked in dependency order.");});
  },
};
