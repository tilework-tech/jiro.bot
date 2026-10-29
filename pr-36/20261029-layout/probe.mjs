import {chromium} from '../../tests/browser/node_modules/playwright/index.mjs';
const browser=await chromium.connectOverCDP('http://127.0.0.1:9222');const page=await browser.contexts()[0].newPage();await page.emulateMedia({reducedMotion:'reduce'});
for(const width of [3440,2560,1920,1440,1180,1024,901,900,768,390]){
await page.setViewportSize({width,height:1000});await page.goto('http://127.0.0.1:4100/');await page.evaluate(()=>document.fonts.ready);
console.log(JSON.stringify({width,clipped:await page.evaluate(()=>[...document.querySelectorAll('.crow > *, .fpanel *, .nav-links, .nav-cta, .faq-col, .reserve-col')].filter(e=>e.scrollHeight>e.clientHeight+2||e.scrollWidth>e.clientWidth+2).map(e=>({tag:e.tagName,class:e.className,text:e.innerText?.slice(0,100),h:e.clientHeight,sh:e.scrollHeight,w:e.clientWidth,sw:e.scrollWidth}))),rows:await page.locator('.crow .cj').evaluateAll(es=>es.map(e=>({height:e.getBoundingClientRect().height,textHeight:e.firstElementChild.getBoundingClientRect().height})))}));
if([901,390].includes(width))await page.locator('#compare').screenshot({path:`.local/pr-proof/before-${width}-compare.png`});
if([3440,900].includes(width))await page.locator('#features').screenshot({path:`.local/pr-proof/before-${width}-features.png`});
if(width===1440){await page.locator('.typing').screenshot({path:'.local/pr-proof/before-1440-typing.png'});await page.locator('#pricing + div').screenshot({path:'.local/pr-proof/before-1440-pricing-note.png'});}
}
await page.close();await browser.close();
