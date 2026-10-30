import { chromium } from '../../tests/browser/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
const context = browser.contexts()[0];
const page = await context.newPage();
const errors = [], scriptErrors = [], failures = [], httpErrors = [], buddyRequests = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push({text:msg.text(),location:msg.location()}); });
page.on('pageerror', error => scriptErrors.push(error.message));
page.on('requestfailed', req => failures.push({url:req.url(),failure:req.failure()}));
page.on('response', res => { if(res.status()>=400) httpErrors.push({url:res.url(),status:res.status()}); });
page.on('request', req => { if(/buddy/i.test(req.url())) buddyRequests.push(req.url()); });
const sections = {hero:'.hero-row',compare:'#compare',why:'#why',features:'#features',multiplayer:'#feature-multiplayer',oncall:'#feature-oncall',permissions:'#feature-permissions',pricing:'#pricing',faq:'#faq',reserve:'#reserve'};
const results=[];
for(const width of [1440,390]) {
  await page.goto("about:blank");
  await page.setViewportSize({width,height:width===1440?1000:844});
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('http://127.0.0.1:4100');
  await page.waitForLoadState('networkidle');
  await page.evaluate(()=>document.fonts.ready);
  for(const [section,selector] of Object.entries(sections)) {
    await page.locator(selector).evaluate(el=>window.scrollTo({top:scrollY+el.getBoundingClientRect().top-100,behavior:'instant'}));
    await page.waitForTimeout(600);
    const state=await page.evaluate(()=>({scrollY,buddyElements:document.querySelectorAll('[class*="buddy"], [id*="buddy"], [data-jiro-section]').length,overflow:document.documentElement.scrollWidth>innerWidth,pixelRegions:document.querySelectorAll('[data-px]').length}));
    assert.equal(state.buddyElements,0);
    assert.equal(state.overflow,false);
    assert.equal(state.pixelRegions,3);
    await page.screenshot({path:`.local/pr-proof/${width}-${section}.png`});
    results.push({width,section,...state});
  }
  await page.evaluate(()=>window.scrollTo({top:0,behavior:"instant"}));
  await page.waitForTimeout(500);
  await page.screenshot({path:`.local/pr-proof/${width}-full.png`,fullPage:true});
}
const report={results,errors,scriptErrors,failures,httpErrors,buddyRequests};
writeFileSync('.local/pr-proof/browser-proof.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
const knownFont = url => /\/fonts\/Sohne-(Buch|Halbfett)\.woff2$/.test(url);
assert.deepEqual(scriptErrors,[]);
assert.deepEqual(errors.filter(e=>!knownFont(e.location.url)),[]);
assert.deepEqual(httpErrors.filter(e=>!knownFont(e.url)),[]);
assert.deepEqual(buddyRequests,[]);
assert.deepEqual(failures.filter(e=>!knownFont(e.url)),[]);
await page.setViewportSize({width:1440,height:1000});
await page.goto('http://127.0.0.1:4100');
await browser.close();
