// Record the live headed browser using CDP; no new browser/context is launched.
// FFMPEG must point to an ffmpeg binary. Install library separately if needed.
import {chromium} from 'playwright-core';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'..');
const browser=await chromium.connectOverCDP(process.env.CDP||'http://127.0.0.1:9222');
const page=await browser.contexts()[0].newPage();
await page.setViewportSize({width:1600,height:900});
await page.emulateMedia({reducedMotion:'no-preference'});
const base=process.env.BASE||'http://127.0.0.1:3201';
await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(base).origin?r.continue():r.abort());
for(const demo of ['demo2','demo4']){
 const out=resolve(root,'evidence',demo),raw=resolve(root,'frames',demo);mkdirSync(raw,{recursive:true});
 await page.goto(`${base}/${demo}/`);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(2000);
 const segs=await page.evaluate(()=>window.__segs);const errors=[];const errorHandler=e=>errors.push(e.message);page.on('pageerror',errorHandler);
 const cdp=await page.context().newCDPSession(page);let frames=[];
 cdp.on('Page.screencastFrame',ev=>{
  const filename=`frame-${String(frames.length).padStart(6,'0')}.jpg`;
  writeFileSync(resolve(raw,filename),Buffer.from(ev.data,'base64'));
  frames.push({file:filename,timestamp:ev.metadata.timestamp});
  void cdp.send('Page.screencastFrameAck',{sessionId:ev.sessionId});
 });
 await cdp.send('Page.startScreencast',{format:'jpeg',quality:85,maxWidth:1600,maxHeight:900,everyNthFrame:2});
 const trace=[];
 for(const seg of segs){
  trace.push({id:seg.id,wallTime:Date.now(),scrollStart:seg.start,length:seg.len});
  await page.evaluate(async seg=>{
   const y0=scrollY,y1=(seg.start+seg.len*(seg.id.includes('>')?.995:.75))*innerHeight;
   const duration=seg.id.includes('>')?3200:2000;
   await new Promise(done=>{const start=performance.now();const step=now=>{const t=Math.min(1,(now-start)/duration);scrollTo({top:y0+(y1-y0)*t,behavior:'instant'});if(t<1)requestAnimationFrame(step);else done();};requestAnimationFrame(step);});
  },seg);
  if(!seg.id.includes('>'))await page.waitForTimeout(seg.id==='pond'?5000:1800);
 }
 await page.waitForTimeout(600);await cdp.send('Page.stopScreencast');await cdp.detach();
 const lines=['ffconcat version 1.0'];
 for(let i=0;i<frames.length;i++){lines.push(`file '${frames[i].file}'`);if(i<frames.length-1)lines.push(`duration ${Math.max(.001,frames[i+1].timestamp-frames[i].timestamp).toFixed(6)}`);}
 const concat=resolve(raw,'frames.ffconcat');writeFileSync(concat,lines.join('\n')+'\n');
 const ff=spawnSync(process.env.FFMPEG||'ffmpeg',['-y','-loglevel','error','-threads','1','-safe','0','-i',concat,'-vf','fps=24,scale=1600:900','-c:v','libx264','-threads','1','-preset','fast','-crf','21','-pix_fmt','yuv420p','-movflags','+faststart',resolve(out,'walkthrough.mp4')],{stdio:'inherit'});
 if(ff.status!==0)throw Error('ffmpeg failed');
 writeFileSync(resolve(out,'recording.json'),JSON.stringify({browser:await browser.version(),viewport:{width:1600,height:900},capture:'CDP screencast, every second rendered frame, 24fps encoded with original frame timestamps; no audio; browser performance is not benchmarked',trace,frameCount:frames.length,durationSeconds:frames.at(-1).timestamp-frames[0].timestamp,errors},null,2)+'\n');
 page.off('pageerror',errorHandler);console.log(demo,frames.length,'frames recorded',errors);
}
await browser.close();
