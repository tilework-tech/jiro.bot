import { chromium } from '../../tests/browser/node_modules/playwright/index.mjs';
import { writeFileSync, copyFileSync } from 'node:fs';
const rad=d=>d*Math.PI/180;
const pt=d=>[50*Math.sign(Math.cos(rad(d)))*Math.abs(Math.cos(rad(d)))**.4,48*Math.sign(Math.sin(rad(d)))*Math.abs(Math.sin(rad(d)))**.4];
const points=Array.from({length:97},(_,i)=>pt(156+320*i/96));
const tail=pt(136).map((v,i)=>v+[Math.cos(rad(138)),Math.sin(rad(138))][i]*21.28);
const d=points.map((p,i)=>(i?'L':'M')+p.map(v=>v.toFixed(4)).join(' ')).join(' ')+` L${tail.map(v=>v.toFixed(4)).join(' ')} Z`;
const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-70 -70 140 140" width="180" height="180"><path d="${d}" fill="#F8F4EA" stroke="#1E3A2B" stroke-width="9.6" stroke-linejoin="round"/><g transform="scale(1.25)" fill="#FB5E45" stroke="#FB5E45" stroke-width="4.6" stroke-linecap="square" stroke-linejoin="miter"><path d="M-26 -10 L-16 -1 L-26 8 M-9 9 H9" fill="none"/><path d="M15 -11 H25 V9 H15 Z" stroke="none"/></g></svg>\n`;
writeFileSync('site/img/favicon.svg',svg);
const browser=await chromium.connectOverCDP('http://127.0.0.1:9222');
const page=await browser.contexts()[0].newPage();
const images=[];
for(const size of [16,32,48,180]){
 const data=await page.evaluate(async({svg,size})=>{const im=new Image();im.src='data:image/svg+xml;base64,'+btoa(svg);await im.decode();const c=document.createElement('canvas');c.width=c.height=size;c.getContext('2d').drawImage(im,0,0,size,size);return c.toDataURL('image/png').split(',')[1];},{svg,size});
 const png=Buffer.from(data,'base64');images.push(png);
 writeFileSync(size===180?'site/img/apple-touch-icon.png':`site/img/favicon-${size}x${size}.png`,png);
}
copyFileSync('site/img/favicon-16x16.png','site/jiro-16px.png');
const header=Buffer.alloc(6+16*3);header.writeUInt16LE(1,2);header.writeUInt16LE(3,4);
let offset=header.length;for(let i=0;i<3;i++){const p=6+i*16;header[p]=header[p+1]=[16,32,48][i];header.writeUInt16LE(1,p+4);header.writeUInt16LE(32,p+6);header.writeUInt32LE(images[i].length,p+8);header.writeUInt32LE(offset,p+12);offset+=images[i].length;}
writeFileSync('site/favicon.ico',Buffer.concat([header,...images.slice(0,3)]));
await page.close();await browser.close();
console.log('Rendered seven favicon assets from Clifford idle vector geometry.');
