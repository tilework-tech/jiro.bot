/** Review-only favicon exports. Run with the session's headed Chrome on :9222. */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const original = await readFile(new URL('../site/img/jiro-v3.svg', import.meta.url), 'utf8');
const mascot = original.slice(original.indexOf('<g id="jiro"'), original.lastIndexOf('</svg>')).replace(' shape-rendering="crispEdges"', '');
const svg = (content, viewBox = '0 0 64 64') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="180" height="180">${content}</svg>`;
const tile = (fill) => `<rect x="0" y="0" width="64" height="64" rx="15" fill="${fill}"/>`;
const framed = (scale, x, y, content = mascot) => `<g transform="translate(${x} ${y}) scale(${scale})">${content}</g>`;
const mono = `<path d="M32 4C16.5 4 5 15.5 5 30c0 6.7 2 12 6 17L5 59l15-5c4 3 8 4 13 4 15 0 27-12 27-27 0-4-1-8-2-11l-7 1 1-8-8 1 1-7C41 5 36 4 32 4Z" fill="#161616" stroke="#FAF8F2" stroke-width="2"/>
<path d="m16 24 8 8-8 8" fill="none" stroke="#FAF8F2" stroke-width="4" stroke-linejoin="miter"/>
<path d="M29 38h10v4H29zM44 26h8v12h-8z" fill="#FAF8F2"/>`;
const signal = `<path d="M33 3C17 3 4 15 4 31c0 6 2 12 6 17L4 60l16-6c4 3 8 4 13 4 16 0 28-12 28-28 0-4-1-8-3-12l-7 1 1-7-8 1 1-7C41 4 37 3 33 3Z" fill="#FB5E45"/>
<path d="m16 23 9 9-9 9" fill="none" stroke="#FAF8F2" stroke-width="4" stroke-linejoin="miter"/>
<path d="M30 38h10v4H30zM45 25h8v13h-8z" fill="#FAF8F2"/>`;
const choices = [
  {id:'01-bubble', name:'Original bubble', rationale:'The familiar round Jiro mark, with its terminal face and speech tail floating freely.', svg:svg(framed(1,1,5))},
  {id:'02-white', name:'Porcelain', rationale:'A white squircle gives the full-color mascot a stable, quiet backing in either browser theme.', svg:svg(tile('#FFFFFF')+framed(.84,6,9))},
  {id:'03-carbon', name:'Carbon', rationale:'A carbon tile and fine cream separation keep the full-color bubble distinct on dark chrome.'},
  {id:'04-orange', name:'Jiro orange', rationale:'The site’s #FB5E45 accent frames the cream-and-green mascot as a bright but contained tab marker.', svg:svg(tile('#FB5E45')+framed(.84,6,9))},
  {id:'05-mono', name:'Terminal glyph', rationale:'A heavier monochrome silhouette and pixel-aligned terminal face prioritize recognition at 16px.', svg:svg(mono)},
  {id:'06-signal', name:'Ember bubble', rationale:'A direct two-tone orange speech bubble turns the terminal face into a compact, distinctive stamp.', svg:svg(signal)},
];

// A flat keyline around the dark tile's green outline separates the two dark fills.
choices[2].svg = svg(tile('#0A0A0A') + `<defs><filter id="rim" x="-10%" y="-10%" width="120%" height="120%"><feMorphology in="SourceAlpha" operator="dilate" radius="1.2" result="dilated"/><feFlood flood-color="#FAF8F2"/><feComposite in2="dilated" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g filter="url(#rim)">${framed(.84,6,9)}</g>`);

const tabs = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const target = tabs.find(t => t.type === 'page');
if (!target) throw new Error('Start nori-browser before rendering.');
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
let next = 0;
const pending = new Map();
socket.onmessage = ({data}) => {
  const message = JSON.parse(data);
  const task = pending.get(message.id);
  if (!task) return;
  clearTimeout(task.timer);
  pending.delete(message.id);
  if (message.error) task.reject(new Error(JSON.stringify(message.error)));
  else task.resolve(message.result);
};
function cdp(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++next;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Timed out: ${method}`)); }, 15000);
    pending.set(id, {resolve, reject, timer});
    socket.send(JSON.stringify({id, method, params}));
  });
}
async function evaluate(expression) {
  const r = await cdp('Runtime.evaluate', {expression, awaitPromise:true, returnByValue:true});
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
}
function icoFrame(size, rgba) {
  const maskStride = Math.ceil(size / 32) * 4;
  const dib = Buffer.alloc(40 + size * size * 4 + maskStride * size);
  dib.writeUInt32LE(40, 0);
  dib.writeInt32LE(size, 4);
  dib.writeInt32LE(size * 2, 8);
  dib.writeUInt16LE(1, 12);
  dib.writeUInt16LE(32, 14);
  dib.writeUInt32LE(size * size * 4 + maskStride * size, 20);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const src = (y * size + x) * 4;
    const dst = 40 + ((size - 1 - y) * size + x) * 4;
    dib[dst] = rgba[src+2]; dib[dst+1] = rgba[src+1]; dib[dst+2] = rgba[src]; dib[dst+3] = rgba[src+3];
    if (rgba[src+3] === 0) dib[40 + size*size*4 + (size-1-y)*maskStride + (x>>3)] |= 1 << (7-(x%8));
  }
  return dib;
}
function packIco(frames) {
  const directory = Buffer.alloc(6 + frames.length * 16);
  directory.writeUInt16LE(1, 2); directory.writeUInt16LE(frames.length, 4);
  let offset = directory.length;
  frames.forEach(({size, data}, i) => {
    const entry = 6 + i*16;
    directory[entry] = size; directory[entry+1] = size;
    directory.writeUInt16LE(1, entry+4); directory.writeUInt16LE(32, entry+6);
    directory.writeUInt32LE(data.length, entry+8); directory.writeUInt32LE(offset, entry+12);
    offset += data.length;
  });
  return Buffer.concat([directory, ...frames.map(f=>f.data)]);
}

await cdp('Emulation.setDeviceMetricsOverride', {width:1100, height:376, deviceScaleFactor:1, mobile:false});
for (const choice of choices) {
  const dir = join(root, choice.id);
  await mkdir(dir, {recursive:true});
  await writeFile(join(dir,'source.svg'), choice.svg+'\n');
  const frames = [];
  for (const size of [16,32,48,180]) {
    // The 16px mono face lands its horizontal edges on the actual pixel grid.
    const source = choice.id === '05-mono' && size === 16
      ? choice.svg.replace('M29 38h10v4H29zM44 26h8v12h-8z', 'M28 40h12v4H28zM44 24h8v12h-8z')
      : choice.svg;
    if (source !== choice.svg) await writeFile(join(dir,'source-16.svg'),source+'\n');
    const result = await evaluate(`(async () => {
      const image = new Image(); image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(${JSON.stringify(source)});
      await image.decode();
      const c = document.createElement('canvas'); c.width = c.height = ${size};
      const ctx = c.getContext('2d'); ctx.drawImage(image,0,0,${size},${size});
      return {png:c.toDataURL('image/png').split(',')[1], rgba:Array.from(ctx.getImageData(0,0,${size},${size}).data)};
    })()`);
    await writeFile(join(dir,`${size}.png`),Buffer.from(result.png,'base64'));
    if (size < 180) frames.push({size,data:icoFrame(size,result.rgba)});
  }
  await writeFile(join(dir,'favicon.ico'),packIco(frames));
  console.log(`${choice.id}: SVG, 16/32/48/180 PNG, 16/32/48 ICO`);
}
await writeFile(join(root,'manifest.json'),JSON.stringify(choices.map(({svg,...c})=>c),null,2)+'\n');

const mockupTemplate = await readFile(join(root,'tab-template.html'),'utf8');
for (const [index, choice] of choices.entries()) {
  const icon = await readFile(join(root,choice.id,'16.png'));
  const html = mockupTemplate.replaceAll('{{ICON}}',`data:image/png;base64,${icon.toString('base64')}`).replaceAll('{{NAME}}', `${String(index+1).padStart(2,'0')} / ${choice.name}`);
  await cdp('Page.navigate',{url:'about:blank'});
  await evaluate(`document.open(); document.write(${JSON.stringify(html)}); document.close();`);
  await evaluate(`Promise.all([...document.images].map(i=>i.decode())).then(()=>document.fonts.ready).then(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))`);
  const metrics = await evaluate(`({dpr:devicePixelRatio,icons:[...document.querySelectorAll('.favicon')].map(i=>({width:i.width,height:i.height,naturalWidth:i.naturalWidth,x:i.getBoundingClientRect().x,y:i.getBoundingClientRect().y}))})`);
  if (metrics.dpr !== 1 || metrics.icons.some(i=>i.width!==16||i.height!==16||i.naturalWidth!==16||i.x%1||i.y%1)) throw new Error(JSON.stringify(metrics));
  const shot = await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  await writeFile(join(root,choice.id,'tabs.png'),Buffer.from(shot.data,'base64'));
  console.log(`${choice.id}: 1100×376 mockup, two exact 16×16 icons at 1×`);
}
socket.close();
