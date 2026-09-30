import type { SceneDef, BeltPt } from "../engine/types";
import { html, hotspot, bubble } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { PRICING } from "../content/copy";
import { streetDetails, streetFx, streetClock, CAT_POS } from "./street/details";
import { drawStreetVideo } from "./street/video";
import "./street.css";

// Original seven-second street footage recovered from nori-monorepo PR #152.
// Only the old rider/motorcycle region is reconstructed; the approved bicycle
// stays a separate sprite. No conveyor crosses this street.
const TAU=Math.PI*2, PX=3;
const mod=(a:number,b:number)=>((a%b)+b)%b;
const snap=(x:number)=>Math.round(x/PX)*PX;
const hash=(i:number)=>{const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x);};
const pts:BeltPt[]=[[150,-60,1],[150,918,1]];
for(let i=1;i<=12;i++){const a=Math.PI-i/12*Math.PI/2;pts.push([252+Math.cos(a)*102,918+Math.sin(a)*102,1]);}
pts.push([1680,1020,1]);
for(let i=1;i<=12;i++){const a=-Math.PI/2+i/12*Math.PI/2;pts.push([1680+Math.cos(a)*90,1110+Math.sin(a)*90,1]);}
pts.push([1770,1140,1]);
declareEggs(["street-bell","street-lamp","street-jiro","street-cargo","street-puddle","street-cat","street-neon"]);

export const street:SceneDef={
 id:"street",room:"Delivery",art:"art/street/street-poster.png",mood:"bustling",hold:1.6,hideBelt:true,
 belt:{pts,width:64,plate:48,fadeIn:0,fadeOut:0},
 under(g,now,api){
  const t=mod(now,24);g.save();g.imageSmoothingEnabled=false;
  drawStreetVideo(g,now,api);
  g.imageSmoothingEnabled=false;
  const rider=api.img("art/street/pedal-sheet.png");
  // The original headlight already belongs to the footage. Only its click response is added.
  const lampAge=now-streetFx.lamp;
  if(lampAge>=0&&lampAge<2){
   g.fillStyle=`rgba(246,190,99,${Math.sin(Math.PI*lampAge/2)*.12})`;
   g.beginPath();g.moveTo(861,660);g.lineTo(1920,474);g.lineTo(1920,1020);g.closePath();g.fill();
  }
  // A wet silhouette travels with the bike, broken into horizontal water bands.
  if(rider.complete && rider.naturalWidth){
   const pose=Math.floor(t/.3)%4;
   g.save();g.translate(396,1956);g.scale(1,-1);g.globalAlpha=.13;
   for(let y=810;y<978;y+=12){g.save();g.beginPath();g.rect(0,y,576,6);g.clip();g.drawImage(rider,pose*192,0,192,256,0,288,576,768);g.restore();}
   g.restore();
   g.drawImage(rider,pose*192,0,192,256,396,288,576,768);
  }
  // Small bright spoke pixels rotate without redrawing the rim or bicycle geometry.
  for(const [x,y] of [[531,867],[867,867]])for(let i=0;i<6;i++){
   const a=t*TAU/1.2+i*TAU/6;g.fillStyle="rgba(214,220,204,.35)";
   for(let r=24;r<87;r+=9)g.fillRect(snap(x+Math.cos(a)*r),snap(y+Math.sin(a)*r),3,3);
  }
  // Shallow tire spray and ripples stay in the foreground while the shops pass.
  for(let i=0;i<18;i++){
   const f=mod(t/.6+hash(i),1),x=(i%2?531:867)-f*90;
   g.globalAlpha=(1-f)*.4;g.fillStyle="#b8c7cd";
   g.fillRect(snap(x),snap(963-Math.sin(f*Math.PI)*18),6,3);
  }
  g.globalAlpha=1;
  streetDetails(g,now);
  g.restore();
 },
 click(x,y,api){
  if(y>828&&y<990&&!(x>350&&x<945)){
   streetFx.rx=x;streetFx.ry=y;streetFx.ripple=streetClock();
   api.sfx("splash");api.egg("street-puddle","You stepped in a puddle. Your sock is now eventually consistent.");return true;
  }
  if(y>90&&y<800&&x>950){api.sfx("blip");api.egg("street-neon","Every shop on this street is open late. Most are cron jobs with a noren.");return true;}
  return false;
 },
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

    hotspot(el,788,630,54,58,"Bike bell",()=>{streetFx.bell=streetClock();api.sfx("chime");bubble(el,650,510,"Ring ring. Delivery for main.");api.egg("street-bell","The bell is the CI notification.");});
    hotspot(el,840,630,66,82,"Headlamp",()=>{streetFx.lamp=streetClock();api.sfx("blip");bubble(el,858,500,"High beams: now with full observability.");api.egg("street-lamp","Jiro's headlamp is the only light in town with 100% uptime.");});
    hotspot(el,608,363,165,165,"Jiro",()=>{streetFx.blink=streetClock();api.sfx("blip");bubble(el,550,240,"Tips? I only accept well-scoped tickets.");api.egg("street-jiro","Zero emissions. Carefully reviewed deliveries.");});
    hotspot(el,419,492,190,247,"Delivery boxes",()=>{api.sfx("pop");bubble(el,330,300,"Five orders, one route. Batched, never cold.");api.egg("street-cargo","The boxes are stacked in dependency order.");});
    hotspot(el,CAT_POS.x-6,CAT_POS.y-9,57,57,"Cat on the boxes",()=>{streetFx.cat=streetClock();api.sfx("meow");bubble(el,350,285,"(the cat is supervising the delivery)");api.egg("street-cat","The cat rides for free. In return it reviews every order.");});
  },
};
