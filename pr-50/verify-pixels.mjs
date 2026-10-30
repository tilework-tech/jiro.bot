import { chromium } from '../../tests/browser/node_modules/playwright/index.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
const page = await browser.contexts()[0].newPage();
await page.goto('http://127.0.0.1:4100/');
const paths = ['img/favicon-16x16.png','img/favicon-32x32.png','img/favicon-48x48.png','img/apple-touch-icon.png','jiro-16px.png','img/favicon.svg'];
const results=[];
for (const path of paths) {
  const result = await page.evaluate(async path => {
    const im=new Image(); im.src=path+'?verify='+Date.now(); await im.decode();
    const size=im.naturalWidth; const c=document.createElement('canvas');c.width=c.height=size;
    const ctx=c.getContext('2d');ctx.drawImage(im,0,0);const d=ctx.getImageData(0,0,size,size).data;
    const alpha=(x,y)=>d[(y*size+x)*4+3];
    const colors={};for(let i=0;i<d.length;i+=4)if(d[i+3]===255){const rgb=[...d.slice(i,i+3)].join(',');colors[rgb]=(colors[rgb]||0)+1;}
    let symmetry=0, samples=0;
    for(let y=0;y<Math.floor(size*.45);y++)for(let x=0;x<size;x++){symmetry+=Math.abs(alpha(x,y)-alpha(size-1-x,y));samples++;}
    let holes=0;for(let y=Math.ceil(size*.25);y<Math.floor(size*.65);y++)for(let x=Math.ceil(size*.2);x<Math.floor(size*.8);x++)if(alpha(x,y)<250)holes++;
    return {path,size,corners:[alpha(0,0),alpha(size-1,0),alpha(0,size-1),alpha(size-1,size-1)],symmetry:symmetry/samples,holes,colors:Object.entries(colors).sort((a,b)=>b[1]-a[1]).slice(0,6)};
  },path);results.push(result);
}
console.log(JSON.stringify(results,null,2));
await page.close();await browser.close();
for(const r of results){assert.deepEqual(r.corners,[0,0,0,0],r.path+' transparent corners');assert.ok(r.symmetry<1,r.path+' intact symmetric upper silhouette');assert.equal(r.holes,0,r.path+' no interior cutouts');}
assert.deepEqual(readFileSync('site/jiro-16px.png'),readFileSync('site/img/favicon-16x16.png'));
const ico=readFileSync('site/favicon.ico');assert.equal(ico.readUInt16LE(4),3);
for(let i=0;i<3;i++){const p=6+i*16,size=[16,32,48][i];assert.equal(ico[p],size);assert.equal(ico[p+1],size);assert.deepEqual(ico.subarray(ico.readUInt32LE(p+12),ico.readUInt32LE(p+12)+ico.readUInt32LE(p+8)),readFileSync(`site/img/favicon-${size}x${size}.png`));}
writeFileSync('.local/pr-proof/pixel-results.json',JSON.stringify(results,null,2));
console.log('PASS: transparent corners, unbroken symmetric upper silhouette, opaque interiors, identical 16px AEO fallback, and exact 16/32/48 ICO frames.');
