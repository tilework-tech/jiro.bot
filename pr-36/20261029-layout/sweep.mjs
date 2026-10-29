import { chromium } from '../../tests/browser/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
const phase=process.argv[2] || 'before';
const browser=await chromium.connectOverCDP('http://127.0.0.1:9222');
const page=await browser.contexts()[0].newPage();
await page.emulateMedia({reducedMotion:'reduce'});
const results=[];
for(const width of [3440,2560,1920,1440,1180,1024,901,900,768,390]) {
 await page.setViewportSize({width,height:1000});
 await page.goto('http://127.0.0.1:4100/',{waitUntil:'networkidle'});
 await page.evaluate(()=>document.fonts.ready);
 await page.evaluate(()=>scrollTo(0,0));
 await page.waitForTimeout(120);
 await page.screenshot({path:`.local/pr-proof/${phase}-${width}-full.png`,fullPage:true,animations:'disabled'});

 const metrics=await page.evaluate(()=>{
  const box=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}};
  const selectors=['.hero-row','.hero-copy','.hero-copy > div:last-child','.hero-media','.hc-stage','.ctable','#features','#pricing','#faq','.faq-reserve-row'];
  return {scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,boxes:Object.fromEntries(selectors.map(s=>[s,document.querySelector(s)?box(document.querySelector(s)):null])),overflow:[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+1||r.left< -1)&&getComputedStyle(e).position!=='absolute'}).slice(0,30).map(e=>({tag:e.tagName,class:e.className,...box(e)}))};
 });
 await page.locator('.hero-row').screenshot({path:`.local/pr-proof/${phase}-${width}-hero.png`});
 await page.locator('#compare').screenshot({path:`.local/pr-proof/${phase}-${width}-compare.png`});
 await page.locator('.faq-reserve').screenshot({path:`.local/pr-proof/${phase}-${width}-faq.png`});
 if([3440,2560,900,768].includes(width)) await page.locator('#features').screenshot({path:`.local/pr-proof/${phase}-${width}-features.png`});
 results.push({width,...metrics});console.log(JSON.stringify({width,scrollWidth:metrics.scrollWidth,boxes:metrics.boxes,overflow:metrics.overflow.length}));
}
await fs.writeFile(`.local/pr-proof/${phase}-metrics.json`,JSON.stringify(results,null,2));
await page.close();await browser.close();
