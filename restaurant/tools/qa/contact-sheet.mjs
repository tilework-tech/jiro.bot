// usage: node contact-sheet.mjs DIR OUT.png [PREFIX]  (tiles all PNGs in DIR named PREFIX@*.png, sorted by tt, 2 columns x 800px,
//        each labelled with its tt; PREFIX defaults to any seg, e.g. "dining-kitchen" for seg.mjs output of dining>kitchen)
import { chromium } from "playwright";
import fs from "fs";
const [dir, out, prefix = "[^@]+"] = process.argv.slice(2);
const fl = fs.readdirSync(dir).filter(f => new RegExp(`^${prefix}@.*\\.png$`).test(f)).sort((a,b)=>parseFloat(a.split("@")[1])-parseFloat(b.split("@")[1]));
const html = `<body style="margin:0;background:#222;display:grid;grid-template-columns:repeat(2,800px);gap:4px;font:20px monospace;color:#fff">` +
 fl.map(f=>`<div style="position:relative"><img src="data:image/png;base64,${fs.readFileSync(dir+"/"+f).toString("base64")}" style="width:800px;display:block"><span style="position:absolute;left:6px;top:4px;background:#000a">${f.split("@")[1].replace(".png","")}</span></div>`).join("")+"</body>";
const b = await chromium.launch(); const pg = await b.newPage({viewport:{width:1604,height:400}});
await pg.setContent(html); await pg.screenshot({path: out, fullPage: true}); await b.close(); console.log(out);
