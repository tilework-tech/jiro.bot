import type { SceneDef, BeltPt } from "../engine/types";
import { html, hotspot, bubble } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { PRICING } from "../content/copy";
import "./street.css";

// Reference recording: fixed rider, passing close shopfronts and a deep lantern alley.
// A repeating panorama and four bicycle poses keep motion independent of scroll.
// All ambient periods divide 24 seconds; the conveyor retains its own steady clock.
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
 id:"street",room:"Delivery",art:"art/street/panorama.png",mood:"bustling",hold:1.6,
 belt:{pts,width:64,plate:48,fadeIn:0,fadeOut:0},
 under(g,now,api){
  const t=mod(now,24);g.save();g.imageSmoothingEnabled=false;
  const bg=api.img("art/street/panorama.png"), rider=api.img("art/street/pedal-sheet.png");
  // 1080 native pixels at exactly 3x. A foreground drainpipe hides the tile join.
  const width=3240, shift=snap(mod(t/12*width,width));
  g.fillStyle="#101b28";g.fillRect(0,0,1920,1080);
  if(bg.complete && bg.naturalWidth)for(let x=-shift;x<1920;x+=width){
   g.drawImage(bg,x,0,width,1080);
   g.fillStyle="#101c29";g.fillRect(x-18,0,36,816);
   g.fillStyle="#2d3e49";g.fillRect(x-9,0,9,816);
   g.fillStyle="#43525a";g.fillRect(x,0,3,816);
   for(let y=96;y<810;y+=240){g.fillStyle="#101923";g.fillRect(x-24,y,48,12);}
   g.fillStyle="#14232e";g.fillRect(x-27,816,54,9);
  }
  // Warm light projects ahead of the fixed rider; hard bands retain the pixel grid.
  for(let i=0;i<5;i++){
   g.fillStyle=`rgba(246,190,99,${.026+i*.004})`;
   g.beginPath();g.moveTo(825,600);g.lineTo(1920,420+i*27);g.lineTo(1920,984-i*24);g.closePath();g.fill();
  }
  // A wet silhouette travels with the bike, broken into horizontal water bands.
  if(rider.complete && rider.naturalWidth){
   const pose=Math.floor(t/.3)%4;
   g.save();g.translate(360,1836);g.scale(1,-1);g.globalAlpha=.13;
   for(let y=750;y<918;y+=12){g.save();g.beginPath();g.rect(0,y,576,6);g.clip();g.drawImage(rider,pose*192,0,192,256,0,228,576,768);g.restore();}
   g.restore();
   g.drawImage(rider,pose*192,0,192,256,360,228,576,768);
  }
  // Small bright spoke pixels rotate without redrawing the rim or bicycle geometry.
  for(const [x,y] of [[495,807],[831,807]])for(let i=0;i<6;i++){
   const a=t*TAU/1.2+i*TAU/6;g.fillStyle="rgba(214,220,204,.35)";
   for(let r=24;r<87;r+=9)g.fillRect(snap(x+Math.cos(a)*r),snap(y+Math.sin(a)*r),3,3);
  }
  // Shallow tire spray and ripples stay in the foreground while the shops pass.
  for(let i=0;i<18;i++){
   const f=mod(t/.6+hash(i),1),x=(i%2?495:831)-f*90;
   g.globalAlpha=(1-f)*.4;g.fillStyle="#b8c7cd";
   g.fillRect(snap(x),snap(903-Math.sin(f*Math.PI)*18),6,3);
  }
  g.globalAlpha=1;
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

    hotspot(el,752,600,62,58,"Bike bell",()=>{api.sfx("chime");bubble(el,650,510,"Ring ring. Delivery for main.");api.egg("street-bell","The bell is the CI notification.");});
    hotspot(el,804,600,80,82,"Headlamp",()=>{api.sfx("blip");api.egg("street-lamp","Jiro lights the way home.");});
    hotspot(el,572,303,165,165,"Jiro",()=>{api.sfx("blip");api.egg("street-jiro","Zero emissions. Carefully reviewed deliveries.");});
    hotspot(el,383,432,190,247,"Delivery boxes",()=>{api.sfx("pop");api.egg("street-cargo","The boxes are stacked in dependency order.");});
  },
};
