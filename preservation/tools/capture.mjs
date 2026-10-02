// Run after restore.py and starting the preserved gallery on :3201.
// Uses the existing headed browser only; never starts or installs a browser.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root=resolve(import.meta.dirname,'..');
const browser=await chromium.connectOverCDP(process.env.CDP || 'http://127.0.0.1:9222');
const page=await browser.contexts()[0].newPage();
await page.setViewportSize({width:1600,height:900});
await page.emulateMedia({reducedMotion:'no-preference',colorScheme:'dark'});
const base=process.env.BASE || 'http://127.0.0.1:3201';
const errors=[], failed=[], external=[];
page.on('pageerror',e=>errors.push({url:page.url(),message:e.message}));
page.on('response',r=>{if(r.status()>=400) failed.push({url:r.url(),status:r.status()})});
await page.route('**/*',route=>{const u=new URL(route.request().url()); if(['http:','https:'].includes(u.protocol)&&u.origin!==new URL(base).origin){external.push(u.href);return route.abort();} return route.continue();});
const report={capturedAt:new Date().toISOString(),browser:await browser.version(),viewport:{width:1600,height:900},dpr:await page.evaluate(()=>devicePixelRatio),externalNetwork:'blocked',sourceCommit:'03ddbab',demos:{},errors,failed,external};
for(const demo of ['demo1','demo2','demo4','demo5']){
 const out=resolve(root,'evidence',demo);mkdirSync(out,{recursive:true});
 await page.goto(`${base}/${demo}/`); await page.waitForTimeout(1800);await page.evaluate(()=>document.fonts.ready);
 const startErrors=errors.length;
 const shots=[];
 const shot=async(name,position)=>{await page.screenshot({path:resolve(out,name+'.jpg'),type:'jpeg',quality:88});shots.push({file:name+'.jpg',position,atSeconds:await page.evaluate(()=>performance.now()/1000)});};
 if(demo==='demo1'){
  const has3d=await page.evaluate(()=>!!window.__jiro);
  if(!has3d){report.demos[demo]={has3d:false,url:page.url(),note:'WebGL unavailable; original saved 3D walkthrough remains authoritative'};continue;}
  for(let i=0;i<7;i++){await page.evaluate(i=>window.__jiro.set(i),i);await page.waitForTimeout(1000);}
  for(let i=0;i<7;i++){
   await page.evaluate(i=>window.__jiro.set(i),i);await page.waitForTimeout(250);await shot(`scene-${i}`,i);
   if(i<6)for(const f of [.1,.25,.5,.75,.9]){await page.evaluate(v=>window.__jiro.set(v),i+f);await page.waitForTimeout(220);await shot(`transition-${i}-${String(f).slice(2)}`,i+f);}
  }
 } else if(demo==='demo2'||demo==='demo4'){
  const segs=await page.evaluate(()=>window.__segs);if(!segs)throw Error(demo+' missing segments');
  for(const seg of segs){
   for(const f of seg.id.includes('>')?[.1,.25,.5,.75,.9]:[.5]){
    await page.goto(`${base}/${demo}/?seg=${encodeURIComponent(seg.id)}&tt=${f}&t=5`);await page.waitForTimeout(250);await page.evaluate(()=>document.fonts.ready);
    await shot(`${seg.id.includes('>')?'transition':'scene'}-${seg.id.replace('>','-')}-${String(f).slice(2)}`,{segment:seg.id,progress:f,engineSeconds:5});
   }
  }
  report.demos[demo]={segments:segs};
 } else {
  // Scroll events are stopped only for the capture tab so the live snap timer
  // cannot move the camera while recording an intermediate passage still.
  await page.evaluate(()=>addEventListener('scroll',e=>e.stopImmediatePropagation(),true));
  const sections=await page.locator('.scene,.pass').evaluateAll(els=>els.map(e=>({id:e.id||'pass-'+[...document.querySelectorAll('.pass')].indexOf(e),kind:e.classList.contains('pass')?'transition':'scene',top:e.getBoundingClientRect().top+scrollY,height:e.clientHeight})));
  for(const sec of sections){
   const positions=sec.kind==='scene'?[sec.top]:[.1,.25,.5,.75,.9].map(f=>sec.top+sec.height*f-450);
   for(let i=0;i<positions.length;i++){await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),positions[i]);await page.waitForTimeout(350);await shot(`${sec.kind}-${sec.id}-${i}`,{...sec,scrollY:positions[i]});}
  }
  report.demos[demo]={sections,captureOnly:'scroll event propagation suppressed to prevent idle snap during passage stills; app files unchanged'};
 }
 report.demos[demo]={...report.demos[demo],shots,fontStatus:await page.evaluate(()=>document.fonts.status),fonts:await page.evaluate(()=>[...document.fonts].filter(f=>f.status==='loaded').map(f=>({family:f.family,weight:f.weight}))),pageErrors:errors.slice(startErrors)};
 writeFileSync(resolve(root,'evidence/audit.json'),JSON.stringify(report,null,2)+'\n');
 console.log(demo,shots.length,'frames',errors.length,'errors',failed.length,'failed responses');
}
writeFileSync(resolve(root,'evidence/audit.json'),JSON.stringify(report,null,2)+'\n');
await browser.close();
if(errors.length||failed.length||external.length)process.exitCode=1;
