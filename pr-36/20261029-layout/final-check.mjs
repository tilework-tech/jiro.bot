import {chromium} from '../../tests/browser/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
const browser=await chromium.connectOverCDP('http://127.0.0.1:9222');const page=await browser.contexts()[0].newPage();await page.bringToFront();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.emulateMedia({reducedMotion:'reduce'});
for(const width of [3440,2560,1920,1440,901,390]) {
 await page.setViewportSize({width,height:1000});await page.goto('http://localhost:4100/',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
 if(width>=1440)await page.locator('#why').screenshot({path:`.local/pr-proof/after-${width}-slop.png`});
 if(width===901)await page.locator('#pricing').screenshot({path:`.local/pr-proof/after-${width}-pricing.png`});
 if([1440,390].includes(width)){
  await page.locator('#pricing').scrollIntoViewIfNeeded();
  const clip=await page.evaluate(()=>{const p=document.querySelector('#pricing').getBoundingClientRect();return{x:p.x,y:p.bottom+scrollY-130,width:p.width,height:300}});
  await page.screenshot({path:`.local/pr-proof/after-${width}-transition.png`,clip,fullPage:true});
 }
 if(width===390){await page.locator('.cscroll').evaluate(e=>e.scrollLeft=e.scrollWidth);await page.locator('#compare').screenshot({path:'.local/pr-proof/after-390-compare-right.png'});}
}
await page.emulateMedia({reducedMotion:'no-preference'});
const videos=[];
for(const width of [1440,390]){
 await page.setViewportSize({width,height:1000});await page.goto('http://localhost:4100/',{waitUntil:'networkidle'});
 for(const name of ['Multiplayer','On-call','RBAC']){
  await page.getByRole('tab',{name,exact:true}).click();
  const play=page.getByRole('button',{name:'Play video',exact:true});if(await play.count())await play.click();
  await page.waitForFunction(()=>{const v=document.querySelector('.hc-slide[data-active] video');return v&&v.readyState>=2&&v.videoWidth>0});
  await page.waitForTimeout(900);
  videos.push({width,name,...await page.locator('.hc-slide[data-active] video').evaluate(v=>({source:v.currentSrc,videoWidth:v.videoWidth,videoHeight:v.videoHeight,playing:!v.paused,time:v.currentTime}))});
  await page.getByRole('button',{name:'Pause video',exact:true}).click();
  await page.locator('.hero-row').screenshot({path:`.local/pr-proof/after-${width}-video-${name.toLowerCase()}.png`});
 }
}
console.log(JSON.stringify({errors,videos},null,2));await fs.writeFile('.local/pr-proof/live-videos.json',JSON.stringify({errors,videos},null,2));
await page.setViewportSize({width:1440,height:1000});await page.goto('http://localhost:4100/');await page.evaluate(()=>scrollTo(0,0));await browser.close();
