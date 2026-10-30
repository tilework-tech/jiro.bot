import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const REPO = fileURLToPath(new URL("../..", import.meta.url));
const SITE = "http://127.0.0.1:4192";
let server;
let browser;

before(async () => {
  server = spawn("python3", ["tools/copy-editor/server.py", "--port", "4192"], {
    cwd: REPO,
    stdio: ["ignore", "ignore", "inherit"],
  });
  let up = false;
  for (let i = 0; i < 50 && !up; i++) {
    up = await fetch(SITE).then(r => r.ok, () => false);
    if (!up) await new Promise(r => setTimeout(r, 100));
  }
  if (!up) throw new Error(`preview server did not start on ${SITE}`);
  browser = process.env.PLAYWRIGHT_CDP_URL
    ? await chromium.connectOverCDP(process.env.PLAYWRIGHT_CDP_URL)
    : await chromium.launch();
});

after(async () => {
  await browser?.close();
  server?.kill();
});

for (const prefix of ["/", "/port/4192/"]) {
  for (const name of ["index.html", "confirmed.html", "link-expired.html", "privacy.html"]) {
    test(`${prefix}${name} serves decodable favicon and touch-icon links`, async t => {
      const page = await browser.newPage();
      t.after(() => page.close());
      await page.goto(`${SITE}${prefix}${name}`);
      const links = await page.locator('head link[rel="icon"], head link[rel="apple-touch-icon"]').evaluateAll(
        links => links.map(link => ({ href: link.getAttribute("href"), url: link.href, rel: link.rel, type: link.type, sizes: link.sizes.value })),
      );
      assert.ok(links.some(link => link.rel === "apple-touch-icon" && link.sizes === "180x180"));
      assert.ok(links.some(link => link.type === "image/svg+xml" && link.sizes === "any"));
      for (const size of [16, 32, 48]) {
        assert.ok(links.some(link => link.type === "image/png" && link.sizes === `${size}x${size}`));
      }
      assert.ok(links.some(link => link.href === "favicon.ico"));
      for (const link of links) {
        assert.ok(!/^(?:\/|[a-z]+:)/i.test(link.href), `${link.href} stays relative`);
        assert.ok(link.url.startsWith(`${SITE}${prefix}`), `${link.url} retains the preview prefix`);
        const response = await page.request.get(link.url);
        assert.equal(response.status(), 200, link.url);
        const extension = new URL(link.url).pathname.split(".").pop();
        const mime = { svg: /^image\/svg\+xml\b/, png: /^image\/png\b/, ico: /^image\/(?:x-icon|vnd\.microsoft\.icon)\b/ }[extension];
        assert.ok(mime, `supported image format: ${link.href}`);
        assert.match(response.headers()["content-type"], mime);
        const dimensions = await page.evaluate(async url => {
          const image = new Image();
          image.src = url;
          await image.decode();
          return [image.naturalWidth, image.naturalHeight];
        }, link.url);
        assert.ok(dimensions[0] > 0 && dimensions[0] === dimensions[1]);
        if (extension === "png") assert.equal(dimensions.join("x"), link.sizes);
      }
    });
  }
}

test("origin favicon and the generated pages' legacy icon are served", async () => {
  for (const [path, mime] of [["favicon.ico", /image\/(?:x-icon|vnd\.microsoft\.icon)/], ["jiro-16px.png", /image\/png/]]) {
    const response = await fetch(`${SITE}/${path}`);
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get("content-type"), mime);
    assert.ok((await response.arrayBuffer()).byteLength > 0);
  }
});
