/** Real UI checks through the session's existing headed Chrome, without dependencies. */
import assert from 'node:assert/strict';
import { mkdtempSync, cpSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
const repo = resolve(import.meta.dirname, '..');
const root = mkdtempSync(join(tmpdir(), 'jiro-browser-'));
const site = resolve(repo, '../../site');
for (const item of ['index.html', 'css', 'js', 'fonts', 'img', 'video']) cpSync(join(site, item), join(root, item), { recursive: true });
execFileSync('git', ['init', '-q', '-b', 'browser-test'], { cwd: root });
execFileSync('git', ['add', 'index.html'], { cwd: root });
execFileSync('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.test', 'commit', '-qm', 'Original'], { cwd: root });
const server = spawn('python3', [join(repo, 'server.py'), '--root', root, '--port', '4101', '--edit'], { stdio: 'ignore' });
const targets = [];
const browserErrors = [];
let socket;
let id = 0;
const requests = new Map();
function cdp(method, params = {}, sessionId) {
  return new Promise((resolve, reject) => {
    const key = ++id;
    const timeout = setTimeout(() => { requests.delete(key); reject(new Error(`CDP timeout: ${method}`)); }, 15000);
    requests.set(key, { resolve, reject, timeout });
    socket.send(JSON.stringify({ id: key, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
}
async function evaluate(session, expression) {
  const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, session);
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
}
async function wait(session, expression) {
  for (let i = 0; i < 150; i++) {
    if (await evaluate(session, expression)) return;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw new Error(`UI condition failed: ${expression}; status: ${await evaluate(session, 'document.querySelector("#copy-status")?.textContent')}`);
}
async function page(width = 1440) {
  const { targetId } = await cdp('Target.createTarget', { url: 'about:blank' });
  targets.push(targetId);
  const { sessionId } = await cdp('Target.attachToTarget', { targetId, flatten: true });
  await cdp('Page.enable', {}, sessionId);
  await cdp('Runtime.enable', {}, sessionId);
  await cdp('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width < 500 }, sessionId);
  await cdp('Page.navigate', { url: 'http://127.0.0.1:4101/port/4101/' }, sessionId);
  await wait(sessionId, 'document.querySelector("#copy-save") && !document.querySelector("#copy-save").disabled');
  return sessionId;
}
async function type(session, text) {
  await evaluate(session, `(() => { const el = document.querySelector('h1 [data-copy-id]'); el.focus(); const range = document.createRange(); range.selectNodeContents(el); const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range); })()`);
  await cdp('Input.insertText', { text }, session);
}
async function click(session, selector) {
  await evaluate(session, `document.querySelector(${JSON.stringify(selector)}).click()`);
}
async function save(session, expected) {
  await click(session, '#copy-save');
  await wait(session, `document.querySelector('#copy-status')?.textContent.startsWith('Saved') && document.querySelector('h1 [data-copy-id]')?.textContent === ${JSON.stringify(expected)}`);
}
async function reload(session) {
  await evaluate(session, 'document.documentElement.dataset.reloadTest = "pending"');
  await cdp('Page.reload', {}, session);
  await wait(session, '!document.documentElement.dataset.reloadTest && document.readyState === "complete" && document.querySelector("#copy-save") && !document.querySelector("#copy-save").disabled');
}
try {
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch('http://127.0.0.1:4101/')).ok) break; } catch {}
    await new Promise(resolve => setTimeout(resolve, 30));
  }
  const metadata = await (await fetch('http://127.0.0.1:9222/json/version')).json();
  socket = new WebSocket(metadata.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') browserErrors.push(message.params.exceptionDetails.text);
    if (!message.id) return;
    const request = requests.get(message.id);
    if (!request) return;
    requests.delete(message.id);
    clearTimeout(request.timeout);
    if (message.error) request.reject(new Error(JSON.stringify(message.error))); else request.resolve(message.result);
  };
  const first = await page();
  await wait(first, 'document.querySelector(".hero-media video")?.videoWidth === 1200');
  assert.equal(await evaluate(first, 'document.querySelector(".hero-media video").videoHeight'), 960);
  const headingText = await evaluate(first, `(() => { const heading = document.querySelector('h1'); const clone = heading.cloneNode(true); for (const span of clone.querySelectorAll('[data-copy-id]')) span.replaceWith(...span.childNodes); clone.style.position = 'absolute'; clone.style.top = '-10000px'; document.body.append(clone); const expected = clone.innerText; clone.remove(); return { expected, actual: heading.innerText }; })()`);
  assert.equal(headingText.actual, headingText.expected, 'Editing preserves the original headline whitespace');
  const beforeAppend = await evaluate(first, 'document.querySelector("h1 [data-copy-id]").innerText');
  const breakCount = await evaluate(first, 'document.querySelectorAll("h1 br").length');
  await evaluate(first, `(() => { const el = document.querySelector('h1 [data-copy-id]'); el.focus(); const range = document.createRange(); range.selectNodeContents(el); range.collapse(false); const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range); })()`);
  await cdp('Input.insertText', { text: 'copy-check ' }, first);
  await save(first, beforeAppend + 'copy-check ');
  await reload(first);
  assert.equal(await evaluate(first, 'document.querySelectorAll("h1 br").length'), breakCount);
  await type(first, 'Reviewed & ready ');
  await save(first, 'Reviewed & ready ');
  await reload(first);
  assert.equal(await evaluate(first, 'document.querySelector("h1 [data-copy-id]").textContent'), 'Reviewed & ready ');
  assert.match(readFileSync(join(root, 'index.html'), 'utf8'), /Reviewed &amp; ready /);
  assert.equal(await evaluate(first, '!!document.querySelector("h1 .hot")'), true);
  await type(first, 'Unsaved draft');
  await click(first, '#copy-discard');
  assert.equal(await evaluate(first, 'document.querySelector("h1 [data-copy-id]").textContent'), 'Reviewed & ready ');
  await click(first, '#copy-mode');
  assert.equal(await evaluate(first, 'document.querySelector("h1 [data-copy-id]").contentEditable'), 'false');
  await click(first, '#copy-mode');
  await click(first, '#copy-changes');
  await wait(first, 'document.querySelector("#copy-dialog pre").textContent.includes("Reviewed &amp; ready")');
  await click(first, '#copy-dialog button');
  assert.equal(await evaluate(first, 'document.querySelectorAll("[data-text] [data-copy-id], .fpanel [data-copy-id], [data-px] [data-copy-id]").length'), 0);
  assert.equal(await evaluate(first, 'document.querySelectorAll("details:not([open])").length'), 0);
  const other = await page();
  await type(first, 'First editor');
  await save(first, 'First editor');
  await type(other, 'Second editor');
  await click(other, '#copy-save');
  await wait(other, 'document.querySelector("#copy-status").textContent.includes("changed")');
  assert.match(readFileSync(join(root, 'index.html'), 'utf8'), /First editor/);
  const mobile = await page(390);
  assert.ok(await evaluate(mobile, '(() => { const r = document.querySelector("#copy-toolbar").getBoundingClientRect(); return r.x >= 0 && r.right <= innerWidth; })()'));
  await type(mobile, 'Mobile edit');
  await save(mobile, 'Mobile edit');
  await reload(mobile);
  assert.equal(await evaluate(mobile, 'document.querySelector("h1 [data-copy-id]").textContent'), 'Mobile edit');
  await type(mobile, 'Line one');
  await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 }, mobile);
  await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 }, mobile);
  await cdp('Input.insertText', { text: 'Line two' }, mobile);
  await click(mobile, '#copy-mode');
  await save(mobile, 'Line one');
  await reload(mobile);
  assert.match(await evaluate(mobile, 'document.querySelector("h1").innerText'), /Line one\nLine two/);
  await type(mobile, 'Guarded save');
  await cdp('Network.enable', {}, mobile);
  await cdp('Network.emulateNetworkConditions', { offline: false, latency: 500, downloadThroughput: -1, uploadThroughput: -1 }, mobile);
  await click(mobile, '#copy-save');
  await click(mobile, '#copy-mode');
  await click(mobile, '#copy-mode');
  assert.equal(await evaluate(mobile, 'document.querySelector("h1 [data-copy-id]").contentEditable'), 'false');
  await wait(mobile, 'document.querySelector("#copy-status")?.textContent.startsWith("Saved") && document.querySelector("h1 [data-copy-id]")?.textContent === "Guarded save"');
  assert.deepEqual(browserErrors, []);
  console.log('PASS: desktop/mobile real typing and persistence; inline styles; discard; preview; diff; dynamic exclusions; FAQ access; stale-save protection.');
} finally {
  for (const targetId of targets) await cdp('Target.closeTarget', { targetId });
  if (socket) socket.close();
  server.kill();
  await new Promise(resolve => server.once('exit', resolve));
  rmSync(root, { recursive: true, force: true });
}
