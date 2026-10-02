// node crop.mjs IMG x y w h scale OUT  (draws a 50px grid labelled in image coords; image assumed 1920x1080 logical)
import { chromium } from "playwright";
import fs from "fs";
const [img, x, y, w, h, s, out] = process.argv.slice(2).map((v,i)=> i===0||i===6? v : +v);
const b64 = fs.readFileSync(img).toString("base64");
const b = await chromium.launch(); const pg = await b.newPage({viewport:{width:Math.round(w*s),height:Math.round(h*s)}});
await pg.setContent(`<canvas id=c width=${Math.round(w*s)} height=${Math.round(h*s)}></canvas><style>body{margin:0}</style>`);
await pg.evaluate(async ([b64,x,y,w,h,s]) => {
  const im = new Image(); im.src = "data:image/jpeg;base64,"+b64; await im.decode();
  const k = im.naturalWidth/1920; const c = document.getElementById("c"); const g = c.getContext("2d");
  g.imageSmoothingEnabled=false; g.drawImage(im, x*k, y*k, w*k, h*k, 0, 0, w*s, h*s);
  g.font = "11px monospace";
  for (let gx = Math.ceil(x/50)*50; gx < x+w; gx+=50){ g.fillStyle = gx%100?"rgba(0,255,255,.35)":"rgba(0,255,255,.8)"; g.fillRect((gx-x)*s,0,1,h*s); if(gx%100===0){g.fillStyle="#0ff";g.fillText(gx,(gx-x)*s+2,12);} }
  for (let gy = Math.ceil(y/50)*50; gy < y+h; gy+=50){ g.fillStyle = gy%100?"rgba(255,0,255,.35)":"rgba(255,0,255,.8)"; g.fillRect(0,(gy-y)*s,w*s,1); if(gy%100===0){g.fillStyle="#f0f";g.fillText(gy,2,(gy-y)*s-2);} }
}, [b64,x,y,w,h,s]);
await pg.screenshot({path: out}); await b.close(); console.log(out);
